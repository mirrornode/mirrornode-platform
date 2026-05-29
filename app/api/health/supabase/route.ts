import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET() {
  const configured = !!(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  return NextResponse.json({
    status: configured ? 'configured' : 'unconfigured',
    service: 'supabase',
  });
}
