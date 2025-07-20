-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    numero TEXT NOT NULL, -- Phone number with country code (e.g., 5511999999999)
    tag TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Message status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Prevent duplicate contacts within same campaign
    UNIQUE(campaign_id, numero)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_campaign_id ON public.contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contacts_numero ON public.contacts(numero);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_tag ON public.contacts(tag);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view contacts from their campaigns" ON public.contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE campaigns.id = contacts.campaign_id 
            AND campaigns.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert contacts to their campaigns" ON public.contacts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE campaigns.id = contacts.campaign_id 
            AND campaigns.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update contacts from their campaigns" ON public.contacts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE campaigns.id = contacts.campaign_id 
            AND campaigns.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete contacts from their campaigns" ON public.contacts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE campaigns.id = contacts.campaign_id 
            AND campaigns.created_by = auth.uid()
        )
    );