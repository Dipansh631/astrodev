-- -----------------------------------------------------------------------------
-- SQL PERMISSIONS FIX: Hardcode Poseidon Access
-- Run this if rank updates are failing or reverting.
-- -----------------------------------------------------------------------------

-- 1. Drop complex policies using subqueries (to avoid recursion or failure)
drop policy if exists "Gods can update any profile." on public.profiles;
drop policy if exists "Gods can view all requests." on public.admin_requests;
drop policy if exists "Gods can update requests." on public.admin_requests;

-- 2. Create simplified Email-Based Policies (100% Reliability for Poseidon)
create policy "Poseidon can update any profile"
  on public.profiles for update
  using ( auth.jwt() ->> 'email' = 'dipanshumaheshwari73698@gmail.com' );

create policy "Poseidon can view all requests"
  on public.admin_requests for select
  using ( 
    auth.uid() = user_id 
    OR 
    auth.jwt() ->> 'email' = 'dipanshumaheshwari73698@gmail.com' 
  );

create policy "Poseidon can update requests"
  on public.admin_requests for update
  using ( auth.jwt() ->> 'email' = 'dipanshumaheshwari73698@gmail.com' );

-- 3. Ensure GOD Rank is set for Poseidon permanently
update public.profiles 
set rank = 'god', sub_rank = 'Poseidon'
where email = 'dipanshumaheshwari73698@gmail.com';
