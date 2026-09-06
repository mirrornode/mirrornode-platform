import { randomUUID, timingSafeEqual } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { osirisOperatorEnv } from '@/lib/env/osiris-operator';
import {
  osirisFulfillmentStartSchema,
  type OsirisFulfillmentStartRow,
} from '@/lib/osiris-audit/fulfillment-start';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function secureEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function bearerToken(req: NextRequest) {
  const authorization = req.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

function receipt(row: OsirisFulfillmentStartRow) {
  return {
    accepted: true,
    idempotent: row.outcome === 'IDEMPOTENT',
    caseSubject: {
      type: 'stripe_session_id',
      value: row.case_session_id,
    },
    fulfillmentStatus: row.fulfillment_status,
    activationEventId: row.activation_event_id,
    idempotencyKey: row.idempotency_key,
    operatorId: row.operator_id,
    reason: row.start_reason,
    operatorReviewedAt: row.operator_reviewed_at,
    fulfillmentStartedAt: row.fulfillment_started_at,
  };
}

export async function POST(req: NextRequest) {
  const token = bearerToken(req);

  if (!token) {
    return NextResponse.json(
      { error: 'Operator authorization required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  if (!secureEqual(token, osirisOperatorEnv.OPERATOR_TOKEN)) {
    return NextResponse.json(
      { error: 'Operator authorization refused', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  let parsed: ReturnType<typeof osirisFulfillmentStartSchema.safeParse>;

  try {
    parsed = osirisFulfillmentStartSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_REQUEST' },
      { status: 400 }
    );
  }

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid fulfillment start command',
        code: 'INVALID_REQUEST',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const command = parsed.data;

  if (!secureEqual(command.operator.actor_id, osirisOperatorEnv.OPERATOR_ACTOR_ID)) {
    return NextResponse.json(
      { error: 'Operator identity refused', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  const supabase = createClient(
    osirisOperatorEnv.SUPABASE_URL,
    osirisOperatorEnv.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.rpc(
    'start_osiris_audit_fulfillment_v1',
    {
      p_stripe_session_id: command.subject.value,
      p_idempotency_key: command.idempotency_key,
      p_actor_id: command.operator.actor_id,
      p_reason: command.operator.reason,
      p_event_id: randomUUID(),
    }
  );

  if (error) {
    console.error('[osiris-fulfillment-start] Transition failed:', error.message);
    return NextResponse.json(
      { error: 'Unable to start fulfillment', code: 'TRANSITION_FAILED' },
      { status: 500 }
    );
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | OsirisFulfillmentStartRow
    | null;

  if (!row) {
    return NextResponse.json(
      { error: 'Fulfillment transition returned no receipt', code: 'TRANSITION_FAILED' },
      { status: 500 }
    );
  }

  switch (row.outcome) {
    case 'STARTED':
    case 'IDEMPOTENT':
      return NextResponse.json(receipt(row));

    case 'IDEMPOTENCY_CONFLICT':
      return NextResponse.json(
        {
          error: 'Idempotency key is already bound to another case',
          code: 'IDEMPOTENCY_CONFLICT',
        },
        { status: 409 }
      );

    case 'NOT_READY':
      return NextResponse.json(
        {
          error: 'Case is not ready for fulfillment',
          code: 'NOT_READY',
        },
        { status: 409 }
      );

    case 'NOT_FOUND':
      return NextResponse.json(
        {
          error: 'Osiris Audit case was not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );

    default:
      return NextResponse.json(
        { error: 'Unknown fulfillment transition result', code: 'TRANSITION_FAILED' },
        { status: 500 }
      );
  }
}
