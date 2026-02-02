-- -----------------------------------------------------------------------------
-- SQL UPDATE: ADMIN REQUESTS POLICIES for HEADS CLUSTER
-- This script enables Department Heads to view and approve/manage requests for their own department.
-- -----------------------------------------------------------------------------

-- 1. Helper: Check if user is Head of a department
create or replace function public.get_user_department()
returns text as $$
begin
  return (
    select department 
    from public.profiles 
    where id = auth.uid() 
    and (role_title like '%Head%' or rank in ('elite','legendary','god'))
    limit 1
  );
end;
$$ language plpgsql security definer;

-- 2. UPDATE POLICIES on admin_requests
alter table public.admin_requests enable row level security;

-- Policy: Select
-- Gods see all.
-- Heads see requests for their department.
-- Users see their own requests.
drop policy if exists "Select Requests" on public.admin_requests;
drop policy if exists "Read Requests" on public.admin_requests;

create policy "Select Requests"
on public.admin_requests for select
using (
  auth.uid() = user_id -- Own request
  OR
  exists ( -- Is God
    select 1 from public.profiles where id = auth.uid() and rank = 'god'
  )
  OR
  ( -- Is Department Head of the request's department
    department = (select department from public.profiles where id = auth.uid())
    AND (
      exists (select 1 from public.profiles where id = auth.uid() and (role_title like '%Head%' or rank in ('elite','legendary'))) 
    )
  )
);

-- Policy: Update
-- Gods can update all.
-- Heads can update requests for their department.
drop policy if exists "Update Requests" on public.admin_requests;

create policy "Update Requests"
on public.admin_requests for update
using (
  exists ( -- Is God
     select 1 from public.profiles where id = auth.uid() and rank = 'god'
  )
  OR
  ( -- Is Department Head for this request
    department = (select department from public.profiles where id = auth.uid())
    AND (
      exists (select 1 from public.profiles where id = auth.uid() and (role_title = 'Head' or role_title like '%Head%' or rank in ('elite','legendary'))) 
    )
  )
);

-- Policy: Insert
-- Authenticated users can create requests
drop policy if exists "Make Request" on public.admin_requests;

create policy "Make Request"
on public.admin_requests for insert
with check ( auth.uid() = user_id );

