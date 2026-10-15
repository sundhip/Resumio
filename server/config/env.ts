import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long').default('resumio_dev_secret_key_super_secure_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DATABASE_PATH: z.string().default('./server/data/resumio.db'),
  MONGODB_URI: z.string().optional(),
  MONGODB_DATABASE: z.string().default('resumio_dev'),
  GEMINI_API_KEY: z.string().optional(),
  AI_MODEL_VERSION: z.string().default('gemini-1.5-flash'),
  AI_FALLBACK_MODE: z.enum(['deterministic', 'none']).default('deterministic'),
  ML_SERVICE_URL: z.string().default('http://localhost:8000'),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

function validateConfig(): Environment {
  const result = EnvironmentSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ FATAL: Invalid application environment configuration:');
    result.error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    throw new Error('Application configuration validation failed. Inspect .env variables.');
  }
  return result.data;
}

export const envConfig = validateConfig();
