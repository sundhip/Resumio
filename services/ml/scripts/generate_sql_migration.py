"""Generates server/migrations/0002_skill_ontology.sql from skills_taxonomy.json
"""

import json
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
SERVICES_ML_DIR = SCRIPTS_DIR.parent
ROOT = SERVICES_ML_DIR.parent.parent if SERVICES_ML_DIR.parent.name == "services" else SERVICES_ML_DIR.parent
TAXONOMY_PATH = SERVICES_ML_DIR / "data" / "taxonomy" / "skills_taxonomy.json"
SQL_PATH = ROOT / "server" / "migrations" / "0002_skill_ontology.sql"


def run():
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        skills = json.load(f)

    lines = [
        "-- Migration 0002: Resumio Phase 4 Skill Ontology, Relationships, Review Queue & Audit Logs",
        "-- Versioned Knowledge Base seeded from ESCO v1.1 & O*NET 28.0",
        "",
        "CREATE TABLE IF NOT EXISTS skills (",
        "  id TEXT PRIMARY KEY,",
        "  canonical_name TEXT NOT NULL UNIQUE,",
        "  category TEXT NOT NULL,",
        "  description TEXT,",
        "  aliases_json TEXT NOT NULL DEFAULT '[]',",
        "  role_family TEXT,",
        "  source_taxonomy TEXT NOT NULL DEFAULT 'ESCO/O*NET/Resumio',",
        "  status TEXT NOT NULL DEFAULT 'approved',",
        "  is_deprecated INTEGER NOT NULL DEFAULT 0,",
        "  version TEXT NOT NULL DEFAULT '1.0.0',",
        "  created_at TEXT NOT NULL DEFAULT (datetime('now')),",
        "  updated_at TEXT NOT NULL DEFAULT (datetime('now'))",
        ");",
        "",
        "CREATE TABLE IF NOT EXISTS skill_relationships (",
        "  id TEXT PRIMARY KEY,",
        "  source_skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,",
        "  target_skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,",
        "  relation_type TEXT NOT NULL DEFAULT 'implies',",
        "  weight REAL NOT NULL DEFAULT 1.0,",
        "  created_at TEXT NOT NULL DEFAULT (datetime('now'))",
        ");",
        "",
        "CREATE TABLE IF NOT EXISTS skill_audit_logs (",
        "  id TEXT PRIMARY KEY,",
        "  skill_id TEXT NOT NULL,",
        "  action TEXT NOT NULL,",
        "  details_json TEXT NOT NULL DEFAULT '{}',",
        "  actor_id TEXT,",
        "  created_at TEXT NOT NULL DEFAULT (datetime('now'))",
        ");",
        "",
        "CREATE TABLE IF NOT EXISTS skill_extraction_review_queue (",
        "  id TEXT PRIMARY KEY,",
        "  extracted_phrase TEXT NOT NULL,",
        "  suggested_skill_id TEXT REFERENCES skills(id),",
        "  similarity_score REAL,",
        "  source_document_id TEXT,",
        "  status TEXT NOT NULL DEFAULT 'pending',",
        "  created_at TEXT NOT NULL DEFAULT (datetime('now'))",
        ");",
        "",
        "-- Indexes for performant search & traversal",
        "CREATE INDEX IF NOT EXISTS idx_skills_canonical_name ON skills(canonical_name);",
        "CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);",
        "CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status);",
        "CREATE INDEX IF NOT EXISTS idx_skill_relationships_source ON skill_relationships(source_skill_id);",
        "CREATE INDEX IF NOT EXISTS idx_skill_relationships_target ON skill_relationships(target_skill_id);",
        "CREATE INDEX IF NOT EXISTS idx_skill_review_queue_status ON skill_extraction_review_queue(status);",
        "",
        "-- Canonical Skills Seed Data (500+ Skills)",
    ]

    for sk in skills:
        sk_id = sk["id"].replace("'", "''")
        name = sk["canonical_name"].replace("'", "''")
        cat = sk["category"].replace("'", "''")
        aliases = json.dumps(sk.get("aliases", [])).replace("'", "''")
        role_fam = (sk.get("role_family") or "").replace("'", "''")
        src = sk.get("source", "ESCO/O*NET/Resumio").replace("'", "''")
        deprecated = 1 if sk.get("is_deprecated") else 0
        ver = sk.get("version", "1.0.0").replace("'", "''")

        sql = (
            f"INSERT OR IGNORE INTO skills (id, canonical_name, category, aliases_json, role_family, source_taxonomy, status, is_deprecated, version) "
            f"VALUES ('{sk_id}', '{name}', '{cat}', '{aliases}', '{role_fam}', '{src}', 'approved', {deprecated}, '{ver}');"
        )
        lines.append(sql)

    lines.append("")
    lines.append("-- Skill Relationships Seed Data (Implies Edges with Weights)")

    rel_idx = 1
    for sk in skills:
        source_id = sk["id"].replace("'", "''")
        for imp in sk.get("implies", []):
            target_id = imp["skill_id"].replace("'", "''")
            weight = float(imp.get("weight", 1.0))
            rel_id = f"rel_{source_id}_{target_id}_{rel_idx}"
            sql = (
                f"INSERT OR IGNORE INTO skill_relationships (id, source_skill_id, target_skill_id, relation_type, weight) "
                f"VALUES ('{rel_id}', '{source_id}', '{target_id}', 'implies', {weight});"
            )
            lines.append(sql)
            rel_idx += 1

    SQL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SQL_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"Generated SQL migration at {SQL_PATH} ({len(lines)} lines).")


if __name__ == "__main__":
    run()
