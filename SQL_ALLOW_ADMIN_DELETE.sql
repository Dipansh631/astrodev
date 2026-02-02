-- -----------------------------------------------------------------------------
-- SQL PERMISSIONS UPDATE: Allow Privileged Deletion
-- Run this to ensure Gods/Heads can delete ANY photo, not just their own.
-- -----------------------------------------------------------------------------

-- 1. Ensure the privilege check function exists
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

-- 2. UPDATE STORAGE POLICIES
-- Drop restrictive policies if they exist to avoid conflicts
drop policy if exists "Allow Authenticated Deletes" on storage.objects;
drop policy if exists "Astro Privileged Delete" on storage.objects;

-- Create a comprehensive DELETE policy
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

-- 3. UPDATE DATABASE TABLE POLICIES (public.content)
drop policy if exists "Manage Content" on public.content; 
drop policy if exists "Delete Content" on public.content;

-- Create DELETE policy for table
create policy "Delete Content"
on public.content for delete
to authenticated
using (
  auth.uid() = author_id -- Author can delete
  OR
  public.is_astro_privileged() -- Admin/Head can delete
);

-- Ensure Updates are also allowed (if editing is needed later)
create policy "Update Content"
on public.content for update
to authenticated
using (
  auth.uid() = author_id
  OR
  public.is_astro_privileged()
);
