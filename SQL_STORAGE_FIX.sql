-- -----------------------------------------------------------------------------
-- SQL STORAGE FIX
-- Run this if your images are showing as broken links.
-- -----------------------------------------------------------------------------

-- 1. FORCE the bucket to be public.
-- (This fixes the issue where the bucket might have been private if created before)
update storage.buckets
set public = true
where id = 'astro_gallery';

-- 2. Ensure the policy specifically allows PUBLIC access
drop policy if exists "Astro Public View" on storage.objects;

create policy "Astro Public View"
on storage.objects for select
to public
using ( bucket_id = 'astro_gallery' );

-- NOTE: If images are still broken, ensure you are uploading properly.
