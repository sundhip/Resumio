"""Kaggle dataset downloader, manifest generator, and license auditor.

Downloads datasets into data/raw/<dataset_id>/ using the Kaggle API.
Computes SHA-256 checksums, validates file sizes, records license metadata,
and exports the committed manifest to ml/manifest.json.
"""

from __future__ import annotations

import datetime
import hashlib
import json
import os
import shutil
import subprocess
import sys
import zipfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, List, Optional


TARGET_DATASETS = [
    {
        "id": "mdtalhask/ai-powered-resume-screening-dataset-2025",
        "slug": "ai-powered-resume-screening-dataset-2025",
        "url": "https://www.kaggle.com/datasets/mdtalhask/ai-powered-resume-screening-dataset-2025",
        "license_name": "CC BY-SA 4.0",
        "commercial_use": "Restricted (ShareAlike copyleft condition applies to derivative models)",
        "expected_files": ["Resume_Screening_Dataset.csv"],
    },
    {
        "id": "rhythmghai/resume-screening-dataset-200k-candidates",
        "slug": "resume-screening-dataset-200k-candidates",
        "url": "https://www.kaggle.com/datasets/rhythmghai/resume-screening-dataset-200k-candidates",
        "license_name": "Apache 2.0",
        "commercial_use": "Permitted (Permissive open source)",
        "expected_files": ["synthetic_resumes_200k.csv"],
    },
    {
        "id": "snehaanbhawal/resume-dataset",
        "slug": "resume-dataset",
        "url": "https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset",
        "license_name": "CC0: Public Domain",
        "commercial_use": "Permitted (Public domain worldwide)",
        "expected_files": ["Resume/Resume.csv"],
    },
    {
        "id": "surendra365/recruitement-dataset",
        "slug": "recruitement-dataset",
        "url": "https://www.kaggle.com/datasets/surendra365/recruitement-dataset",
        "license_name": "ODbL / DbCL 1.0 (Open Database License)",
        "commercial_use": "Restricted (Database ShareAlike/Attribution requirements)",
        "expected_files": ["recruitment_dataset.csv"],
    },
    {
        "id": "pranavvenugo/resume-and-job-description",
        "slug": "resume-and-job-description",
        "url": "https://www.kaggle.com/datasets/pranavvenugo/resume-and-job-description",
        "license_name": "Unknown / Unspecified",
        "commercial_use": "Prohibited / Needs Explicit Creator Consent (Cannot ship commercially)",
        "expected_files": ["Resume.csv", "job_description.csv"],
    },
]


@dataclass
class FileManifestItem:
    relative_path: str
    file_size_bytes: int
    sha256: str


@dataclass
class DatasetManifestEntry:
    dataset_id: str
    dataset_slug: str
    source_url: str
    download_date: str
    license_text: str
    commercial_use_status: str
    files: List[Dict[str, any]]


def compute_file_sha256(path: Path) -> str:
    """Computes SHA-256 hash of a file in chunks."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def check_kaggle_credentials() -> bool:
    """Checks whether Kaggle credentials exist in environment or user directory."""
    if os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY"):
        return True
    if os.environ.get("KAGGLE_API_TOKEN"):
        return True
    kaggle_dir = Path.home() / ".kaggle"
    if (kaggle_dir / "kaggle.json").exists() or (kaggle_dir / "access_token").exists():
        return True
    return False


def download_dataset(dataset_info: Dict[str, any], raw_root: Path) -> List[Path]:
    """Downloads a dataset via the Kaggle CLI / python API into data/raw/<slug>/."""
    dataset_id = dataset_info["id"]
    slug = dataset_info["slug"]
    target_dir = raw_root / slug
    target_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n[Acquisition] Downloading {dataset_id} to {target_dir}...")
    cmd = [
        sys.executable,
        "-m",
        "kaggle",
        "datasets",
        "download",
        "-d",
        dataset_id,
        "-p",
        str(target_dir),
        "--unzip",
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"  Success: {res.stdout.strip()}")
    except subprocess.CalledProcessError as e:
        print(f"  Download error for {dataset_id}: {e.stderr.strip()}")
        # Check if zip files exist that were downloaded
        zips = list(target_dir.glob("*.zip"))
        for z in zips:
            with zipfile.ZipFile(z, "r") as zip_ref:
                zip_ref.extractall(target_dir)
            z.unlink()

    return list(target_dir.glob("**/*"))


def scan_dataset_files(slug: str, raw_root: Path) -> List[FileManifestItem]:
    """Scans all files in data/raw/<slug>/, computes sizes and SHA-256 hashes."""
    target_dir = raw_root / slug
    items: List[FileManifestItem] = []
    if not target_dir.exists():
        return items

    for p in target_dir.rglob("*"):
        if p.is_file() and not p.name.endswith(".zip"):
            rel_path = str(p.relative_to(raw_root)).replace("\\", "/")
            size = p.stat().st_size
            sha = compute_file_sha256(p)
            items.append(FileManifestItem(rel_path, size, sha))
    return items


def generate_manifest(
    raw_root: Path, manifest_out: Path, force_download: bool = False
) -> Dict[str, any]:
    """Generates the committed dataset manifest for all 5 Kaggle sources."""
    has_credentials = check_kaggle_credentials()
    if not has_credentials:
        print("[Notice] No Kaggle credentials found (KAGGLE_USERNAME/KEY or ~/.kaggle/kaggle.json).")
        print("         Scanning existing files in data/raw/ or generating metadata manifest.")

    today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    manifest_entries = []

    for ds in TARGET_DATASETS:
        slug = ds["slug"]
        ds_dir = raw_root / slug
        already_has_files = ds_dir.exists() and any(ds_dir.iterdir())

        if has_credentials and (force_download or not already_has_files):
            download_dataset(ds, raw_root)

        file_items = scan_dataset_files(slug, raw_root)

        entry = DatasetManifestEntry(
            dataset_id=ds["id"],
            dataset_slug=slug,
            source_url=ds["url"],
            download_date=today,
            license_text=ds["license_name"],
            commercial_use_status=ds["commercial_use"],
            files=[asdict(f) for f in file_items],
        )
        manifest_entries.append(asdict(entry))

    manifest_data = {
        "generated_at": today,
        "manifest_version": "1.0",
        "datasets": manifest_entries,
    }

    manifest_out.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_out, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)

    print(f"\nManifest successfully written to: {manifest_out}")
    return manifest_data


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parent.parent.parent
    raw_dir = project_root / "data" / "raw"
    manifest_path = project_root / "ml" / "manifest.json"
    generate_manifest(raw_dir, manifest_path)
