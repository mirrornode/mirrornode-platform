/**
 * lib/env/stripe.ts — Stripe + Supabase env guard.
 * Import ONLY in Stripe/commerce routes.
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
  STRIPE_SECRET_KEY: requireServerEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: requireServerEnv('STRIPE_WEBHOOK_SECRET'),
  SUPABASE_URL: requireServerEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
} as const;

export type StripeEnv = typeof stripeEnv;
