/**
 * lib/env/agents.ts — Agent infrastructure env guard.
 * Import ONLY in agent/Osiris/rotan routes.
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

export const agentEnv = {
  AGENT_BASE_URL: requireServerEnv('AGENT_BASE_URL'),
  ROTAN_DEV_KEY: requireServerEnv('ROTAN_DEV_KEY'),
  SUPABASE_URL: requireServerEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
} as const;

export type AgentEnv = typeof agentEnv;
