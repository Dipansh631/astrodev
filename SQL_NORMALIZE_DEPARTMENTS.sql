-- -----------------------------------------------------------------------------
-- SQL DATA NORMALIZE
-- Fixes mismatch between 'Astrophotography' and 'Astrophotography Head'.
-- We want everyone to be in the 'Astrophotography' department.
-- The Head will be distinguished by role_title = 'Head' or rank, not by a different department name.
-- -----------------------------------------------------------------------------

-- 1. Fix Profiles (Users)
-- Move anyone from 'Astrophotography Head' department to 'Astrophotography'
UPDATE public.profiles
SET department = 'Astrophotography'
WHERE department = 'Astrophotography Head';

-- Ensure the Head still has a title that grants them access
-- If their role_title was empty because the department name implied it, let's fix it.
UPDATE public.profiles
SET role_title = 'Head'
WHERE department = 'Astrophotography' 
  AND (role_title IS NULL OR role_title = '' OR role_title = 'Astrophotography Head');


-- 2. Fix Admin Requests
-- Update any pending or past requests to use the standard department name
UPDATE public.admin_requests
SET department = 'Astrophotography'
WHERE department = 'Astrophotography Head';

-- 3. Fix Role Titles in Requests (Optional cleanup)
UPDATE public.admin_requests
SET role_title = 'Head'
WHERE role_title = 'Astrophotography Head';
