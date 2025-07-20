-- Migration to add trial and subscription functionality to users
-- This extends the existing users table with trial management fields

-- First, add new columns to existing users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'basic', 'premium')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS trial_activated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT true;

-- Create coupon codes table
CREATE TABLE IF NOT EXISTS public.coupon_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    trial_days INTEGER NOT NULL DEFAULT 1,
    max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Insert default coupon codes
INSERT INTO public.coupon_codes (code, description, trial_days, max_uses, is_active) VALUES
('gruposena', '7-day trial coupon for GrupoSena users', 7, NULL, true),
('default', 'Default 24-hour trial', 1, NULL, true)
ON CONFLICT (code) DO NOTHING;

-- Create user trial logs table for tracking
CREATE TABLE IF NOT EXISTS public.user_trial_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'trial_started', 'trial_extended', 'trial_expired', 'upgraded'
    old_expires_at TIMESTAMP WITH TIME ZONE,
    new_expires_at TIMESTAMP WITH TIME ZONE,
    coupon_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Function to check if user trial is expired
CREATE OR REPLACE FUNCTION public.is_user_trial_expired(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    trial_expires TIMESTAMP WITH TIME ZONE;
    is_active BOOLEAN;
BEGIN
    SELECT trial_expires_at, is_trial_active 
    INTO trial_expires, is_active
    FROM public.users 
    WHERE id = user_id;
    
    -- If no trial info found or trial not active, consider expired
    IF trial_expires IS NULL OR is_active = false THEN
        RETURN true;
    END IF;
    
    -- Check if current time is past expiration
    RETURN trial_expires < TIMEZONE('utc'::text, NOW());
END;
$$;

-- Function to activate trial for user
CREATE OR REPLACE FUNCTION public.activate_user_trial(
    user_id UUID,
    coupon_code_input TEXT DEFAULT 'default'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    coupon_info RECORD;
    new_expires_at TIMESTAMP WITH TIME ZONE;
    old_expires_at TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Get coupon information
    SELECT trial_days, max_uses, current_uses, is_active, expires_at
    INTO coupon_info
    FROM public.coupon_codes
    WHERE code = coupon_code_input;
    
    -- Check if coupon exists and is valid
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Cupom não encontrado');
    END IF;
    
    IF NOT coupon_info.is_active THEN
        RETURN json_build_object('success', false, 'error', 'Cupom inativo');
    END IF;
    
    IF coupon_info.expires_at IS NOT NULL AND coupon_info.expires_at < TIMEZONE('utc'::text, NOW()) THEN
        RETURN json_build_object('success', false, 'error', 'Cupom expirado');
    END IF;
    
    IF coupon_info.max_uses IS NOT NULL AND coupon_info.current_uses >= coupon_info.max_uses THEN
        RETURN json_build_object('success', false, 'error', 'Cupom esgotado');
    END IF;
    
    -- Get current trial expiration
    SELECT trial_expires_at INTO old_expires_at FROM public.users WHERE id = user_id;
    
    -- Calculate new expiration date
    new_expires_at := TIMEZONE('utc'::text, NOW()) + (coupon_info.trial_days || ' days')::INTERVAL;
    
    -- Update user trial
    UPDATE public.users SET
        trial_expires_at = new_expires_at,
        coupon_code = coupon_code_input,
        subscription_plan = 'trial',
        subscription_status = 'active',
        trial_activated_at = TIMEZONE('utc'::text, NOW()),
        is_trial_active = true
    WHERE id = user_id;
    
    -- Update coupon usage
    UPDATE public.coupon_codes SET
        current_uses = current_uses + 1
    WHERE code = coupon_code_input;
    
    -- Log the trial activation
    INSERT INTO public.user_trial_logs (user_id, action, old_expires_at, new_expires_at, coupon_code)
    VALUES (user_id, 'trial_started', old_expires_at, new_expires_at, coupon_code_input);
    
    RETURN json_build_object(
        'success', true,
        'trial_expires_at', new_expires_at,
        'trial_days', coupon_info.trial_days,
        'coupon_code', coupon_code_input
    );
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trial_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for coupon_codes (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to read coupon codes" ON public.coupon_codes
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS policies for user_trial_logs (users can only see their own logs)
CREATE POLICY "Users can view their own trial logs" ON public.user_trial_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_trial_expires_at ON public.users(trial_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON public.coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_user_trial_logs_user_id ON public.user_trial_logs(user_id);