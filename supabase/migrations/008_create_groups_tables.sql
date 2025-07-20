-- Tabela para armazenar grupos do WhatsApp
CREATE TABLE groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    whatsapp_group_id TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    subject_owner TEXT,
    subject_time BIGINT,
    picture_url TEXT,
    size INTEGER DEFAULT 0,
    creation BIGINT NOT NULL,
    owner TEXT,
    description TEXT,
    desc_id TEXT,
    restrict BOOLEAN DEFAULT false,
    announce BOOLEAN DEFAULT false,
    is_community BOOLEAN DEFAULT false,
    is_community_announce BOOLEAN DEFAULT false,
    instance_name TEXT DEFAULT 'GabrielSenax',
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar membros dos grupos
CREATE TABLE group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    whatsapp_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    admin_role TEXT CHECK (admin_role IN ('admin', 'superadmin')) NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, whatsapp_id)
);

-- Índices para melhor performance
CREATE INDEX idx_groups_whatsapp_group_id ON groups(whatsapp_group_id);
CREATE INDEX idx_groups_instance_name ON groups(instance_name);
CREATE INDEX idx_groups_is_community ON groups(is_community);
CREATE INDEX idx_groups_size ON groups(size);
CREATE INDEX idx_groups_last_sync_at ON groups(last_sync_at);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_whatsapp_id ON group_members(whatsapp_id);
CREATE INDEX idx_group_members_admin_role ON group_members(admin_role);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_groups_updated_at 
    BEFORE UPDATE ON groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para sincronizar contagem de membros
CREATE OR REPLACE FUNCTION sync_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE groups 
        SET size = (
            SELECT COUNT(*) 
            FROM group_members 
            WHERE group_id = OLD.group_id
        )
        WHERE id = OLD.group_id;
        RETURN OLD;
    ELSE
        UPDATE groups 
        SET size = (
            SELECT COUNT(*) 
            FROM group_members 
            WHERE group_id = NEW.group_id
        )
        WHERE id = NEW.group_id;
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_group_member_count_trigger
    AFTER INSERT OR DELETE ON group_members
    FOR EACH ROW EXECUTE FUNCTION sync_group_member_count();

-- RLS (Row Level Security) policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações para usuários autenticados
CREATE POLICY "Allow all operations for authenticated users" ON groups
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON group_members
    FOR ALL USING (auth.role() = 'authenticated');