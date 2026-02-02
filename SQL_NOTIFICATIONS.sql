-- -----------------------------------------------------------------------------
-- SQL NOTIFICATIONS SYSTEM
-- Adds a table for user notifications and updates policies.
-- -----------------------------------------------------------------------------

-- 1. Create Notifications Table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.notifications enable row level security;

-- 3. Policies

-- Policy: Users can view their own notifications
drop policy if exists "View Own Notifications" on public.notifications;
create policy "View Own Notifications"
on public.notifications for select
using ( auth.uid() = user_id );

-- Policy: Users can update their own notifications (mark as read)
drop policy if exists "Update Own Notifications" on public.notifications;
create policy "Update Own Notifications"
on public.notifications for update
using ( auth.uid() = user_id );

-- Policy: System/Admins/Heads can insert notifications
-- We'll allow any authenticated user to insert for now to allow Heads to notify Members.
drop policy if exists "Insert Notifications" on public.notifications;
create policy "Insert Notifications"
on public.notifications for insert
to authenticated
with check ( true );
