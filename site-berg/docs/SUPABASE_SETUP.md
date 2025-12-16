# Configuração do Supabase

Este guia explica como configurar o Supabase para o projeto.

## 📋 Pré-requisitos

1. Uma conta no [Supabase](https://supabase.com)
2. Um projeto criado no Supabase

## 🔧 Passo a Passo

### 1. Criar um Projeto no Supabase

1. Acesse https://supabase.com
2. Faça login ou crie uma conta
3. Clique em **"New Project"**
4. Preencha os dados do projeto:
   - Nome do projeto
   - Senha do banco de dados
   - Região (escolha a mais próxima)
5. Clique em **"Create new project"**

### 2. Obter Credenciais

1. No dashboard do projeto, vá em **Settings** > **API**
2. Copie os seguintes valores:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon public** key (VITE_SUPABASE_ANON_KEY)

### 3. Configurar Variáveis de Ambiente

Crie ou atualize o arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui

# Discord OAuth (para autenticação)
VITE_DISCORD_CLIENT_ID=seu_client_id_discord

# IDs dos administradores (opcional)
VITE_ADMIN_IDS=123456789,987654321
```

### 4. Desabilitar Confirmação de Email (Opcional)

Para permitir que usuários façam login imediatamente após o cadastro, sem precisar confirmar o email:

1. No dashboard do Supabase, vá em **Authentication** > **Settings**
2. Encontre a seção **Email Auth**
3. Desative a opção **"Enable email confirmations"** (ou "Confirm email")
4. Salve as alterações

**Nota**: Isso permite que usuários façam login imediatamente após o cadastro, sem precisar verificar o email. Use com cuidado em produção.

### 5. Configurar Autenticação Discord no Supabase

1. No dashboard do Supabase, vá em **Authentication** > **Providers**
2. Encontre **Discord** na lista
3. Ative o provider Discord
4. Adicione as credenciais do Discord:
   - **Client ID**: Seu Client ID do Discord (obtenha em https://discord.com/developers/applications)
   - **Client Secret**: Seu Client Secret do Discord
5. Configure a **Redirect URL**:
   - Adicione: `https://seu-projeto.supabase.co/auth/v1/callback`
   - E também: `http://localhost:8080/auth/callback` (para desenvolvimento)

### 6. Criar Tabelas no Banco de Dados

Execute o SQL do arquivo `database/schema.sql` no **SQL Editor** do Supabase (vá em **SQL Editor** > **New Query**):

1. Abra o arquivo `database/schema.sql` do projeto
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** ou pressione `Ctrl+Enter`

**Nota**: O arquivo está organizado em seções (Tabelas, Índices, RLS, Políticas, Dados Iniciais) para facilitar a leitura.

Ou você pode copiar e colar o conteúdo abaixo:

```sql
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- Habilitar Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir leitura pública, escrita apenas para autenticados)
-- Products: leitura pública, escrita para autenticados
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Products are insertable by authenticated users" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Products are updatable by authenticated users" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Orders: leitura e escrita para autenticados
CREATE POLICY "Orders are viewable by authenticated users" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Orders are insertable by everyone" ON orders
  FOR INSERT WITH CHECK (true);

-- Settings: leitura pública, escrita para autenticados
CREATE POLICY "Settings are viewable by everyone" ON settings
  FOR SELECT USING (true);

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

CREATE POLICY "Users are insertable by authenticated users" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users are updatable by authenticated users" ON users
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Inserir dados iniciais
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
```

### 7. Configurar Administradores

Para tornar um usuário administrador, você pode:

**Opção 1: Via SQL**
```sql
UPDATE users 
SET is_admin = true 
WHERE discord_id = 'SEU_DISCORD_ID_AQUI';
```

**Opção 2: Via Variável de Ambiente**
Adicione os IDs dos Discord no arquivo `.env`:
```env
VITE_ADMIN_IDS=123456789,987654321
```

### 8. Testar a Conexão

1. Reinicie o servidor de desenvolvimento: `npm start`
2. Tente fazer login com Discord
3. Verifique se os dados estão sendo salvos no Supabase

## 🔒 Segurança

- **Row Level Security (RLS)**: As tabelas estão protegidas com RLS
- **Políticas**: Configure as políticas conforme suas necessidades de segurança
- **Anon Key**: A chave anon é segura para uso no frontend, mas não exponha a service_role key

## 📝 Notas

- O Supabase gerencia automaticamente a autenticação OAuth com Discord
- Os dados são armazenados em PostgreSQL
- Você pode visualizar os dados no dashboard do Supabase em **Table Editor**
- Para produção, configure as URLs de redirecionamento corretamente

## 🐛 Troubleshooting

**Erro: "Invalid API key"**
- Verifique se as variáveis de ambiente estão corretas
- Reinicie o servidor após alterar o `.env`

**Erro: "relation does not exist"**
- Execute o SQL de criação de tabelas no SQL Editor

**Erro ao fazer login com Discord**
- Verifique se o Discord provider está ativado no Supabase
- Verifique se as URLs de redirecionamento estão configuradas corretamente

