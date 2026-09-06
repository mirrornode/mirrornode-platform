function requireServerEnv(key: string): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      `[env] '${key}' was accessed on the client. Move this import to server-only code.`
    );
  }

  const value = process.env[key];

  if (!value) {
    throw new Error(
      `[env] Missing required server environment variable: '${key}'.`
    );
  }

  return value;
}

export const osirisOperatorEnv = {
  get SUPABASE_URL() {
    return requireServerEnv('SUPABASE_URL');
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return requireServerEnv('SUPABASE_SERVICE_ROLE_KEY');
  },
  get OPERATOR_TOKEN() {
    return requireServerEnv('OSIRIS_OPERATOR_TOKEN');
  },
  get OPERATOR_ACTOR_ID() {
    return requireServerEnv('OSIRIS_OPERATOR_ACTOR_ID');
  },
} as const;
