import fs from 'fs';
import path from 'path';
import { db } from './db.js';

export interface MigrationRecord {
  id: number;
  name: string;
  applied_at: string;
}

export class MigrationRunner {
  public static async runMigrations(): Promise<void> {
    await db.ensureReady();

    // Ensure migrations ledger table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    const migrationsDir = path.resolve(process.cwd(), 'server', 'migrations');
    if (!fs.existsSync(migrationsDir)) return;

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const appliedRows = db.prepare('SELECT name FROM _migrations').all() as { name: string }[];
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    for (const file of files) {
      if (!appliedSet.has(file)) {
        console.log(`[Migrations] Applying versioned migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        db.exec(sql);
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
        console.log(`[Migrations] Successfully applied: ${file}`);
      }
    }
  }
}
