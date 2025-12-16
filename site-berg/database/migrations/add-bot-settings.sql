-- Migration: Adicionar tabela de configurações do bot Discord
-- Execute este SQL no SQL Editor do Supabase

-- Criar tabela bot_settings
CREATE TABLE IF NOT EXISTS bot_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  -- Tokens e credenciais
  discord_token TEXT,
  squarecloud_access_token TEXT,
  mercado_pago_access_token TEXT,
  -- IDs do Discord
  bot_id TEXT,
  server_id TEXT,
  owner_id TEXT,
  -- URLs e configurações
  backend_url TEXT DEFAULT 'http://localhost:3001',
  use_backend BOOLEAN DEFAULT false,
  webhook_url TEXT,
  -- Canais do Discord
  carrinhos_channel_id TEXT,
  logs_compras_channel_id TEXT,
  logs_bot_enviados_channel_id TEXT,
  logs_bot_expirados_channel_id TEXT,
  logs_quebrar_termos_channel_id TEXT,
  logs_renovacao_channel_id TEXT,
  logs_start_channel_id TEXT,
  -- Imagens
  imagem_gen TEXT,
  imagem_money TEXT,
  imagem_auth TEXT,
  imagem_ticket TEXT,
  -- Valores dos produtos
  valor_bot_gen TEXT,
  valor_bot_auth TEXT,
  valor_bio_perso TEXT,
  valor_stock_ex TEXT,
  valor_stock_auto TEXT,
  valor_stock_man TEXT,
  valor_bot_ticket TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_bot_settings_id ON bot_settings(id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;

-- Política RLS: Permitir leitura pública (API precisa ler usando chave anônima)
CREATE POLICY "Bot settings are viewable by everyone" ON bot_settings
  FOR SELECT USING (true);

-- Política RLS: Permitir inserção para todos (API precisa poder inserir)
CREATE POLICY "Bot settings are insertable by everyone" ON bot_settings
  FOR INSERT 
  WITH CHECK (true);

-- Política RLS: Permitir atualização para todos (API precisa poder atualizar)
CREATE POLICY "Bot settings are updatable by everyone" ON bot_settings
  FOR UPDATE 
  USING (true);

-- Inserir registro padrão
INSERT INTO bot_settings (id) 
VALUES ('main')
ON CONFLICT (id) DO NOTHING;

