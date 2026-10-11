import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { mongoDb, MongoDatabaseManager } from './mongoAdapter.js';
import {
  UserModel,
  CandidateProfileModel,
  RecruiterProfileModel,
  JobModel,
  ApplicationModel,
  ResumeParsedDataModel,
  ResumeScreeningModel,
  ResumeJobMatchModel,
  CandidateJobSummaryModel,
  SkillGapAnalysisModel,
  InterviewModel,
  NotificationModel,
  AuditLogModel,
  NaturalLanguageSearchModel,
  InterviewQuestionSetModel,
  ResumeImprovementAnalysisModel,
  ResumeDuplicateMatchModel,
} from '../models/index.js';

dotenv.config();

// Ensure upload storage directories exist
export const uploadDir = path.resolve(process.cwd(), 'server', 'uploads');
export const resumeUploadDir = path.join(uploadDir, 'resumes');
export const avatarUploadDir = path.join(uploadDir, 'avatars');

if (!fs.existsSync(resumeUploadDir)) {
  fs.mkdirSync(resumeUploadDir, { recursive: true });
}
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

// Environment Determination & Database Separation
export const NODE_ENV = process.env.NODE_ENV || 'development';

export function getTargetDatabaseName(): string {
  if (process.env.MONGODB_DATABASE && process.env.MONGODB_DATABASE.trim()) {
    return process.env.MONGODB_DATABASE.trim();
  }
  switch (NODE_ENV) {
    case 'production':
      return 'resumio_prod';
    case 'test':
      return 'resumio_test';
    case 'development':
    default:
      return 'resumio_dev';
  }
}

export const MONGODB_DATABASE = getTargetDatabaseName();
export const MONGODB_URI = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : '';

/**
 * Masks sensitive credentials in MongoDB URI for safe operational logging
 */
export function maskMongoUri(uri: string): string {
  if (!uri) return '[URI NOT CONFIGURED]';
  try {
    // Regex matches mongodb:// or mongodb+srv:// followed by user:pass@
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@.+)/i, '$1****$2');
  } catch {
    return 'mongodb+srv://[CREDENTIALS_MASKED]';
  }
}

/**
 * Checks if the URI points to MongoDB Atlas
 */
export function isAtlasUri(uri: string): boolean {
  if (!uri) return false;
  return uri.includes('mongodb+srv://') || uri.includes('.mongodb.net');
}

/**
 * Internal connection tracking state
 */
interface ConnectionState {
  isMongooseConnected: boolean;
  isAtlas: boolean;
  databaseName: string;
  lastConnectedAt: string | null;
  connectionError: string | null;
}

const connectionState: ConnectionState = {
  isMongooseConnected: false,
  isAtlas: false,
  databaseName: MONGODB_DATABASE,
  lastConnectedAt: null,
  connectionError: null,
};

/**
 * MongoDB Data Store Instance (Document Engine)
 */
export const mongo = mongoDb;

/**
 * Recalculates dynamic profile completion percentage (0 - 100%)
 * across 10 distinct sections (10% each) on the candidate MongoDB profile.
 */
export async function recalculateCandidateCompletion(candidateProfileId: string): Promise<number> {
  const profile = await mongo.candidate_profiles.findById(candidateProfileId);
  if (!profile) return 0;

  let score = 0;

  // 1. Basic info (name, phone, location)
  if (profile.full_name?.trim() && profile.phone?.trim() && profile.location?.trim()) {
    score += 10;
  } else if (profile.full_name?.trim()) {
    score += 5;
  }

  // 2. Profile Photo
  if (profile.photo_url?.trim()) {
    score += 10;
  }

  // 3. Professional Headline
  if (profile.headline?.trim()) {
    score += 10;
  }

  // 4. Professional Summary / Bio
  if (profile.bio?.trim()) {
    score += 10;
  }

  // 5. Education
  if (Array.isArray(profile.education) && profile.education.length > 0) {
    score += 10;
  }

  // 6. Skills
  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    score += 10;
  }

  // 7. Experience
  if (Array.isArray(profile.experience) && profile.experience.length > 0) {
    score += 10;
  }

  // 8. Projects
  if (Array.isArray(profile.projects) && profile.projects.length > 0) {
    score += 10;
  }

  // 9. Certifications
  if (Array.isArray(profile.certifications) && profile.certifications.length > 0) {
    score += 10;
  }

  // 10. Active Resume
  if (Array.isArray(profile.resumes) && profile.resumes.some((r: any) => r.is_active === 1)) {
    score += 10;
  }

  // Persist updated completion in Document Store
  await mongo.candidate_profiles.updateOne(
    { _id: candidateProfileId },
    { $set: { profile_completion: score, updated_at: new Date().toISOString() } }
  );

  // If Mongoose is connected, also update Mongoose Model
  if (mongoose.connection.readyState === 1) {
    try {
      await CandidateProfileModel.updateOne(
        { _id: candidateProfileId },
        { $set: { profile_completion: score, updated_at: new Date().toISOString() } }
      );
    } catch {}
  }

  return score;
}

/**
 * Validates MongoDB Database Integrity & Relationship Consistency
 */
export async function verifyMongoDatabaseIntegrity(): Promise<{
  isValid: boolean;
  userCount: number;
  candidateProfileCount: number;
  recruiterProfileCount: number;
  jobCount: number;
  applicationCount: number;
  orphanCounts: Record<string, number>;
}> {
  const users = await mongo.users.find().exec();
  const userIds = new Set(users.map((u: any) => u._id));

  const candidateProfiles = await mongo.candidate_profiles.find().exec();
  const candidateProfileIds = new Set(candidateProfiles.map((c: any) => c._id));

  const recruiterProfiles = await mongo.recruiter_profiles.find().exec();
  const recruiterProfileIds = new Set(recruiterProfiles.map((r: any) => r._id));

  const jobs = await mongo.jobs.find().exec();
  const jobIds = new Set(jobs.map((j: any) => j._id));

  const applications = await mongo.applications.find().exec();

  let orphanCandidateProfiles = 0;
  for (const c of candidateProfiles) {
    if (!userIds.has(c.user_id)) orphanCandidateProfiles++;
  }

  let orphanRecruiterProfiles = 0;
  for (const r of recruiterProfiles) {
    if (!userIds.has(r.user_id)) orphanRecruiterProfiles++;
  }

  let orphanJobs = 0;
  for (const j of jobs) {
    if (!userIds.has(j.recruiter_id) || !recruiterProfileIds.has(j.recruiter_profile_id)) {
      orphanJobs++;
    }
  }

  let orphanApps = 0;
  for (const a of applications) {
    if (!userIds.has(a.candidate_id) || !candidateProfileIds.has(a.candidate_profile_id) || !jobIds.has(a.job_id)) {
      orphanApps++;
    }
  }

  const orphanCounts = {
    orphanCandidateProfiles,
    orphanRecruiterProfiles,
    orphanJobs,
    orphanApps,
  };

  const hasOrphans = Object.values(orphanCounts).some((c) => c > 0);
  const isValid = !hasOrphans;

  return {
    isValid,
    userCount: users.length,
    candidateProfileCount: candidateProfiles.length,
    recruiterProfileCount: recruiterProfiles.length,
    jobCount: jobs.length,
    applicationCount: applications.length,
    orphanCounts,
  };
}

/**
 * Health & Readiness Checker
 * Verifies live database accessibility without exposing secrets
 */
export async function checkMongoReadiness(): Promise<{
  ready: boolean;
  status: string;
  database: string;
  isAtlas: boolean;
  provider: 'Atlas' | 'Local Document Store' | 'Disconnected';
  pingMs?: number;
  message?: string;
}> {
  // If Mongoose is actively connected to Atlas/Remote Mongo
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const start = Date.now();
    try {
      await mongoose.connection.db.admin().ping();
      const pingMs = Date.now() - start;
      return {
        ready: true,
        status: 'connected',
        database: connectionState.databaseName,
        isAtlas: connectionState.isAtlas,
        provider: connectionState.isAtlas ? 'Atlas' : 'Local Document Store',
        pingMs,
      };
    } catch (err: any) {
      return {
        ready: false,
        status: 'error',
        database: connectionState.databaseName,
        isAtlas: connectionState.isAtlas,
        provider: 'Disconnected',
        message: 'Database ping check failed',
      };
    }
  }

  // In production, an active remote MongoDB connection is mandatory
  if (NODE_ENV === 'production') {
    return {
      ready: false,
      status: 'disconnected',
      database: connectionState.databaseName,
      isAtlas: false,
      provider: 'Disconnected',
      message: 'MongoDB Atlas connection is required in production environment',
    };
  }

  // In development / testing mode, the local document engine serves requests
  return {
    ready: true,
    status: 'connected',
    database: connectionState.databaseName,
    isAtlas: false,
    provider: 'Local Document Store',
    pingMs: 0,
  };
}

/**
 * Initializes the MongoDB database, binds connection pooling & events,
 * and seeds default admin account
 */
export async function initMongoDatabase(): Promise<void> {
  const targetDb = getTargetDatabaseName();
  connectionState.databaseName = targetDb;

  if (MONGODB_URI && (MONGODB_URI.startsWith('mongodb://') || MONGODB_URI.startsWith('mongodb+srv://'))) {
    const masked = maskMongoUri(MONGODB_URI);
    const isAtlas = isAtlasUri(MONGODB_URI);
    connectionState.isAtlas = isAtlas;

    console.log(`📡 Connecting to MongoDB ${isAtlas ? 'Atlas Cloud' : 'Server'}: ${masked} [DB: ${targetDb}]...`);

    try {
      if (mongoose.connection.readyState === 0) {
        // Set connection event monitors
        mongoose.connection.on('connected', () => {
          connectionState.isMongooseConnected = true;
          connectionState.lastConnectedAt = new Date().toISOString();
          console.log(`✅ MongoDB Connection Established (Database: ${targetDb})`);
        });

        mongoose.connection.on('error', (err) => {
          connectionState.isMongooseConnected = false;
          connectionState.connectionError = err.message;
          console.error(`❌ MongoDB Connection Error: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
          connectionState.isMongooseConnected = false;
          console.warn(`⚠️ MongoDB Connection Disconnected.`);
        });

        await mongoose.connect(MONGODB_URI, {
          dbName: targetDb,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          minPoolSize: 2,
          retryWrites: true,
          w: 'majority',
        });

        connectionState.isMongooseConnected = true;
        connectionState.lastConnectedAt = new Date().toISOString();
        console.log(`🚀 Live MongoDB ${isAtlas ? 'Atlas' : 'Instance'} Connected & Verified.`);
      }
    } catch (err: any) {
      connectionState.isMongooseConnected = false;
      connectionState.connectionError = err.message;
      console.error(`❌ Failed to connect to MongoDB at ${masked}:`, err.message);

      if (NODE_ENV === 'production') {
        throw new Error(`Production MongoDB Atlas connection failed: ${err.message}`);
      }
    }
  } else {
    if (NODE_ENV === 'production') {
      throw new Error('CRITICAL: MONGODB_URI environment variable is required in production environment.');
    }
    console.log(`ℹ️ [Environment: ${NODE_ENV}] MONGODB_URI not set. Using verified local document store (Database: ${targetDb}).`);
  }

  // Seed default admin account if none exists
  const existingAdmin = await mongo.users.findOne({ role: 'admin' });
  if (!existingAdmin) {
    const adminId = crypto.randomUUID();
    const adminEmail = 'admin@resumio.ai';
    const passwordHash = bcrypt.hashSync('AdminPass123!', 10);

    await mongo.users.insertOne({
      _id: adminId,
      id: adminId,
      email: adminEmail,
      password_hash: passwordHash,
      google_id: null,
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log('✅ Default Admin account seeded in MongoDB: admin@resumio.ai / AdminPass123!');
  }
}

/**
 * Graceful Shutdown Handler
 */
export async function closeMongoDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    connectionState.isMongooseConnected = false;
    console.log('🔌 MongoDB connection closed cleanly.');
  }
}

// Graceful process exit listeners
process.on('SIGINT', async () => {
  await closeMongoDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeMongoDatabase();
  process.exit(0);
});

export { mongoDb };
export {
  UserModel,
  CandidateProfileModel,
  RecruiterProfileModel,
  JobModel,
  ApplicationModel,
  ResumeParsedDataModel,
  ResumeScreeningModel,
  ResumeJobMatchModel,
  CandidateJobSummaryModel,
  SkillGapAnalysisModel,
  InterviewModel,
  NotificationModel,
  AuditLogModel,
  NaturalLanguageSearchModel,
  InterviewQuestionSetModel,
  ResumeImprovementAnalysisModel,
  ResumeDuplicateMatchModel,
};
