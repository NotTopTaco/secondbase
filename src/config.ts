import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_PATH: z.string().default('./data/secondbase.db'),
  MLB_API_BASE: z.string().default('https://statsapi.mlb.com/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  POLL_INTERVAL_MS: z.coerce.number().default(7000),
  DELAY_OFFSET_S: z.coerce.number().default(45),
});

export const config = envSchema.parse(process.env);
