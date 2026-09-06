import { z } from 'zod';

export const osirisFulfillmentStartSchema = z
  .object({
    subject: z
      .object({
        type: z.literal('stripe_session_id'),
        value: z
          .string()
          .trim()
          .min(1)
          .max(255)
          .refine((value) => value.startsWith('cs_'), 'Invalid Stripe session'),
      })
      .strict(),
    idempotency_key: z.string().uuid(),
    operator: z
      .object({
        actor_id: z.string().trim().min(1).max(128),
        reason: z.string().trim().min(10).max(1000),
      })
      .strict(),
  })
  .strict();

export type OsirisFulfillmentStart = z.infer<
  typeof osirisFulfillmentStartSchema
>;

export type OsirisFulfillmentStartOutcome =
  | 'STARTED'
  | 'IDEMPOTENT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'NOT_READY'
  | 'NOT_FOUND';

export type OsirisFulfillmentStartRow = {
  outcome: OsirisFulfillmentStartOutcome;
  case_session_id: string;
  fulfillment_status: string | null;
  activation_event_id: string | null;
  idempotency_key: string | null;
  operator_id: string | null;
  start_reason: string | null;
  operator_reviewed_at: string | null;
  fulfillment_started_at: string | null;
};
