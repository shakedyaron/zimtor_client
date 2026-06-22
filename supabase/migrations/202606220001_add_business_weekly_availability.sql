-- Adds per-weekday business availability with optional break windows.
-- Run this manually in Supabase SQL editor or through your migration workflow.

alter table public.businesses
  add column if not exists weekly_availability jsonb;

comment on column public.businesses.weekly_availability is
  'JSON object keyed by JS weekday index 0-6. Each day stores enabled/open/close/break settings.';
