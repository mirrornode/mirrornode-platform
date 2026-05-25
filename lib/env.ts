/**
 * lib/env.ts — Server-side environment guard.
 *
 * Import this module ONLY in server code (Route Handlers, Server Actions,
 * API routes, middleware). Never import it from client components or any
 * file that ends up in the browser bundle.
 *
 * Throws at startup if any required variable is missing or if
 * SUPABASE_SERVICE_KEY has been accidentally exposed as a NEXT_PUBLIC_* var.
 */

function requireServerEnv(key: string): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      `[env] '${key}' was accessed on the client. Move this import to server-only code.`
    );
  }
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[env] Missing required server environment variable: '${key}'. ` +
      `Add it to .env.local (dev) or Vercel Environment Variables (production).`
    );
  }
  return value;
}

// Fail loudly if the service key ever leaks into a NEXT_PUBLIC_* var.
if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY) {
  throw new Error(
    '[env] CRITICAL: SUPABASE_SERVICE_KEY is exposed as NEXT_PUBLIC_SUPABASE_SERVICE_KEY. ' +
    'Remove it from NEXT_PUBLIC_* immediately and rotate the key in Supabase.'
  );
}

export const env = {
  AGENT_BASE_URL: requireServerEnv('AGENT_BASE_URL'),
  ROTAN_DEV_KEY: requireServerEnv('ROTAN_DEV_KEY'),
  SUPABASE_URL: requireServerEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_KEY: requireServerEnv('SUPABASE_SERVICE_KEY'),
} as const;

export type ServerEnv = typeof env;
