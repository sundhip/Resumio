import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface MongoQuery {
  [key: string]: any;
}

export interface MongoUpdate {
  $set?: Record<string, any>;
  $unset?: Record<string, any>;
  $push?: Record<string, any>;
  $pull?: Record<string, any>;
  $inc?: Record<string, any>;
  $addToSet?: Record<string, any>;
  [key: string]: any;
}

function getNestedValue(obj: any, pathStr: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = pathStr.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }
  return curr;
}

function setNestedValue(obj: any, pathStr: string, value: any): void {
  const parts = pathStr.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (curr[part] === undefined || curr[part] === null || typeof curr[part] !== 'object') {
      curr[part] = {};
    }
    curr = curr[part];
  }
  curr[parts[parts.length - 1]] = value;
}

function unsetNestedValue(obj: any, pathStr: string): void {
  const parts = pathStr.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (curr[part] === undefined || curr[part] === null) return;
    curr = curr[part];
  }
  delete curr[parts[parts.length - 1]];
}

export function matchesQuery(doc: any, query: MongoQuery): boolean {
  if (!query || Object.keys(query).length === 0) return true;

  for (const [key, condition] of Object.entries(query)) {
    if (key === '$or' && Array.isArray(condition)) {
      const anyMatch = condition.some((subQuery) => matchesQuery(doc, subQuery));
      if (!anyMatch) return false;
      continue;
    }

    if (key === '$and' && Array.isArray(condition)) {
      const allMatch = condition.every((subQuery) => matchesQuery(doc, subQuery));
      if (!allMatch) return false;
      continue;
    }

    const docVal = key === 'id' ? (doc.id || doc._id) : getNestedValue(doc, key);

    if (condition !== null && typeof condition === 'object' && !Array.isArray(condition) && !(condition instanceof RegExp) && !(condition instanceof Date)) {
      for (const [op, opVal] of Object.entries(condition)) {
        if (op === '$eq' && docVal !== opVal) return false;
        if (op === '$ne' && docVal === opVal) return false;
        if (op === '$gt' && !(docVal > (opVal as any))) return false;
        if (op === '$gte' && !(docVal >= (opVal as any))) return false;
        if (op === '$lt' && !(docVal < (opVal as any))) return false;
        if (op === '$lte' && !(docVal <= (opVal as any))) return false;
        if (op === '$in' && Array.isArray(opVal) && !opVal.includes(docVal)) return false;
        if (op === '$nin' && Array.isArray(opVal) && opVal.includes(docVal)) return false;
        if (op === '$exists') {
          const exists = docVal !== undefined;
          if (exists !== Boolean(opVal)) return false;
        }
        if (op === '$regex') {
          const flags = (condition as any).$options || '';
          const regex = typeof opVal === 'string' ? new RegExp(opVal, flags) : (opVal as RegExp);
          if (!regex.test(String(docVal || ''))) return false;
        }
        if (op === '$options') {
          // Handled alongside $regex
          continue;
        }
        if (op === '$elemMatch' && Array.isArray(docVal)) {
          const match = docVal.some((item) => matchesQuery(item, opVal as MongoQuery));
          if (!match) return false;
        }
      }
    } else if (condition instanceof RegExp) {
      if (!condition.test(String(docVal || ''))) return false;
    } else {
      if (docVal !== condition) return false;
    }
  }

  return true;
}

export function applyUpdate(doc: any, update: MongoUpdate): any {
  if (!update || typeof update !== 'object') return doc;

  const hasOperators = Object.keys(update).some((k) => k.startsWith('$'));
  if (!hasOperators) {
    return { ...doc, ...update, _id: doc._id || update._id || crypto.randomUUID() };
  }

  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      setNestedValue(doc, k, v);
    }
  }

  if (update.$unset) {
    for (const k of Object.keys(update.$unset)) {
      unsetNestedValue(doc, k);
    }
  }

  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      const current = getNestedValue(doc, k) || 0;
      setNestedValue(doc, k, current + Number(v));
    }
  }

  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      let arr = getNestedValue(doc, k);
      if (!Array.isArray(arr)) {
        arr = [];
        setNestedValue(doc, k, arr);
      }
      if (v && typeof v === 'object' && v.$each && Array.isArray(v.$each)) {
        arr.push(...v.$each);
      } else {
        arr.push(v);
      }
    }
  }

  if (update.$pull) {
    for (const [k, v] of Object.entries(update.$pull)) {
      const arr = getNestedValue(doc, k);
      if (Array.isArray(arr)) {
        const filtered = arr.filter((item) => {
          if (typeof v === 'object' && v !== null) {
            return !matchesQuery(item, v);
          }
          return item !== v;
        });
        setNestedValue(doc, k, filtered);
      }
    }
  }

  if (update.$addToSet) {
    for (const [k, v] of Object.entries(update.$addToSet)) {
      let arr = getNestedValue(doc, k);
      if (!Array.isArray(arr)) {
        arr = [];
        setNestedValue(doc, k, arr);
      }
      if (!arr.includes(v)) {
        arr.push(v);
      }
    }
  }

  return doc;
}

export class MongoCollectionAdapter<T = any> {
  public name: string;
  private filePath: string;
  private documents: Map<string, T> = new Map();
  private isLoaded: boolean = false;

  constructor(name: string, storageDir: string) {
    this.name = name;
    this.filePath = path.join(storageDir, `${name}.json`);
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const doc of list) {
            const id = doc._id || doc.id || crypto.randomUUID();
            doc._id = id;
            if (!doc.id) doc.id = id;
            this.documents.set(id, doc);
          }
        }
      }
      this.isLoaded = true;
    } catch (e) {
      this.documents.clear();
      this.isLoaded = true;
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.documents.values());
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.error(`Failed to save MongoDB collection ${this.name}:`, e);
    }
  }

  public async insertOne(doc: any): Promise<{ insertedId: string; acknowledged: boolean }> {
    const _id = doc._id || doc.id || crypto.randomUUID();
    const cleanDoc = { ...doc, _id, id: _id };
    this.documents.set(_id, cleanDoc);
    this.save();
    return { insertedId: _id, acknowledged: true };
  }

  public async insertMany(docs: any[]): Promise<{ insertedIds: Record<number, string>; acknowledged: boolean }> {
    const insertedIds: Record<number, string> = {};
    docs.forEach((doc, idx) => {
      const _id = doc._id || doc.id || crypto.randomUUID();
      const cleanDoc = { ...doc, _id, id: _id };
      this.documents.set(_id, cleanDoc);
      insertedIds[idx] = _id;
    });
    this.save();
    return { insertedIds, acknowledged: true };
  }

  public async create(docOrDocs: any | any[]): Promise<any> {
    if (Array.isArray(docOrDocs)) {
      const results: any[] = [];
      for (const d of docOrDocs) {
        const res = await this.insertOne(d);
        results.push(this.documents.get(res.insertedId));
      }
      return results;
    } else {
      const res = await this.insertOne(docOrDocs);
      return this.documents.get(res.insertedId);
    }
  }

  public async findOne(query: MongoQuery = {}): Promise<T | null> {
    for (const doc of this.documents.values()) {
      if (matchesQuery(doc, query)) {
        return JSON.parse(JSON.stringify(doc));
      }
    }
    return null;
  }

  public async findById(id: string): Promise<T | null> {
    const doc = this.documents.get(id);
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  }

  public find(query: MongoQuery = {}): MongoQueryCursor<T> {
    const matched: T[] = [];
    for (const doc of this.documents.values()) {
      if (matchesQuery(doc, query)) {
        matched.push(JSON.parse(JSON.stringify(doc)));
      }
    }
    return new MongoQueryCursor<T>(matched);
  }

  public async updateOne(query: MongoQuery, update: MongoUpdate, options?: { upsert?: boolean }): Promise<{ matchedCount: number; modifiedCount: number; upsertedId?: any }> {
    for (const [id, doc] of this.documents.entries()) {
      if (matchesQuery(doc, query)) {
        const updated = applyUpdate(doc, update);
        this.documents.set(id, updated);
        this.save();
        return { matchedCount: 1, modifiedCount: 1 };
      }
    }
    if (options && options.upsert) {
      const newDoc: any = { _id: (query as any)._id || (query as any).id || crypto.randomUUID() };
      // Copy exact query properties that are primitives
      for (const [k, v] of Object.entries(query)) {
        if (!k.startsWith('$') && typeof v !== 'object') {
          newDoc[k] = v;
        }
      }
      const updated = applyUpdate(newDoc, update);
      if (!updated._id && !updated.id) {
        updated._id = newDoc._id;
      }
      const docId = String(updated._id || updated.id || crypto.randomUUID());
      this.documents.set(docId, updated);
      this.save();
      return { matchedCount: 0, modifiedCount: 1, upsertedId: docId };
    }
    return { matchedCount: 0, modifiedCount: 0 };
  }

  public async updateMany(query: MongoQuery, update: MongoUpdate): Promise<{ matchedCount: number; modifiedCount: number }> {
    let matchedCount = 0;
    let modifiedCount = 0;
    for (const [id, doc] of this.documents.entries()) {
      if (matchesQuery(doc, query)) {
        matchedCount++;
        const updated = applyUpdate(doc, update);
        this.documents.set(id, updated);
        modifiedCount++;
      }
    }
    if (modifiedCount > 0) {
      this.save();
    }
    return { matchedCount, modifiedCount };
  }

  public async deleteOne(query: MongoQuery): Promise<{ deletedCount: number }> {
    for (const [id, doc] of this.documents.entries()) {
      if (matchesQuery(doc, query)) {
        this.documents.delete(id);
        this.save();
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  }

  public async deleteMany(query: MongoQuery = {}): Promise<{ deletedCount: number }> {
    let deletedCount = 0;
    for (const [id, doc] of this.documents.entries()) {
      if (matchesQuery(doc, query)) {
        this.documents.delete(id);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      this.save();
    }
    return { deletedCount };
  }

  public async countDocuments(query: MongoQuery = {}): Promise<number> {
    let count = 0;
    for (const doc of this.documents.values()) {
      if (matchesQuery(doc, query)) {
        count++;
      }
    }
    return count;
  }

  public async distinct(field: string, query: MongoQuery = {}): Promise<any[]> {
    const values = new Set<any>();
    for (const doc of this.documents.values()) {
      if (matchesQuery(doc, query)) {
        const val = getNestedValue(doc, field);
        if (val !== undefined && val !== null) {
          values.add(val);
        }
      }
    }
    return Array.from(values);
  }
}

export class MongoQueryCursor<T> {
  private results: T[];

  constructor(results: T[]) {
    this.results = results;
  }

  public sort(sortObj: Record<string, 1 | -1 | 'asc' | 'desc'>): this {
    const entries = Object.entries(sortObj);
    this.results.sort((a: any, b: any) => {
      for (const [field, direction] of entries) {
        const dir = direction === 1 || direction === 'asc' ? 1 : -1;
        const valA = getNestedValue(a, field);
        const valB = getNestedValue(b, field);
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
      }
      return 0;
    });
    return this;
  }

  public skip(num: number): this {
    this.results = this.results.slice(num);
    return this;
  }

  public limit(num: number): this {
    this.results = this.results.slice(0, num);
    return this;
  }

  public select(_fields: any): this {
    return this;
  }

  public lean(): this {
    return this;
  }

  public async exec(): Promise<T[]> {
    return this.results;
  }

  public then(onfulfilled?: (value: T[]) => any, onrejected?: (reason: any) => any): Promise<any> {
    return Promise.resolve(this.results).then(onfulfilled, onrejected);
  }
}

export class MongoDatabaseManager {
  private storageDir: string;
  private collections: Map<string, MongoCollectionAdapter> = new Map();

  constructor(storageDir?: string) {
    this.storageDir = storageDir || path.resolve(process.cwd(), 'server', 'data', 'mongodb');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  public collection<T = any>(name: string): MongoCollectionAdapter<T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MongoCollectionAdapter<T>(name, this.storageDir));
    }
    return this.collections.get(name)! as MongoCollectionAdapter<T>;
  }

  public get users() { return this.collection('users'); }
  public get candidate_profiles() { return this.collection('candidate_profiles'); }
  public get recruiter_profiles() { return this.collection('recruiter_profiles'); }
  public get jobs() { return this.collection('jobs'); }
  public get applications() { return this.collection('applications'); }
  public get resume_parsed_data() { return this.collection('resume_parsed_data'); }
  public get resume_screenings() { return this.collection('resume_screenings'); }
  public get resume_job_matches() { return this.collection('resume_job_matches'); }
  public get candidate_job_summaries() { return this.collection('candidate_job_summaries'); }
  public get skill_gap_analyses() { return this.collection('skill_gap_analyses'); }
  public get interviews() { return this.collection('interviews'); }
  public get notifications() { return this.collection('notifications'); }
  public get audit_logs() { return this.collection('audit_logs'); }
  public get natural_language_searches() { return this.collection('natural_language_searches'); }
  public get interview_question_sets() { return this.collection('interview_question_sets'); }
  public get resume_improvement_analyses() { return this.collection('resume_improvement_analyses'); }
  public get resume_duplicate_matches() { return this.collection('resume_duplicate_matches'); }

  // Research Pipeline Collections (Isolated)
  public get research_datasets() { return this.collection('research_datasets'); }
  public get research_dataset_records() { return this.collection('research_dataset_records'); }
  public get research_augmentation_runs() { return this.collection('research_augmentation_runs'); }
  public get research_experiments() { return this.collection('research_experiments'); }
}

export const mongoDb = new MongoDatabaseManager();
