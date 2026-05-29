import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET() {
  const checks = {
    stripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    agents: !!(process.env.AGENT_BASE_URL && process.env.ROTAN_DEV_KEY),
  };
  const allReady = Object.values(checks).every(Boolean);
  return NextResponse.json(
    { status: allReady ? 'ready' : 'degraded', checks },
    { status: allReady ? 200 : 503 }
  );
}
