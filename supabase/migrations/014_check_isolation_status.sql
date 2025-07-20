-- Check the status of user isolation implementation
-- This query will show what tables have user_id columns and RLS enabled

DO $$
DECLARE
    rec RECORD;
    table_name TEXT;
    has_user_id BOOLEAN;
    has_rls BOOLEAN;
    rls_policies INTEGER;
    orphaned_records INTEGER;
BEGIN
    RAISE NOTICE '=== USER ISOLATION STATUS CHECK ===';
    RAISE NOTICE '';
    
    -- Check each table
    FOR table_name IN 
        SELECT unnest(ARRAY['connections', 'campaigns', 'contacts', 'messages', 'groups', 'group_members', 'settings'])
    LOOP
        -- Check if table exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            RAISE NOTICE 'Table % does not exist', table_name;
            CONTINUE;
        END IF;
        
        -- Check if user_id column exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_name AND column_name = 'user_id' AND table_schema = 'public'
        ) INTO has_user_id;
        
        -- Check if RLS is enabled
        SELECT relrowsecurity INTO has_rls 
        FROM pg_class 
        WHERE relname = table_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        -- Count RLS policies
        SELECT COUNT(*) INTO rls_policies
        FROM pg_policies 
        WHERE tablename = table_name AND schemaname = 'public';
        
        -- Count orphaned records (if user_id column exists)
        orphaned_records := 0;
        IF has_user_id THEN
            EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE user_id IS NULL', table_name) INTO orphaned_records;
        END IF;
        
        RAISE NOTICE 'Table: % | user_id: % | RLS: % | Policies: % | Orphaned: %', 
            table_name, 
            CASE WHEN has_user_id THEN '✓' ELSE '✗' END,
            CASE WHEN has_rls THEN '✓' ELSE '✗' END,
            rls_policies,
            orphaned_records;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== USERS IN SYSTEM ===';
    
    -- Check auth.users
    SELECT COUNT(*) INTO rec FROM auth.users;
    RAISE NOTICE 'Users in auth.users: %', rec;
    
    -- Check public.users
    SELECT COUNT(*) INTO rec FROM public.users;
    RAISE NOTICE 'Users in public.users: %', rec;
    
    -- Show first user (potential admin)
    FOR rec IN 
        SELECT id, email, created_at 
        FROM auth.users 
        ORDER BY created_at ASC 
        LIMIT 1
    LOOP
        RAISE NOTICE 'First user (admin): % - % (created: %)', rec.id, rec.email, rec.created_at;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RECOMMENDATIONS ===';
    
    -- Check if we need to run migrations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'connections' AND column_name = 'user_id') THEN
        RAISE NOTICE '1. Run migration 011_add_user_isolation.sql to add user_id columns and RLS';
    ELSE
        RAISE NOTICE '1. ✓ User isolation structure is in place';
    END IF;
    
    -- Check for orphaned data
    SELECT COUNT(*) INTO rec FROM public.connections WHERE user_id IS NULL;
    IF rec > 0 THEN
        RAISE NOTICE '2. Run migration 013_safe_data_migration.sql to assign orphaned data to admin user';
        RAISE NOTICE '   Found % orphaned connections', rec;
    ELSE
        RAISE NOTICE '2. ✓ No orphaned data found';
    END IF;
    
END $$;