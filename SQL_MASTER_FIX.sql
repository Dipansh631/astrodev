-- -----------------------------------------------------------------------------
-- MASTER FIX: Uploads & Deletions
-- This script fixes "Row Level Security" errors for uploading AND deleting.
-- Run this in the Supabase SQL Editor.
-- -----------------------------------------------------------------------------

-- 1. Helper Function: Check if user is God or Astro Head
create or replace function public.is_astro_privileged()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and (
      rank = 'god'
      or
      (department = 'Astrophotography' and rank in ('elite', 'legendary'))
      or
      role_title = 'Astrophotography Head'
      or
      department = 'Astrophotography Head'
    )
  );
end;
$$ language plpgsql security definer;

-- -----------------------------------------------------------------------------
-- 2. STORAGE PERMISSIONS (astro_gallery)
-- -----------------------------------------------------------------------------

-- Ensure bucket is public
update storage.buckets
set public = true
where id = 'astro_gallery';

-- Drop old policies to avoid conflicts
drop policy if exists "Astro Public View" on storage.objects;
drop policy if exists "Allow Authenticated Uploads" on storage.objects;
drop policy if exists "Astro Universal Delete" on storage.objects;
drop policy if exists "Allow Authenticated Deletes" on storage.objects;
drop policy if exists "Astro Privileged Delete" on storage.objects;

-- Policy A: VIEW (Public)
create policy "Astro Public View"
on storage.objects for select
to public
using ( bucket_id = 'astro_gallery' );

-- Policy B: UPLOAD (Any Authenticated User)
create policy "Allow Authenticated Uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'astro_gallery' );

-- Policy C: DELETE (Owner OR Privileged Admin)
create policy "Astro Universal Delete"
on storage.objects for delete
to authenticated
using ( 
  bucket_id = 'astro_gallery' 
  AND (
    auth.uid() = owner -- User can delete their own
    OR
    public.is_astro_privileged() -- Admin/Head can delete ANY
  )
);

-- -----------------------------------------------------------------------------
-- 3. DATABASE PERMISSIONS (public.content)
-- -----------------------------------------------------------------------------

-- Drop old policies
drop policy if exists "Insert Content" on public.content;
drop policy if exists "Delete Content" on public.content;
drop policy if exists "Manage Content" on public.content;
drop policy if exists "Allow Authenticated Insert Content" on public.content;

-- Policy A: INSERT (Authenticated)
create policy "Allow Authenticated Insert Content"
on public.content for insert
to authenticated
with check ( true );

-- Policy B: DELETE (Owner OR Privileged)
create policy "Delete Content"
on public.content for delete
to authenticated
using (
  auth.uid() = author_id
  OR
  public.is_astro_privileged()
);

-- Policy C: SELECT (Public for Astrophotography, Private for Studio)
drop policy if exists "View Content" on public.content;
create policy "View Content"
on public.content for select
using (
  (section = 'astro_studio' AND public.is_astro_privileged())
  OR
  (section != 'astro_studio')
);

