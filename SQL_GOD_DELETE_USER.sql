
-- -----------------------------------------------------------------------------
-- GOD MODE: ALLOW USER DELETION
-- This policy allows users with rank 'god' to DELETE other users from the profiles table.
-- -----------------------------------------------------------------------------

-- 1. Create a function to check if the current user is a GOD
CREATE OR REPLACE FUNCTION public.is_god()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND rank = 'god'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing restrictive DELETE policies on profiles
DROP POLICY IF EXISTS "Gods can delete profiles" ON public.profiles;

-- 3. Create the new DELETE policy
CREATE POLICY "Gods can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (
  public.is_god() -- The requesting user must be a God
  AND
  email != 'dipanshumaheshwari73698@gmail.com' -- CANNOT delete the Creator
);

-- 4. Enable RLS on profiles (just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
