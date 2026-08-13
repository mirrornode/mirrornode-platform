-- Complete least-privilege enforcement for the server-owned Osiris ledger.
-- The webhook and intake route require only read, insert, and update access.

revoke all privileges on table public.guest_audit_purchases
  from service_role;

grant select, insert, update on table public.guest_audit_purchases
  to service_role;
