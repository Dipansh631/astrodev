-- -----------------------------------------------------------------------------
-- PROMOTE SAMEERAJ BACK TO ZEUS
-- -----------------------------------------------------------------------------

-- Update the profile to restore God status
-- We check for "Sameeraj" in the name or email.

UPDATE public.profiles
SET rank = 'god', sub_rank = 'Zeus'
WHERE (full_name ILIKE '%Sameeraj%' OR email ILIKE '%sameeraj%');

-- Verify the change
SELECT * FROM public.profiles 
WHERE full_name ILIKE '%Sameeraj%' OR email ILIKE '%sameeraj%';
