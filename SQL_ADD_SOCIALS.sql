-- Add social_links column to profiles table
alter table public.profiles 
add column if not exists social_links jsonb default '[]'::jsonb;

-- No new policies needed as the existing profile update policies should cover this column.
