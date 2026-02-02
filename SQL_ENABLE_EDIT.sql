-- -----------------------------------------------------------------------------
-- SQL ENABLE EDITING
-- Run this to allow Users (and Admins) to update content titles/descriptions.
-- -----------------------------------------------------------------------------

drop policy if exists "Update Content" on public.content;
drop policy if exists "Manage Content" on public.content;

create policy "Update Content"
on public.content for update
to authenticated
using (
  auth.uid() = author_id           -- User can edit their own
  OR
  public.is_astro_privileged()     -- God/Head can edit ANY
)
with check (
  auth.uid() = author_id
  OR
  public.is_astro_privileged()
);
