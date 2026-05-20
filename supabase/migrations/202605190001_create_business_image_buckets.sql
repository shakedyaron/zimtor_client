-- Public storage buckets for business booking page branding images.
-- Run manually in Supabase SQL editor or your migration workflow.

insert into storage.buckets (id, name, public)
values
  ('business-logos', 'business-logos', true),
  ('business-covers', 'business-covers', true)
on conflict (id) do update
set public = excluded.public;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Business owners can upload logo images'
  ) then
    create policy "Business owners can upload logo images"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'business-logos'
        and name like auth.uid()::text || '-%'
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Business owners can delete logo images'
  ) then
    create policy "Business owners can delete logo images"
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'business-logos'
        and name like auth.uid()::text || '-%'
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Business owners can upload cover images'
  ) then
    create policy "Business owners can upload cover images"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'business-covers'
        and name like auth.uid()::text || '-%'
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Business owners can delete cover images'
  ) then
    create policy "Business owners can delete cover images"
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'business-covers'
        and name like auth.uid()::text || '-%'
      );
  end if;
end $$;
