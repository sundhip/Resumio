"""Exact and near-duplicate detection within and across datasets.

Uses SHA-256 for exact match detection and MinHash + LSH (Locality Sensitive Hashing)
to find near-duplicate text candidates above a specified Jaccard similarity threshold.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from typing import Dict, List, Set, Tuple


def compute_sha256(text: str) -> str:
    """Computes SHA-256 hash of a normalized string."""
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()


def get_shingles(text: str, k: int = 3) -> Set[str]:
    """Extracts character or word k-shingles from text."""
    # Tokenize by word characters for robust word shingles
    tokens = re.findall(r"\w+", text.lower())
    if len(tokens) < k:
        return {" ".join(tokens)} if tokens else set()
    return {" ".join(tokens[i : i + k]) for i in range(len(tokens) - k + 1)}


def jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
    """Computes true Jaccard similarity between two shingle sets."""
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return intersection / union if union > 0 else 0.0


class MinHasher:
    """Computes MinHash signatures for shingle sets using linear hash functions."""

    def __init__(self, num_perm: int = 64, seed: int = 42):
        self.num_perm = num_perm
        self.seed = seed
        # Generate deterministic random coefficients (a, b) for hash functions (a*x + b) % p
        # Large prime
        self.p = 2147483647
        import random

        rng = random.Random(seed)
        self.a = [rng.randint(1, self.p - 1) for _ in range(num_perm)]
        self.b = [rng.randint(0, self.p - 1) for _ in range(num_perm)]

    def compute_signature(self, shingles: Set[str]) -> List[int]:
        """Computes the MinHash signature of a set of shingles."""
        if not shingles:
            return [0] * self.num_perm
        
        # Hash each shingle to an integer
        shingle_hashes = [
            int(hashlib.md5(s.encode("utf-8")).hexdigest(), 16) % self.p
            for s in shingles
        ]

        signature = []
        for i in range(self.num_perm):
            min_hash = self.p + 1
            ai = self.a[i]
            bi = self.b[i]
            for sh in shingle_hashes:
                h = (ai * sh + bi) % self.p
                if h < min_hash:
                    min_hash = h
            signature.append(min_hash)
        return signature


class LSHIndex:
    """Locality Sensitive Hashing index for banding MinHash signatures."""

    def __init__(self, num_perm: int = 64, num_bands: int = 16):
        assert num_perm % num_bands == 0, "num_perm must be divisible by num_bands"
        self.num_perm = num_perm
        self.num_bands = num_bands
        self.rows_per_band = num_perm // num_bands
        # Buckets: band_idx -> bucket_key -> list of record_ids
        self.buckets: List[Dict[str, List[str]]] = [{} for _ in range(num_bands)]
        self.signatures: Dict[str, List[int]] = {}
        self.shingles_store: Dict[str, Set[str]] = {}

    def insert(self, record_id: str, signature: List[int], shingles: Set[str]) -> None:
        self.signatures[record_id] = signature
        self.shingles_store[record_id] = shingles
        for b in range(self.num_bands):
            start = b * self.rows_per_band
            end = start + self.rows_per_band
            band_chunk = tuple(signature[start:end])
            bucket_key = hashlib.md5(str(band_chunk).encode("utf-8")).hexdigest()
            if bucket_key not in self.buckets[b]:
                self.buckets[b][bucket_key] = []
            self.buckets[b][bucket_key].append(record_id)

    def query_candidates(self, record_id: str) -> Set[str]:
        """Returns candidate record_ids that share at least one LSH bucket."""
        signature = self.signatures.get(record_id)
        if not signature:
            return set()
        candidates = set()
        for b in range(self.num_bands):
            start = b * self.rows_per_band
            end = start + self.rows_per_band
            band_chunk = tuple(signature[start:end])
            bucket_key = hashlib.md5(str(band_chunk).encode("utf-8")).hexdigest()
            for neighbor_id in self.buckets[b].get(bucket_key, []):
                if neighbor_id != record_id:
                    candidates.add(neighbor_id)
        return candidates


@dataclass
class DeduplicationReport:
    """Summary of exact and near duplicate findings."""
    total_records: int = 0
    unique_records: int = 0
    exact_duplicates_dropped: int = 0
    near_duplicates_found: int = 0
    cross_dataset_leakage_pairs: int = 0
    intra_dataset_pairs: int = 0
    duplicate_groups: List[List[str]] = field(default_factory=list)


def deduplicate_records(
    records: List[Dict[str, str]],
    id_key: str = "id",
    text_key: str = "text",
    source_key: str = "source",
    jaccard_threshold: float = 0.85,
    num_perm: int = 64,
    num_bands: int = 16,
) -> Tuple[List[Dict[str, str]], DeduplicationReport]:
    """Finds exact and near-duplicates within and across datasets.

    Args:
        records: List of dicts representing data rows.
        id_key: Field containing unique ID.
        text_key: Field containing text to deduplicate.
        source_key: Field containing dataset source.
        jaccard_threshold: Minimum true Jaccard similarity to treat as duplicate.
        num_perm: MinHash permutations.
        num_bands: LSH bands.

    Returns:
        Tuple of (deduplicated records, deduplication report).
    """
    report = DeduplicationReport(total_records=len(records))
    exact_seen_hashes: Dict[str, str] = {}  # sha256 -> record_id
    exact_dropped_ids: Set[str] = set()

    # Step 1: Exact deduplication by SHA-256
    exact_filtered = []
    for rec in records:
        r_id = rec[id_key]
        raw = rec.get(text_key, "")
        sha = compute_sha256(raw)
        if sha in exact_seen_hashes:
            exact_dropped_ids.add(r_id)
            report.exact_duplicates_dropped += 1
            # Check if cross-dataset
            orig_id = exact_seen_hashes[sha]
            # Find orig record source
            report.log_pair = True
        else:
            exact_seen_hashes[sha] = r_id
            exact_filtered.append(rec)

    # Step 2: Near-duplicate detection with MinHash & LSH
    minhasher = MinHasher(num_perm=num_perm)
    lsh = LSHIndex(num_perm=num_perm, num_bands=num_bands)

    record_map = {rec[id_key]: rec for rec in exact_filtered}
    for rec in exact_filtered:
        r_id = rec[id_key]
        shingles = get_shingles(rec.get(text_key, ""), k=3)
        sig = minhasher.compute_signature(shingles)
        lsh.insert(r_id, sig, shingles)

    checked_pairs: Set[Tuple[str, str]] = set()
    near_dup_dropped_ids: Set[str] = set()

    for rec in exact_filtered:
        r_id = rec[id_key]
        if r_id in near_dup_dropped_ids:
            continue
        candidates = lsh.query_candidates(r_id)
        for cand_id in candidates:
            pair = tuple(sorted([r_id, cand_id]))
            if pair in checked_pairs:
                continue
            checked_pairs.add(pair)

            sim = jaccard_similarity(
                lsh.shingles_store[r_id], lsh.shingles_store[cand_id]
            )
            if sim >= jaccard_threshold:
                report.near_duplicates_found += 1
                source_a = record_map[r_id].get(source_key, "")
                source_b = record_map[cand_id].get(source_key, "")
                if source_a != source_b:
                    report.cross_dataset_leakage_pairs += 1
                else:
                    report.intra_dataset_pairs += 1

                # Drop the second item in the pair to retain unique cluster representative
                near_dup_dropped_ids.add(cand_id)

    final_kept = [
        rec for rec in exact_filtered if rec[id_key] not in near_dup_dropped_ids
    ]
    report.unique_records = len(final_kept)
    return final_kept, report
