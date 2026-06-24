-- Adds immutable service snapshot fields to appointments.
-- Run this manually in Supabase SQL editor or through your migration workflow.

alter table public.appointments
  add column if not exists service_name text,
  add column if not exists service_price numeric,
  add column if not exists service_duration_minutes integer;

comment on column public.appointments.service_name is
  'Service name captured when the appointment was booked.';

comment on column public.appointments.service_price is
  'Service price captured when the appointment was booked.';

comment on column public.appointments.service_duration_minutes is
  'Service duration captured when the appointment was booked.';

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
    coalesce(a.service_name, s.name) as service_name,
    coalesce(a.service_price, s.price::numeric) as service_price,
    coalesce(
      a.service_duration_minutes,
      s.duration_minutes::integer
    ) as service_duration_minutes,
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

grant execute on function public.get_appointment_by_manage_token(text) to anon, authenticated;
