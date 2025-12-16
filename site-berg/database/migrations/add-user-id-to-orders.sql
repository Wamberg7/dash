-- Adicionar campo user_id à tabela orders para associar pedidos ao usuário
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Criar índice para melhorar consultas por usuário
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Atualizar pedidos existentes para associar ao usuário pelo email (se possível)
-- Isso é opcional e pode ser executado separadamente se necessário
-- UPDATE orders o
-- SET user_id = u.id
-- FROM users u
-- WHERE o.customer_email = u.email AND o.user_id IS NULL;

