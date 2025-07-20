-- Migration to associate existing data with the first admin user
-- This is a one-time migration to handle existing data

DO $$ 
DECLARE
    admin_user_id UUID;
    has_connections INTEGER := 0;
    has_campaigns INTEGER := 0;
    has_groups INTEGER := 0;
    column_exists BOOLEAN;
BEGIN
    -- Check if user_id column exists in connections table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'connections' AND column_name = 'user_id'
    ) INTO column_exists;
    
    IF column_exists THEN
        SELECT COUNT(*) INTO has_connections FROM public.connections WHERE user_id IS NULL;
    ELSE
        SELECT COUNT(*) INTO has_connections FROM public.connections;
    END IF;
    
    -- Check if user_id column exists in campaigns table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'user_id'
    ) INTO column_exists;
    
    IF column_exists THEN
        SELECT COUNT(*) INTO has_campaigns FROM public.campaigns WHERE user_id IS NULL;
    ELSE
        SELECT COUNT(*) INTO has_campaigns FROM public.campaigns;
    END IF;
    
    -- Check if user_id column exists in groups table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'user_id'
    ) INTO column_exists;
    
    IF column_exists THEN
        SELECT COUNT(*) INTO has_groups FROM public.groups WHERE user_id IS NULL;
    ELSE
        SELECT COUNT(*) INTO has_groups FROM public.groups;
    END IF;
    
    -- Only proceed if there's orphaned data
    IF has_connections > 0 OR has_campaigns > 0 OR has_groups > 0 THEN
        -- Get the first user from auth.users (should be the admin)
        SELECT id INTO admin_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
        
        -- If no user exists in auth.users, try to get from public.users
        IF admin_user_id IS NULL THEN
            SELECT id INTO admin_user_id FROM public.users ORDER BY created_at ASC LIMIT 1;
        END IF;
        
        -- If we found an admin user, assign orphaned data to them
        IF admin_user_id IS NOT NULL THEN
            RAISE NOTICE 'Migrating existing data to admin user: %', admin_user_id;
            
            -- Update connections (only if user_id column exists)
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'connections' AND column_name = 'user_id'
            ) INTO column_exists;
            
            IF column_exists THEN
                UPDATE public.connections SET user_id = admin_user_id WHERE user_id IS NULL;
                RAISE NOTICE 'Updated connections table';
            END IF;
            
            -- Update campaigns (only if user_id column exists)
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'campaigns' AND column_name = 'user_id'
            ) INTO column_exists;
            
            IF column_exists THEN
                UPDATE public.campaigns SET user_id = admin_user_id WHERE user_id IS NULL;
                RAISE NOTICE 'Updated campaigns table';
            END IF;
            
            -- Update contacts (only if user_id column exists)
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'contacts' AND column_name = 'user_id'
            ) INTO column_exists;
            
            IF column_exists THEN
                UPDATE public.contacts SET user_id = admin_user_id WHERE user_id IS NULL;
                RAISE NOTICE 'Updated contacts table';
            END IF;
            
            -- Update messages (only if user_id column exists)
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'messages' AND column_name = 'user_id'
            ) INTO column_exists;
            
            IF column_exists THEN
                UPDATE public.messages SET user_id = admin_user_id WHERE user_id IS NULL;
                RAISE NOTICE 'Updated messages table';
            END IF;
            
            -- Update groups (only if user_id column exists)
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'groups' AND column_name = 'user_id'
            ) INTO column_exists;
            
            IF column_exists THEN
                UPDATE public.groups SET user_id = admin_user_id WHERE user_id IS NULL;
                RAISE NOTICE 'Updated groups table';
            END IF;
            
            -- Update group_members (only if user_id column exists)
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'group_members' AND column_name = 'user_id'
            ) INTO column_exists;
            
            IF column_exists THEN
                UPDATE public.group_members SET user_id = admin_user_id WHERE user_id IS NULL;
                RAISE NOTICE 'Updated group_members table';
            END IF;
            
            -- Update settings (only if user_id column exists)
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'settings' AND column_name = 'user_id'
            ) INTO column_exists;
            
            IF column_exists THEN
                UPDATE public.settings SET user_id = admin_user_id WHERE user_id IS NULL;
                RAISE NOTICE 'Updated settings table';
            END IF;
            
            RAISE NOTICE 'Data migration completed successfully';
        ELSE
            RAISE NOTICE 'No admin user found - data will remain orphaned until first user logs in';
        END IF;
    ELSE
        RAISE NOTICE 'No orphaned data found - migration not needed';
    END IF;
END $$;