-- -----------------------------------------------------------------------------
-- SQL PERMISSIONS FIX: Bio Feature
-- Run this to enable the new Bio column
-- -----------------------------------------------------------------------------

-- 0. Ensure Schema Exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sub_rank text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text; -- New Bio Column

ALTER TABLE public.admin_requests ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.admin_requests ADD COLUMN IF NOT EXISTS role_title text;
ALTER TABLE public.admin_requests ADD COLUMN IF NOT EXISTS request_data jsonb;

-- 1. Drop complex policies to reset (Safety Clear)
drop policy if exists "Gods can update any profile" on public.profiles;
drop policy if exists "Gods can view all requests" on public.admin_requests;
drop policy if exists "Gods can update requests" on public.admin_requests;
drop policy if exists "Authorized users can view requests" on public.admin_requests;
drop policy if exists "Authorized users can update requests" on public.admin_requests;
drop policy if exists "Users can update own bio" on public.profiles;

-- 2. Create Broad Policies for ALL GODS & DEPARTMENT HEADS

-- PROFILE UPDATES
-- Gods (Rank=god or Poseidon Email) can update everything.
create policy "Gods can update any profile"
  on public.profiles for update
  using ( 
    auth.jwt() ->> 'email' = 'dipanshumaheshwari73698@gmail.com' 
    OR 
    (select rank from public.profiles where id = auth.uid()) = 'god'
  );

-- USER BIO UPDATE (Everyone can update their own bio)
create policy "Users can update own bio"
    on public.profiles for update
    using ( auth.uid() = id )
    with check ( auth.uid() = id );

-- REQUEST VISIBILITY (Select)
create policy "Authorized users can view requests"
  on public.admin_requests for select
  using ( 
    -- 1. Own requests
    auth.uid() = user_id 
    OR 
    -- 2. Poseidon & Gods
    auth.jwt() ->> 'email' = 'dipanshumaheshwari73698@gmail.com'
    OR
    (select rank from public.profiles where id = auth.uid()) = 'god'
    OR
    -- 3. Department Heads (Elite/Legendary matching department)
    (
      (select rank from public.profiles where id = auth.uid()) IN ('elite', 'legendary')
      AND
      department = (select department from public.profiles where id = auth.uid())
    )
  );

-- REQUEST UPDATES (Approve/Reject)
create policy "Authorized users can update requests"
  on public.admin_requests for update
  using ( 
    -- Poseidon & Gods
    auth.jwt() ->> 'email' = 'dipanshumaheshwari73698@gmail.com'
    OR
    (select rank from public.profiles where id = auth.uid()) = 'god'
    OR
    -- Department Heads
    (
      (select rank from public.profiles where id = auth.uid()) IN ('elite', 'legendary')
      AND
      department = (select department from public.profiles where id = auth.uid())
    )
  );

-- 3. Ensure Poseidon Identity is secure (Maintenance)
update public.profiles 
set rank = 'god', sub_rank = 'Poseidon', department = 'Central Command'
where email = 'dipanshumaheshwari73698@gmail.com';
