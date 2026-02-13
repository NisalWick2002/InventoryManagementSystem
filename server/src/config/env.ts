import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  MONGODB_URI: isTest
    ? z.string().optional().default('mongodb://localhost:27017/factory_inventory_test')
    : z.string().min(1, 'MONGODB_URI is required'),
  FIREBASE_PROJECT_ID: isTest
    ? z.string().optional().default('test-project')
    : z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: isTest
    ? z.string().optional().default('test@test.local')
    : z.string().min(1, 'FIREBASE_CLIENT_EMAIL is required'),
  FIREBASE_PRIVATE_KEY: isTest
    ? z.string().optional().default('test')
    : z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),
  OWNER_EMAIL: z.string().email().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  ALLOW_VERCEL_PREVIEWS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  API_BASE_URL: z.string().url().optional(),
  RATE_LIMIT_ENABLED: z
    .enum(['true', 'false'])
    .default(isTest ? 'false' : 'true')
    .transform((v) => v === 'true'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Normalize private key (replace literal \\n with newline)
if (env.FIREBASE_PRIVATE_KEY && env.FIREBASE_PRIVATE_KEY.includes('\\n')) {
  env.FIREBASE_PRIVATE_KEY = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
}
