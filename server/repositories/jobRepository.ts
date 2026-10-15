import { db } from '../database/db.js';

export interface JobEntity {
  id: string;
  recruiter_id: string;
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  work_mode: string;
  description: string;
  responsibilities: string;
  min_experience: number;
  max_experience: number;
  qualification: string;
  status: 'active' | 'closed' | 'draft';
  created_at: string;
}

export interface IJobRepository {
  findById(id: string): Promise<JobEntity | null>;
  findByRecruiter(recruiterId: string): Promise<JobEntity[]>;
  listActive(params?: { limit?: number; offset?: number }): Promise<JobEntity[]>;
}

export class JobRepository implements IJobRepository {
  public async findById(id: string): Promise<JobEntity | null> {
    const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
    return row ? (row as JobEntity) : null;
  }

  public async findByRecruiter(recruiterId: string): Promise<JobEntity[]> {
    const rows = db.prepare('SELECT * FROM jobs WHERE recruiter_id = ? ORDER BY created_at DESC').all(recruiterId) as any[];
    return rows as JobEntity[];
  }

  public async listActive(params?: { limit?: number; offset?: number }): Promise<JobEntity[]> {
    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;
    const rows = db.prepare("SELECT * FROM jobs WHERE status = 'active' ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset) as any[];
    return rows as JobEntity[];
  }
}

export const jobRepository = new JobRepository();
