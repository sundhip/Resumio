import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let SQL: any = null;

export const sqlReady = initSqlJs().then((instance) => {
  SQL = instance;
});

export class DatabaseAdapter {
  private db: any = null;
  private dbPath: string;
  private lastMTime: number = 0;
  private inTransaction: boolean = false;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.ensureDb();
  }

  public async ensureReady() {
    await sqlReady;
    if (!this.db) {
      this.loadDb();
    }
  }

  private loadDb() {
    if (!SQL) return;
    if (fs.existsSync(this.dbPath)) {
      const stats = fs.statSync(this.dbPath);
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(fileBuffer);
      this.lastMTime = stats.mtimeMs;
    } else {
      this.db = new SQL.Database();
      this.lastMTime = Date.now();
    }
    try {
      this.db.run("PRAGMA foreign_keys = ON;");
    } catch (e) {}
  }

  private ensureDb() {
    if (!this.db && SQL) {
      this.loadDb();
    }
  }

  private reloadIfModified() {
    if (this.inTransaction) return;
    this.ensureDb();
    if (fs.existsSync(this.dbPath)) {
      try {
        const stats = fs.statSync(this.dbPath);
        if (stats.mtimeMs > this.lastMTime) {
          const fileBuffer = fs.readFileSync(this.dbPath);
          this.db = new SQL.Database(fileBuffer);
          this.lastMTime = stats.mtimeMs;
          this.db.run("PRAGMA foreign_keys = ON;");
        }
      } catch (e) {}
    }
  }

  private save() {
    if (this.inTransaction || !this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, buffer);
      if (fs.existsSync(this.dbPath)) {
        this.lastMTime = fs.statSync(this.dbPath).mtimeMs;
      }
    } catch (err) {
      console.error('Error saving SQLite DB to disk:', err);
    }
  }

  transaction(fn: (...args: any[]) => any) {
    const self = this;
    return (...args: any[]) => {
      self.reloadIfModified();
      self.inTransaction = true;
      try {
        if (self.db) self.db.exec('BEGIN TRANSACTION;');
      } catch (e) {}
      try {
        const result = fn(...args);
        try {
          if (self.db) self.db.exec('COMMIT;');
        } catch (e) {}
        self.inTransaction = false;
        self.save();
        return result;
      } catch (err) {
        try {
          if (self.db) self.db.exec('ROLLBACK;');
        } catch (e) {}
        self.inTransaction = false;
        throw err;
      }
    };
  }

  pragma(pragmaStr: string) {
    this.reloadIfModified();
    if (!this.db) return;
    try {
      this.db.run(`PRAGMA ${pragmaStr};`);
    } catch (e) {}
  }

  exec(sql: string) {
    this.reloadIfModified();
    if (!this.db) return;
    this.db.exec(sql);
    this.save();
  }

  prepare(sql: string) {
    const self = this;
    return {
      get(...params: any[]) {
        self.reloadIfModified();
        if (!self.db) return undefined;
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
        self.reloadIfModified();
        if (!self.db) return [];
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
        self.reloadIfModified();
        if (!self.db) return { changes: 0, lastInsertRowid: 0 };
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        self.db.run(sql, flatParams);
        self.save();
        return {
          changes: self.db.getRowsModified(),
          lastInsertRowid: 0,
        };
      },
    };
  }
}
