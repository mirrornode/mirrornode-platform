import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET() {
  const configured = !!(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET
  );
  return NextResponse.json({
    status: configured ? 'configured' : 'unconfigured',
    service: 'stripe',
  });
}
