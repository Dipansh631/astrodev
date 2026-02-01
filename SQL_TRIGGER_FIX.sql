-- -----------------------------------------------------------------------------
-- SQL FIX: Automate Profile Creation
-- Run this in your Supabase SQL Editor to guarantee all users exist.
-- -----------------------------------------------------------------------------

-- 1. Function to create profile automatically
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING; -- Safe if profile already exists
  return new;
end;
$$ language plpgsql security definer;

-- 2. Creation of the Trigger (if not exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. BACKFILL MISSING USERS (Approximation)
-- If you have users who signed up but have no profile
insert into public.profiles (id, email, full_name, avatar_url)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
where id not in (select id from public.profiles)
ON CONFLICT DO NOTHING;
