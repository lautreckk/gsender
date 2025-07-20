-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'document')),
    content TEXT NOT NULL, -- For text messages, this is the text content. For media, this is the file URL
    order_index INTEGER NOT NULL DEFAULT 1, -- Order of the message in the campaign (1-5)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Media file metadata (for non-text messages)
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    media_url TEXT, -- URL or base64 of the media file
    media_base64 TEXT, -- Base64 representation for local storage
    
    -- Ensure valid order range and unique order per campaign
    CHECK (order_index >= 1 AND order_index <= 5),
    UNIQUE(campaign_id, order_index)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON public.messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_order ON public.messages(campaign_id, order_index);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view messages from their campaigns" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE campaigns.id = messages.campaign_id 
            AND campaigns.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their campaigns" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE campaigns.id = messages.campaign_id 
            AND campaigns.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update messages from their campaigns" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE campaigns.id = messages.campaign_id 
            AND campaigns.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages from their campaigns" ON public.messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE campaigns.id = messages.campaign_id 
            AND campaigns.created_by = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER trigger_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();