-- Simple migration to add trial fields to users table
-- This is a fallback in case the previous migration wasn't applied

-- Add trial columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add trial_expires_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trial_expires_at') THEN
        ALTER TABLE public.users ADD COLUMN trial_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add coupon_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coupon_code') THEN
        ALTER TABLE public.users ADD COLUMN coupon_code TEXT;
    END IF;
    
    -- Add subscription_plan column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_plan') THEN
        ALTER TABLE public.users ADD COLUMN subscription_plan TEXT DEFAULT 'trial';
    END IF;
    
    -- Add subscription_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.users ADD COLUMN subscription_status TEXT DEFAULT 'active';
    END IF;
    
    -- Add trial_activated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trial_activated_at') THEN
        ALTER TABLE public.users ADD COLUMN trial_activated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
    END IF;
    
    -- Add is_trial_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_trial_active') THEN
        ALTER TABLE public.users ADD COLUMN is_trial_active BOOLEAN DEFAULT true;
    END IF;
END $$;