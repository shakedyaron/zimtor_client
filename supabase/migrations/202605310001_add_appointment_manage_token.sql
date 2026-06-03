-- Adds a public management token for customer self-service appointment links.
-- Run this manually in Supabase SQL editor or through your migration workflow.

alter table public.appointments
  add column if not exists manage_token text unique;

comment on column public.appointments.manage_token is
  'Opaque public token used by customers to view/cancel only their own appointment.';

create or replace function public.get_appointment_by_manage_token(p_manage_token text)
returns table (
  appointment_id uuid,
  business_name text,
  service_name text,
  service_price numeric,
  service_duration_minutes integer,
  customer_name text,
  appointment_date date,
  appointment_time text,
  status text
)
language sql
security definer
set search_path = public
as $$
  select
    a.id as appointment_id,
    b.name as business_name,
    s.name as service_name,
    s.price::numeric as service_price,
    s.duration_minutes::integer as service_duration_minutes,
    a.customer_name,
    a.appointment_date,
    a.appointment_time::text as appointment_time,
    a.status
  from public.appointments a
  join public.businesses b on b.id = a.business_id
  left join public.services s on s.id = a.service_id
  where a.manage_token = p_manage_token
  limit 1;
$$;

create or replace function public.cancel_appointment_by_token(p_manage_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.appointments a
  set status = 'cancelled'
  where a.manage_token = p_manage_token
    and a.status <> 'cancelled'
    and (a.appointment_date::timestamp + a.appointment_time::time) >
      (now() at time zone 'Asia/Jerusalem');

  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

grant execute on function public.get_appointment_by_manage_token(text) to anon, authenticated;
grant execute on function public.cancel_appointment_by_token(text) to anon, authenticated;

-- RLS note:
-- These SECURITY DEFINER RPCs intentionally avoid broad public table policies.
-- Public users can only fetch/cancel by the opaque manage_token; they cannot update
-- customer details, business/service ids, date, or time through these functions.
--
-- TODO: Add a business-level minimum cancellation window, e.g. 2 hours before the appointment.
