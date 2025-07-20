-- Add media fields to messages table
ALTER TABLE public.messages 
ADD COLUMN media_url TEXT,
ADD COLUMN media_base64 TEXT;