-- -----------------------------------------------------------------------------
-- SQL FIX: Allow God Users to Delete Profiles
-- Run this to enable the "Delete User" button functionality.
-- -----------------------------------------------------------------------------

-- 1. Create Policy for Deletion
-- Only allows a deletion if the requesting user (auth.uid()) has the rank of 'god'.

create policy "Gods Delete"
on public.profiles
for delete
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
    and rank = 'god'
  )
);

-- Note: This requires that the user has 'SELECT' permission on profiles, 
-- which was already granted in the 'Public Viewing' policy.
