-- Migration: Adicionar tabela de aplicações SquareCloud vinculadas aos usuários
-- Execute este SQL no SQL Editor do Supabase

-- Criar tabela applications
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY, -- ID da aplicação na SquareCloud
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- UUID do usuário na tabela users
  discord_user_id TEXT NOT NULL, -- Discord ID do usuário (para referência rápida)
  name TEXT NOT NULL, -- Nome da aplicação
  valor_total TEXT, -- Valor total da aplicação
  expira TIMESTAMPTZ, -- Data de expiração
  tipo TEXT, -- Tipo do bot (Gen, Ticket, etc)
  adicionais TEXT, -- Informações adicionais
  bot_id TEXT, -- ID interno do bot (do sistema de carrinho)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_discord_user_id ON applications(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_applications_id ON applications(id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Política RLS: Permitir leitura para usuários autenticados (apenas suas próprias aplicações)
CREATE POLICY "Applications are viewable by owner" ON applications
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND 
    (
      discord_user_id = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE discord_id = auth.uid()::text AND is_admin = true
      )
    )
  );

-- Política RLS: Permitir inserção para todos (bot precisa poder inserir)
CREATE POLICY "Applications are insertable by everyone" ON applications
  FOR INSERT 
  WITH CHECK (true);

-- Política RLS: Permitir atualização para o dono ou administradores
CREATE POLICY "Applications are updatable by owner" ON applications
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND 
    (
      discord_user_id = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE discord_id = auth.uid()::text AND is_admin = true
      )
    )
  );

-- Política RLS: Permitir exclusão para o dono ou administradores
CREATE POLICY "Applications are deletable by owner" ON applications
  FOR DELETE 
  USING (
    auth.role() = 'authenticated' AND 
    (
      discord_user_id = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE discord_id = auth.uid()::text AND is_admin = true
      )
    )
  );

