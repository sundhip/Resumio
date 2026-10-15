import { db } from '../database/db.js';

export interface UserEntity {
  id: string;
  email: string;
  password_hash: string;
  role: 'candidate' | 'recruiter' | 'admin';
  status: 'active' | 'suspended';
  google_id?: string | null;
  created_at: string;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(user: Omit<UserEntity, 'created_at'>): Promise<UserEntity>;
  updateStatus(id: string, status: 'active' | 'suspended'): Promise<void>;
}

export class UserRepository implements IUserRepository {
  public async findById(id: string): Promise<UserEntity | null> {
    const row = db.prepare('SELECT id, email, password_hash, role, status, google_id, created_at FROM users WHERE id = ?').get(id) as any;
    return row ? (row as UserEntity) : null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const row = db.prepare('SELECT id, email, password_hash, role, status, google_id, created_at FROM users WHERE lower(email) = ?').get(email.toLowerCase().trim()) as any;
    return row ? (row as UserEntity) : null;
  }

  public async create(user: Omit<UserEntity, 'created_at'>): Promise<UserEntity> {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status, google_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user.id, user.email.toLowerCase().trim(), user.password_hash, user.role, user.status, user.google_id || null);

    const created = await this.findById(user.id);
    return created!;
  }

  public async updateStatus(id: string, status: 'active' | 'suspended'): Promise<void> {
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
  }
}

export const userRepository = new UserRepository();
