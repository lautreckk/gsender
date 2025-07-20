-- Safe migration to handle existing data after user_id columns are added
-- Run this AFTER migration 011 (add_user_isolation) has been successfully applied

DO $$ 
DECLARE
    admin_user_id UUID;
    rec RECORD;
BEGIN
    -- First, try to get admin user from auth.users
    SELECT id INTO admin_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    -- If no user in auth.users, try public.users
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM public.users ORDER BY created_at ASC LIMIT 1;
    END IF;
    
    IF admin_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found admin user: %, starting data migration...', admin_user_id;
        
        -- Migrate connections
        UPDATE public.connections 
        SET user_id = admin_user_id 
        WHERE user_id IS NULL;
        
        GET DIAGNOSTICS rec = ROW_COUNT;
        RAISE NOTICE 'Updated % connections', rec;
        
        -- Migrate campaigns
        UPDATE public.campaigns 
        SET user_id = admin_user_id 
        WHERE user_id IS NULL;
        
        GET DIAGNOSTICS rec = ROW_COUNT;
        RAISE NOTICE 'Updated % campaigns', rec;
        
        -- Migrate contacts
        UPDATE public.contacts 
        SET user_id = admin_user_id 
        WHERE user_id IS NULL;
        
        GET DIAGNOSTICS rec = ROW_COUNT;
        RAISE NOTICE 'Updated % contacts', rec;
        
        -- Migrate messages
        UPDATE public.messages 
        SET user_id = admin_user_id 
        WHERE user_id IS NULL;
        
        GET DIAGNOSTICS rec = ROW_COUNT;
        RAISE NOTICE 'Updated % messages', rec;
        
        -- Migrate groups
        UPDATE public.groups 
        SET user_id = admin_user_id 
        WHERE user_id IS NULL;
        
        GET DIAGNOSTICS rec = ROW_COUNT;
        RAISE NOTICE 'Updated % groups', rec;
        
        -- Migrate group_members
        UPDATE public.group_members 
        SET user_id = admin_user_id 
        WHERE user_id IS NULL;
        
        GET DIAGNOSTICS rec = ROW_COUNT;
        RAISE NOTICE 'Updated % group_members', rec;
        
        -- Migrate settings
        UPDATE public.settings 
        SET user_id = admin_user_id 
        WHERE user_id IS NULL;
        
        GET DIAGNOSTICS rec = ROW_COUNT;
        RAISE NOTICE 'Updated % settings', rec;
        
        RAISE NOTICE 'Data migration completed successfully for user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'No admin user found. Create a user account first, then run this migration.';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Migration failed with error: %', SQLERRM;
        RAISE NOTICE 'This is normal if migration 011 hasn''t been applied yet.';
END $$;