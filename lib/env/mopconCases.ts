/**
 * Server-only environment for the MOPCON read-only Osiris case projection.
 * The Supabase service-role credential remains confined to the Platform server.
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
      `Add it to .env.local (dev) or Vercel Environment Variables.`
    );
  }

  return value;
}

export const mopconCasesEnv = {
  get SUPABASE_URL() { return requireServerEnv('SUPABASE_URL'); },
  get SUPABASE_SERVICE_ROLE_KEY() { return requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'); },
  get MOPCON_CASES_READ_SECRET() { return requireServerEnv('MOPCON_CASES_READ_SECRET'); },
} as const;
