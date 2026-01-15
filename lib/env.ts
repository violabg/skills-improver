/**
 * Environment Variable Validation
 *
 * Centralized validation for all required environment variables.
 * Uses Zod for type-safe validation with helpful error messages.
 *
 * IMPORTANT: This module uses lazy validation to prevent errors when
 * imported transitively by client components. The env object is a Proxy
 * that validates on first access.
 *
 * Usage:
 * ```ts
 * import { env } from '@/lib/env';
 * console.log(env.DATABASE_URL); // Validates and returns value
 * ```
 */

import { z } from "zod";

// Schema for server-side environment variables
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Cloudflare R2 Storage
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
  R2_PUBLIC_URL: z.string().optional(), // Optional: custom domain for public access

  // AI Services (Groq)
  GROQ_API_KEY: z.string().optional(), // Optional: AI features disabled if missing

  // Auth
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Type for validated environment
export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Validation function with caching
let cachedEnv: ServerEnv | null = null;

function validateEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `❌ Invalid environment variables:\n${errors}\n\nPlease check your .env file or environment configuration.`
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/**
 * Lazy-validated environment variables.
 * Validation only runs when a property is first accessed.
 * This prevents errors when the module is imported by client components.
 */
export const env: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop: string) {
    const validated = validateEnv();
    return validated[prop as keyof ServerEnv];
  },
});

/**
 * Helper to check if R2 is configured (all required fields present)
 * This is safe to call and will return false if env vars are missing
 */
export function isR2Configured(): boolean {
  try {
    const validated = validateEnv();
    return !!(
      validated.R2_ACCOUNT_ID &&
      validated.R2_ACCESS_KEY_ID &&
      validated.R2_SECRET_ACCESS_KEY &&
      validated.R2_BUCKET_NAME
    );
  } catch {
    return false;
  }
}

/**
 * Helper to check if AI services are configured
 * This is safe to call and will return false if env vars are missing
 */
export function isAIConfigured(): boolean {
  try {
    const validated = validateEnv();
    return !!validated.GROQ_API_KEY;
  } catch {
    return false;
  }
}
