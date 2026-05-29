import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET() {
  const configured = !!(
    process.env.AGENT_BASE_URL && process.env.ROTAN_DEV_KEY
  );
  return NextResponse.json({
    status: configured ? 'configured' : 'unconfigured',
    service: 'agents',
  });
}
