-- Optional public booking page branding fields for businesses.
-- Run this manually in Supabase before saving these fields from the dashboard.

alter table public.businesses
  add column if not exists logo_url text,
  add column if not exists cover_image_url text,
  add column if not exists description text,
  add column if not exists whatsapp_url text,
  add column if not exists instagram_url text,
  add column if not exists address text;

comment on column public.businesses.logo_url is 'Optional business logo URL for the public booking page.';
comment on column public.businesses.cover_image_url is 'Optional cover image URL for the public booking page.';
comment on column public.businesses.description is 'Optional public business description.';
comment on column public.businesses.whatsapp_url is 'Optional WhatsApp URL or phone for public contact.';
comment on column public.businesses.instagram_url is 'Optional Instagram profile URL.';
comment on column public.businesses.address is 'Optional public business address.';
