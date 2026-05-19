-- Adds simple business-level availability settings for the booking page.
-- Run this manually in Supabase SQL editor or through your migration workflow.

alter table public.businesses
  add column if not exists opening_time time not null default '09:00',
  add column if not exists closing_time time not null default '18:00',
  add column if not exists working_days jsonb not null default '[0, 1, 2, 3, 4]'::jsonb;

comment on column public.businesses.opening_time is
  'Default daily booking start time for this business.';

comment on column public.businesses.closing_time is
  'Default daily booking end time for this business.';

comment on column public.businesses.working_days is
  'JSON array of active weekdays where 0=Sunday and 6=Saturday.';

-- TODO: Add a closed_dates table for one-off owner closures.
-- TODO: Add dashboard UI so owners can close a specific date.
-- TODO: Make the booking page check closed_dates and show "העסק סגור ביום זה".
