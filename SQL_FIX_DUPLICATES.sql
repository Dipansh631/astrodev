-- -----------------------------------------------------------------------------
-- SQL FIX: Deduplicate Profiles & Ensure Primary Key (CORRECTED)
-- Run this if you suspect multiple rows for the same user ID are causing errors.
-- -----------------------------------------------------------------------------

-- 1. Remove Duplicate Profiles (Keep the one with the latest created_at)
-- This CTE finds duplicates based on ID.
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as row_num
  FROM public.profiles
)
DELETE FROM public.profiles
WHERE id IN (SELECT id FROM duplicates WHERE row_num > 1);

-- 2. Ensure 'id' is the Primary Key (if not already)
-- This prevents future duplicates.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_pkey') THEN
        ALTER TABLE public.profiles ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 3. Verify No Duplicates Remain
SELECT id, COUNT(*) 
FROM public.profiles 
GROUP BY id 
HAVING COUNT(*) > 1;
