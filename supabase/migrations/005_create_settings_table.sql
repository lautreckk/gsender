-- Migration: Create settings table for application configuration
-- Date: 2025-01-19

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS settings_key_idx ON settings(key);
CREATE INDEX IF NOT EXISTS settings_category_idx ON settings(category);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value, category, description) VALUES
-- White Label settings
('company_name', '"WhatsApp Pulse Platform"', 'white_label', 'Nome da empresa exibido na aplicação'),
('company_logo', '""', 'white_label', 'URL do logo da empresa'),
('footer_text', '"© 2024 WhatsApp Pulse Platform. Todos os direitos reservados."', 'white_label', 'Texto do rodapé da aplicação'),
('primary_color', '"#2563eb"', 'white_label', 'Cor primária da aplicação'),
('secondary_color', '"#64748b"', 'white_label', 'Cor secundária da aplicação'),
('accent_color', '"#10b981"', 'white_label', 'Cor de destaque da aplicação'),

-- API & Integration settings
('evolution_api_url', '"https://api.gruposena.club"', 'api', 'URL do servidor EvolutionAPI'),
('evolution_api_key', '"3ac318ab976bc8c75dfe827e865a576c"', 'api', 'Chave global da EvolutionAPI'),
('supabase_url', '""', 'api', 'URL do projeto Supabase'),
('supabase_anon_key', '""', 'api', 'Chave anônima do Supabase'),
('supabase_service_role_key', '""', 'api', 'Chave de service role do Supabase'),

-- Campaign settings
('default_message_interval', '30', 'campaign', 'Intervalo padrão entre mensagens (segundos)'),
('max_contacts_per_campaign', '10000', 'campaign', 'Número máximo de contatos por campanha'),
('allow_media_messages', 'true', 'campaign', 'Permitir mensagens de mídia'),
('require_campaign_approval', 'false', 'campaign', 'Exigir aprovação para campanhas'),

-- Security settings
('require_2fa', 'false', 'security', 'Exigir autenticação de dois fatores'),
('session_timeout', '3600', 'security', 'Timeout da sessão em segundos'),
('max_login_attempts', '5', 'security', 'Máximo de tentativas de login'),
('password_min_length', '8', 'security', 'Comprimento mínimo da senha'),

-- Notification settings
('email_notifications', 'true', 'notifications', 'Habilitar notificações por email'),
('webhook_notifications', 'false', 'notifications', 'Habilitar notificações via webhook'),
('webhook_url', '""', 'notifications', 'URL do webhook para notificações'),
('notify_campaign_start', 'true', 'notifications', 'Notificar início de campanha'),
('notify_campaign_complete', 'true', 'notifications', 'Notificar conclusão de campanha'),
('notify_campaign_errors', 'true', 'notifications', 'Notificar erros de campanha'),

-- General settings
('app_name', '"WhatsApp Pulse Platform"', 'general', 'Nome da aplicação'),
('app_version', '"1.0.0"', 'general', 'Versão da aplicação'),
('maintenance_mode', 'false', 'general', 'Modo de manutenção'),
('timezone', '"America/Sao_Paulo"', 'general', 'Fuso horário padrão'),
('date_format', '"DD/MM/YYYY"', 'general', 'Formato de data padrão'),
('time_format', '"HH:mm"', 'general', 'Formato de hora padrão')

ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- In a production environment, you might want more restrictive policies
CREATE POLICY "Allow full access for authenticated users" ON settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow read access for service role
CREATE POLICY "Allow read access for service role" ON settings
    FOR SELECT USING (auth.role() = 'service_role');

-- Create policy to allow all operations for service role
CREATE POLICY "Allow all operations for service role" ON settings
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON settings TO authenticated;
GRANT ALL ON settings TO service_role;

-- Add helpful comments
COMMENT ON TABLE settings IS 'Application configuration settings stored as key-value pairs with JSONB values';
COMMENT ON COLUMN settings.key IS 'Unique identifier for the setting';
COMMENT ON COLUMN settings.value IS 'Setting value stored as JSONB for flexibility';
COMMENT ON COLUMN settings.category IS 'Category to group related settings';
COMMENT ON COLUMN settings.description IS 'Human-readable description of the setting';