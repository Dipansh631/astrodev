-- -----------------------------------------------------------------------------
-- SQL FIX: Resolve 409 Conflict on Delete
-- This adds 'ON DELETE CASCADE' to related tables so deleting a Profile works.
-- -----------------------------------------------------------------------------

-- 1. Fix 'admin_requests' Foreign Key
-- We drop the existing constraint and re-add it with CASCADE.
-- We wrap in a DO block to handle potential missing constraint names gracefully or just use standard ALTER.

DO $$
BEGIN
    -- Try to drop common constraint names for admin_requests
    ALTER TABLE public.admin_requests DROP CONSTRAINT IF EXISTS "admin_requests_user_id_fkey";
    ALTER TABLE public.admin_requests DROP CONSTRAINT IF EXISTS "admin_requests_profile_id_fkey";
    
    -- Re-add constraint referencing PROFILES with CASCADE
    ALTER TABLE public.admin_requests 
    ADD CONSTRAINT "admin_requests_user_id_fkey" 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
EXCEPTION
    WHEN undefined_object THEN NULL; -- Ignore if table doesn't exist
END $$;


-- 2. Fix 'content' (Astrophotography posts) Foreign Key if it exists
DO $$
BEGIN
    -- Try to drop common constraint names for content
    ALTER TABLE public.content DROP CONSTRAINT IF EXISTS "content_user_id_fkey";
    ALTER TABLE public.content DROP CONSTRAINT IF EXISTS "content_author_id_fkey";
    
    -- Re-add constraint referencing PROFILES with CASCADE (Assuming column is user_id)
    -- If your column is named differently (e.g. author_id), you might need to adjust this.
    -- We assume 'user_id' based on standard conventions in this project.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'user_id') THEN
        ALTER TABLE public.content 
        ADD CONSTRAINT "content_user_id_fkey" 
        FOREIGN KEY (user_id) 
        REFERENCES public.profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;
