import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const SQL = await initSqlJs();

export class DatabaseAdapter {
  private db: any;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      this.db = new SQL.Database(fileBuffer);
    } else {
      this.db = new SQL.Database();
    }
  }

  private save() {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('Error saving SQLite DB to disk:', err);
    }
  }

  pragma(pragmaStr: string) {
    try {
      this.db.run(`PRAGMA ${pragmaStr};`);
    } catch (e) {
      // ignore pragma error if any
    }
  }

  exec(sql: string) {
    this.db.exec(sql);
    this.save();
  }

  prepare(sql: string) {
    const self = this;
    return {
      get(...params: any[]) {
        const stmt = self.db.prepare(sql);
        try {
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          stmt.bind(flatParams);
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },

      all(...params: any[]) {
        const stmt = self.db.prepare(sql);
        const results: any[] = [];
        try {
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          stmt.bind(flatParams);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          return results;
        } finally {
          stmt.free();
        }
      },

      run(...params: any[]) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        self.db.run(sql, flatParams);
        self.save();
        return {
          changes: self.db.getRowsModified(),
          lastInsertRowid: 0
        };
      }
    };
  }
}
