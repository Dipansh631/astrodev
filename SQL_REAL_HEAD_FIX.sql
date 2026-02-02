-- -----------------------------------------------------------------------------
-- SQL REAL HEAD FIX
-- RLS Policy Update to ensure Heads can see requests.
-- -----------------------------------------------------------------------------

-- Drop previous policies to be sure
drop policy if exists "Select Requests" on public.admin_requests;
drop policy if exists "Read Requests" on public.admin_requests;
drop policy if exists "Update Requests" on public.admin_requests;

-- 1. SELECT POLICY
create policy "Select Requests"
on public.admin_requests for select
using (
  auth.uid() = user_id -- Own request
  OR
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and (
      p.rank = 'god' -- God sees all
      OR
      (
        -- Head sees requests for THEIR department
        p.department = admin_requests.department
        AND
        (p.role_title ilike '%Head%' OR p.rank in ('elite', 'legendary'))
      )
    )
  )
);

-- 2. UPDATE POLICY
create policy "Update Requests"
on public.admin_requests for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and (
      p.rank = 'god'
      OR
      (
        p.department = admin_requests.department
        AND
        (p.role_title ilike '%Head%' OR p.rank in ('elite', 'legendary'))
      )
    )
  )
);

-- 3. INSERT POLICY (unchanged usually, but good to ensure)
drop policy if exists "Make Request" on public.admin_requests;
create policy "Make Request"
on public.admin_requests for insert
with check ( auth.uid() = user_id );
