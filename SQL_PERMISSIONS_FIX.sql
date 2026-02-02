-- -----------------------------------------------------------------------------
-- SQL PERMISSIONS FIX: Broaden God Access & Ensure Schema
-- Run this to allow ALL Gods (Poseidon, Zeus, Apollo) to access Command Center
-- -----------------------------------------------------------------------------

-- 0. Ensure Schema Exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sub_rank text;

-- 1. Drop complex policies to reset
drop policy if exists "Gods can update any profile." on public.profiles;
drop policy if exists "Gods can view all requests." on public.admin_requests;
drop policy if exists "Gods can update requests." on public.admin_requests;

drop policy if exists "Poseidon can update any profile" on public.profiles;
drop policy if exists "Poseidon can view all requests" on public.admin_requests;
drop policy if exists "Poseidon can update requests" on public.admin_requests;

drop policy if exists "Gods can update any profile" on public.profiles;
drop policy if exists "Gods can view all requests" on public.admin_requests;
drop policy if exists "Gods can update requests" on public.admin_requests;

-- 2. Create Broad Policies for ALL GODS
-- Policy: Gods can update profiles (Assign Ranks)
create policy "Gods can update any profile"
  on public.profiles for update
  using ( 
    auth.jwt() ->> 'email' = 'dipanshumaheshwari73698@gmail.com' 
    OR 
    (select rank from public.profiles where id = auth.uid()) = 'god'
  );

-- Policy: Gods can view admin requests
create policy "Gods can view all requests"
  on public.admin_requests for select
  using ( 
    auth.uid() = user_id 
    OR 
    auth.jwt() ->> 'email' = 'dipanshumaheshwari73698@gmail.com'
    OR
    (select rank from public.profiles where id = auth.uid()) = 'god'
  );

-- Policy: Gods can update admin requests (Approve/Reject)
create policy "Gods can update requests"
  on public.admin_requests for update
  using ( 
    auth.jwt() ->> 'email' = 'dipanshumaheshwari73698@gmail.com'
    OR
    (select rank from public.profiles where id = auth.uid()) = 'god'
  );

-- 3. Ensure Poseidon Identity is secure
update public.profiles 
set rank = 'god', sub_rank = 'Poseidon'
where email = 'dipanshumaheshwari73698@gmail.com';
