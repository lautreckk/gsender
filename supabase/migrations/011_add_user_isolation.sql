-- Migration to add user isolation and Row Level Security (RLS)
-- This ensures users only see their own data

-- First, add user_id to all tables that need user isolation
DO $$ 
BEGIN
    -- Add user_id to connections table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'connections' AND column_name = 'user_id') THEN
        ALTER TABLE public.connections ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to campaigns table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'user_id') THEN
        ALTER TABLE public.campaigns ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to contacts table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'user_id') THEN
        ALTER TABLE public.contacts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to messages table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'user_id') THEN
        ALTER TABLE public.messages ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to groups table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'user_id') THEN
        ALTER TABLE public.groups ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to group_members table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'user_id') THEN
        ALTER TABLE public.group_members ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to settings table if it doesn't have it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'user_id') THEN
        ALTER TABLE public.settings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for connections
DROP POLICY IF EXISTS "Users can only see own connections" ON public.connections;
CREATE POLICY "Users can only see own connections" ON public.connections
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for campaigns
DROP POLICY IF EXISTS "Users can only see own campaigns" ON public.campaigns;
CREATE POLICY "Users can only see own campaigns" ON public.campaigns
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for contacts
DROP POLICY IF EXISTS "Users can only see own contacts" ON public.contacts;
CREATE POLICY "Users can only see own contacts" ON public.contacts
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for messages
DROP POLICY IF EXISTS "Users can only see own messages" ON public.messages;
CREATE POLICY "Users can only see own messages" ON public.messages
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for groups
DROP POLICY IF EXISTS "Users can only see own groups" ON public.groups;
CREATE POLICY "Users can only see own groups" ON public.groups
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for group_members
DROP POLICY IF EXISTS "Users can only see own group members" ON public.group_members;
CREATE POLICY "Users can only see own group members" ON public.group_members
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for settings
DROP POLICY IF EXISTS "Users can only see own settings" ON public.settings;
CREATE POLICY "Users can only see own settings" ON public.settings
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON public.connections(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON public.groups(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- Function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id
DROP TRIGGER IF EXISTS set_user_id_connections ON public.connections;
CREATE TRIGGER set_user_id_connections
    BEFORE INSERT ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_campaigns ON public.campaigns;
CREATE TRIGGER set_user_id_campaigns
    BEFORE INSERT ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_contacts ON public.contacts;
CREATE TRIGGER set_user_id_contacts
    BEFORE INSERT ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_messages ON public.messages;
CREATE TRIGGER set_user_id_messages
    BEFORE INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_groups ON public.groups;
CREATE TRIGGER set_user_id_groups
    BEFORE INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_group_members ON public.group_members;
CREATE TRIGGER set_user_id_group_members
    BEFORE INSERT ON public.group_members
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_settings ON public.settings;
CREATE TRIGGER set_user_id_settings
    BEFORE INSERT ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_user_id();