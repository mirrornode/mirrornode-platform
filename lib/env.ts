/**
 * lib/env.ts — DEPRECATED global env bundle.
 *
 * Do NOT add new imports here.
 * Use lib/env/stripe.ts for Stripe/commerce routes.
 * Use lib/env/agents.ts for agent/Osiris/rotan routes.
 *
 * This file is retained only to avoid breaking existing imports
 * while the codebase migrates to scoped env guards.
 */

export { stripeEnv } from './env/stripe';
export { agentEnv } from './env/agents';
