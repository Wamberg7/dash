# Scripts do Banco de Dados

Esta pasta contém todos os scripts SQL para configuração do banco de dados Supabase.

## 📁 Estrutura

- **`schema.sql`** - Schema completo do banco de dados (tabelas, índices, RLS, dados iniciais)

## 🚀 Como Usar

### 1. Executar o Schema Completo

1. Acesse o dashboard do Supabase
2. Vá em **SQL Editor** > **New Query**
3. Copie e cole o conteúdo de `schema.sql`
4. Clique em **Run** ou pressione `Ctrl+Enter`

### 2. Verificar as Tabelas

Após executar o script, você pode verificar as tabelas criadas em:
- **Table Editor** no dashboard do Supabase

## 📋 O que o Schema Inclui

### Tabelas

- **products** - Produtos/bots disponíveis para venda
- **orders** - Pedidos realizados pelos clientes
- **settings** - Configurações do sistema (gateway de pagamento, etc)
- **visits** - Contador de visitas do site
- **users** - Usuários autenticados via Discord

### Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Políticas de acesso** configuradas para cada tabela
- **Índices** para otimização de consultas

### Dados Iniciais

- 2 produtos (Bot de Vendas e Bot de Tickets)
- Configurações padrão
- Contador de visitas inicializado

## 🔧 Correções

### Problema: Configurações não estão sendo salvas no banco

Se você receber o erro "new row violates row-level security policy for table 'settings'", execute o script de correção:

**Opção 1: Script de Correção (Recomendado)**
1. Abra o arquivo `database/fix-settings-policy.sql`
2. Copie TODO o conteúdo
3. Execute no SQL Editor do Supabase
4. Verifique se as políticas foram criadas (o script mostra uma query de verificação no final)

**Ou execute diretamente no Supabase SQL Editor:**

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
DROP POLICY IF EXISTS "Settings are updatable by authenticated users" ON settings;
DROP POLICY IF EXISTS "Settings are insertable by authenticated users" ON settings;

-- Criar políticas para settings
CREATE POLICY "Settings are viewable by everyone" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Settings are insertable by authenticated users" ON settings
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Settings are updatable by authenticated users" ON settings
  FOR UPDATE 
  USING (auth.role() = 'authenticated');
```

**Verificar se funcionou:**
```sql
-- Ver todas as políticas da tabela settings
SELECT * FROM pg_policies WHERE tablename = 'settings';
```

### Problema: Usuários não estão sendo salvos no banco

Se os usuários cadastrados não estão sendo salvos na tabela `users`, execute o script de correção:

**Opção 1: Script Simples (Recomendado)**
1. Abra o arquivo `database/fix-users-policy-simple.sql`
2. Copie TODO o conteúdo
3. Execute no SQL Editor do Supabase
4. ⚠️ **Quando aparecer o aviso sobre "operação destrutiva"**, clique em **"Execute esta consulta"**
   - O aviso é normal - estamos apenas removendo políticas antigas para criar novas
   - É seguro executar
5. Verifique se a política foi criada (o script mostra uma query de verificação no final)

**Opção 2: Script Seguro (Sem DROP)**
1. Abra o arquivo `database/fix-users-policy-safe.sql`
2. Copie TODO o conteúdo
3. Execute no SQL Editor do Supabase
4. Este script não mostra aviso, mas pode não funcionar se já existir uma política

**Opção 3: Script Completo**
1. Abra o arquivo `database/fix-users-policy.sql`
2. Copie o conteúdo
3. Execute no SQL Editor do Supabase
4. Confirme quando aparecer o aviso

**Ou execute diretamente no Supabase SQL Editor:**

```sql
-- Remover políticas antigas (pode mostrar aviso - é normal!)
DROP POLICY IF EXISTS "Users are insertable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users are insertable during registration" ON users;

-- Criar política que permite inserção durante registro
CREATE POLICY "Allow user registration" ON users
  FOR INSERT 
  WITH CHECK (true);
```

**⚠️ Sobre o Aviso do Supabase:**
- O Supabase mostra um aviso quando detecta comandos `DROP`
- Isso é **NORMAL** e **SEGURO** neste caso
- Estamos apenas removendo políticas antigas para criar uma nova
- Clique em **"Execute esta consulta"** para continuar

**Verificar se funcionou:**
```sql
-- Ver todas as políticas da tabela users
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## 🔧 Manutenção

### Adicionar um Administrador

```sql
UPDATE users 
SET is_admin = true 
WHERE discord_id = 'SEU_DISCORD_ID_AQUI';
```

### Resetar o Banco de Dados

⚠️ **CUIDADO**: Isso apagará todos os dados!

```sql
-- Remover todas as políticas
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Products are insertable by authenticated users" ON products;
DROP POLICY IF EXISTS "Products are updatable by authenticated users" ON products;
-- ... (repetir para todas as políticas)

-- Remover todas as tabelas
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Depois, execute novamente o schema.sql
```

## 📝 Notas

- Todos os scripts são idempotentes (podem ser executados múltiplas vezes sem erro)
- Use `IF NOT EXISTS` e `ON CONFLICT DO NOTHING` para evitar erros
- As políticas RLS podem ser ajustadas conforme suas necessidades de segurança

