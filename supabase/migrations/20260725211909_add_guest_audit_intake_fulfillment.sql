-- Add bounded intake and manual fulfillment state to Osiris Audit v1 purchases.
-- Payment state remains in status. No public RLS policies are added.

alter table public.guest_audit_purchases
  add column if not exists fulfillment_status text not null default 'intake_pending',
  add column if not exists intake_system_summary text,
  add column if not exists intake_primary_goal text,
  add column if not exists intake_concerns text,
  add column if not exists intake_artifact_links jsonb not null default '[]'::jsonb,
  add column if not exists intake_additional_context text,
  add column if not exists intake_submitted_at timestamp with time zone,
  add column if not exists operator_reviewed_at timestamp with time zone,
  add column if not exists fulfillment_started_at timestamp with time zone,
  add column if not exists delivered_at timestamp with time zone;

alter table public.guest_audit_purchases
  drop constraint if exists guest_audit_purchases_fulfillment_status_check;

alter table public.guest_audit_purchases
  add constraint guest_audit_purchases_fulfillment_status_check
  check (
    fulfillment_status in (
      'intake_pending',
      'intake_complete',
      'fulfillment_started',
      'delivered',
      'paused',
      'refunded'
    )
  );

alter table public.guest_audit_purchases
  drop constraint if exists guest_audit_purchases_artifact_links_array_check;

alter table public.guest_audit_purchases
  add constraint guest_audit_purchases_artifact_links_array_check
  check (
    jsonb_typeof(intake_artifact_links) = 'array'
    and jsonb_array_length(intake_artifact_links) <= 5
  );

comment on column public.guest_audit_purchases.status is
  'Stripe checkout/payment state preserved from the payment webhook.';

comment on column public.guest_audit_purchases.fulfillment_status is
  'Manual Osiris Audit v1 fulfillment state; separate from payment state.';

comment on column public.guest_audit_purchases.intake_artifact_links is
  'Customer-provided artifact or repository links, limited to five entries.';

comment on column public.guest_audit_purchases.operator_reviewed_at is
  'Timestamp of the explicit Operator review checkpoint before fulfillment begins.';
