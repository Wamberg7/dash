-- Schema do banco de dados para o projeto Berg
-- Execute este SQL no SQL Editor do Supabase
-- Este arquivo contém todas as tabelas, índices, políticas RLS e dados iniciais

-- ============================================
-- TABELAS
-- ============================================

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  features JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  highlight TEXT,
  icon_type TEXT CHECK (icon_type IN ('shopping-cart', 'bot')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('completed', 'pending', 'failed')) DEFAULT 'pending',
  date TIMESTAMPTZ NOT NULL,
  payment_method TEXT NOT NULL,
  payment_id TEXT,
  bot_token TEXT,
  server_id TEXT,
  owner_id TEXT,
  bot_status TEXT CHECK (bot_status IN ('waiting', 'hosted', 'active', 'inactive', 'online', 'offline', 'invalid_data')) DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_bot_status ON orders(bot_status);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  payment_gateway TEXT NOT NULL,
  api_key TEXT NOT NULL,
  enable_pix BOOLEAN DEFAULT true,
  enable_credit_card BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de visitas
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY DEFAULT 'main',
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  discriminator TEXT DEFAULT '0',
  avatar TEXT,
  email TEXT,
  verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- Remover políticas antigas antes de criar novas (para evitar erros)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Products are insertable by authenticated users" ON products;
DROP POLICY IF EXISTS "Products are updatable by authenticated users" ON products;
DROP POLICY IF EXISTS "Products are deletable by authenticated users" ON products;

DROP POLICY IF EXISTS "Orders are viewable by authenticated users" ON orders;
DROP POLICY IF EXISTS "Orders are insertable by everyone" ON orders;

DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
DROP POLICY IF EXISTS "Settings are insertable by authenticated users" ON settings;
DROP POLICY IF EXISTS "Settings are updatable by authenticated users" ON settings;

DROP POLICY IF EXISTS "Visits are viewable by everyone" ON visits;
DROP POLICY IF EXISTS "Visits are insertable by everyone" ON visits;
DROP POLICY IF EXISTS "Visits are updatable by everyone" ON visits;

DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users are insertable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users are insertable during registration" ON users;
DROP POLICY IF EXISTS "Users are updatable by authenticated users" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Products: leitura pública, escrita para autenticados
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Products are insertable by authenticated users" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Products are updatable by authenticated users" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Products are deletable by authenticated users" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Orders: leitura e escrita para autenticados
CREATE POLICY "Orders are viewable by authenticated users" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Orders are insertable by everyone" ON orders
  FOR INSERT WITH CHECK (true);

-- Settings: leitura pública, escrita para autenticados
CREATE POLICY "Settings are viewable by everyone" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Settings are insertable by authenticated users" ON settings
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Settings are updatable by authenticated users" ON settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Visits: leitura pública, escrita para todos
CREATE POLICY "Visits are viewable by everyone" ON visits
  FOR SELECT USING (true);

CREATE POLICY "Visits are insertable by everyone" ON visits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Visits are updatable by everyone" ON visits
  FOR UPDATE USING (true);

-- Users: leitura e escrita para autenticados
CREATE POLICY "Users are viewable by authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Permite inserção durante registro (permite para todos durante o cadastro inicial)
-- IMPORTANTE: Esta política permite inserção livre para facilitar o registro
-- Em produção, você pode querer restringir mais
CREATE POLICY "Allow user registration" ON users
  FOR INSERT 
  WITH CHECK (true);

-- Permite atualização apenas para o próprio usuário ou administradores
CREATE POLICY "Users are updatable by authenticated users" ON users
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND 
    (discord_id = auth.uid()::text OR 
     EXISTS (
       SELECT 1 FROM users 
       WHERE discord_id = auth.uid()::text AND is_admin = true
     ))
  );

-- ============================================
-- DADOS INICIAIS
-- ============================================

INSERT INTO products (id, title, description, price, features, active, highlight, icon_type)
VALUES 
  ('sales-bot', 'Bot de Vendas', 'Automatize suas vendas com entrega imediata, controle de estoque e múltiplos métodos de pagamento.', 15.0, '["Entrega automática", "Pix e Cartão", "Controle de Estoque", "Cupom de Desconto"]', true, 'Mais Popular', 'shopping-cart'),
  ('ticket-bot', 'Bot de Tickets com IA', 'Atendimento automático e inteligente 24/7 com respostas geradas por IA para tirar dúvidas dos membros.', 15.0, '["Respostas com IA", "Atendimento 24/7", "Aprendizado Contínuo", "Triagem Automática"]', true, 'Inovação', 'bot')
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (id, payment_gateway, api_key, enable_pix, enable_credit_card)
VALUES ('main', 'Stripe', 'sk_test_...', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO visits (id, count)
VALUES ('main', 1240)
ON CONFLICT (id) DO NOTHING;

