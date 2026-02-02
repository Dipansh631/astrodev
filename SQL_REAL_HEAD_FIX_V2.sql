-- -----------------------------------------------------------------------------
-- SQL REAL HEAD FIX V2
-- Fix visibility for Heads:
-- 1. Ensure Heads can see "Member" role requests for their department.
-- 2. Ensure Gods see everything.
-- -----------------------------------------------------------------------------

-- Drop existing policies
drop policy if exists "Select Requests" on public.admin_requests;
drop policy if exists "Read Requests" on public.admin_requests;
drop policy if exists "Update Requests" on public.admin_requests;
drop policy if exists "Make Request" on public.admin_requests;

-- 1. SELECT POLICY
create policy "Select Requests"
on public.admin_requests for select
using (
  auth.uid() = user_id -- Own request
  OR
  exists ( -- Is God (Rank based)
    select 1 from public.profiles 
    where id = auth.uid() 
    and rank = 'god'
  )
  OR
  ( -- Is Department Head
    -- The request is for a department that the user heads
    department = (select department from public.profiles where id = auth.uid())
    AND 
    -- The user is actually a Head or Elite/Legendary
    exists (
       select 1 from public.profiles 
       where id = auth.uid() 
       and (role_title ilike '%Head%' OR rank in ('elite', 'legendary'))
    )
    -- AND the request is for a "Member" position (Heads manage members)
    AND role_title = 'Member'
  )
);

-- 2. UPDATE POLICY
create policy "Update Requests"
on public.admin_requests for update
using (
  exists ( -- God
    select 1 from public.profiles where id = auth.uid() and rank = 'god'
  )
  OR
  ( -- Department Head
    department = (select department from public.profiles where id = auth.uid())
    AND 
    exists (
       select 1 from public.profiles 
       where id = auth.uid() 
       and (role_title ilike '%Head%' OR rank in ('elite', 'legendary'))
    )
    AND role_title = 'Member'
  )
);

-- 3. INSERT POLICY
create policy "Make Request"
on public.admin_requests for insert
with check ( auth.uid() = user_id );
