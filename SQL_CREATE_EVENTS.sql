-- Create Events Table
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  registration_link text,
  rewards text,
  requirements text,
  status text check (status in ('active', 'upcoming', 'closed')),
  is_registration_open boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.events enable row level security;

-- Policies
create policy "Allow public read access" on public.events for select using (true);

create policy "Allow gods and president to insert" on public.events for insert with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.rank = 'god' or profiles.department = 'President' or profiles.role_title = 'President')
  )
);

create policy "Allow gods and president to update" on public.events for update using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.rank = 'god' or profiles.department = 'President' or profiles.role_title = 'President')
  )
);

create policy "Allow gods and president to delete" on public.events for delete using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.rank = 'god' or profiles.department = 'President' or profiles.role_title = 'President')
  )
);
