-- -----------------------------------------------------------------------------
-- DEMOTE SAMEERAJ FROM ZEUS
-- -----------------------------------------------------------------------------

-- Update the profile to remove God status
-- We check for "Sameeraj" in the name or email.
-- This sets them back to a 'common' member with no sub_rank.

UPDATE public.profiles
SET rank = 'common', sub_rank = NULL
WHERE (full_name ILIKE '%Sameeraj%' OR email ILIKE '%sameeraj%')
  AND rank = 'god';

-- Verify the change (Output the result)
SELECT * FROM public.profiles 
WHERE full_name ILIKE '%Sameeraj%' OR email ILIKE '%sameeraj%';
