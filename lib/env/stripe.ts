/**
 * lib/env/stripe.ts – Stripe + Supabase env guard.
 * Import ONLY in Stripe/commerce routes.
 * Uses lazy getters so env vars are read at runtime, not build time.
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

export const stripeEnv = {
  get STRIPE_SECRET_KEY() { return requireServerEnv('STRIPE_SECRET_KEY'); },
  get STRIPE_WEBHOOK_SECRET() { return requireServerEnv('STRIPE_WEBHOOK_SECRET'); },
  get SUPABASE_URL() { return requireServerEnv('SUPABASE_URL'); },
  get SUPABASE_SERVICE_ROLE_KEY() { return requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'); },
} as const;

export type StripeEnv = typeof stripeEnv;
