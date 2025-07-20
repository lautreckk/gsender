-- Add instance_id field to campaigns table to link with connections
ALTER TABLE public.campaigns 
ADD COLUMN instance_id UUID REFERENCES public.connections(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_campaigns_instance_id ON public.campaigns(instance_id);

-- Add other missing fields that the application code expects
ALTER TABLE public.campaigns 
ADD COLUMN last_execution TIMESTAMP WITH TIME ZONE,
ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN resumed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN completion_reason TEXT;