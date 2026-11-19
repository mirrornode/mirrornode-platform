-- Osiris Audit v1: keep refund state monotonic in guest_audit_purchases.
--
-- PROPOSED, NOT APPLIED. This file is part of a draft pull request. It has not
-- been applied to any hosted Supabase project and needs review and Operator
-- authorization before it is.
--
-- Why: Stripe keeps a Checkout Session's payment_status = 'paid' after a refund.
-- A replayed checkout.session.completed event, or a late intake call, would
-- otherwise write 'paid' over 'refunded' or 'partially_refunded'. That reopens
-- the case for the fulfillment start RPC (which checks status = 'paid') and
-- defeats the refund guards in the webhook. The application now avoids those
-- writes itself; this trigger enforces the same rule for every writer.
--
-- Rules (BEFORE UPDATE, per row; values are clamped, not rejected, so an
-- upsert from an older code path still succeeds without reopening a refund):
--   * status 'refunded' never changes.
--   * status 'partially_refunded' can only become 'refunded'.
--   * fulfillment_status 'refunded' never changes.
-- Other statuses ('paid', 'disputed', 'needs_review', ...) are unaffected, so
-- the Operator can still resolve a dispute or a review hold.

begin;

create or replace function public.guest_audit_purchases_keep_refunds()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if old.status = 'refunded' then
    new.status := 'refunded';
  elsif old.status = 'partially_refunded'
        and new.status not in ('partially_refunded', 'refunded') then
    new.status := 'partially_refunded';
  end if;

  if old.fulfillment_status = 'refunded' then
    new.fulfillment_status := 'refunded';
  end if;

  return new;
end
$$;

revoke all privileges on function public.guest_audit_purchases_keep_refunds()
  from public, anon, authenticated;

drop trigger if exists guest_audit_purchases_keep_refunds
  on public.guest_audit_purchases;

create trigger guest_audit_purchases_keep_refunds
  before update on public.guest_audit_purchases
  for each row
  execute function public.guest_audit_purchases_keep_refunds();

comment on function public.guest_audit_purchases_keep_refunds() is
  'Keeps refunded and partially refunded Osiris Audit v1 purchases from being reopened by a later write.';

commit;
