-- Adicionar campos de assinatura à tabela orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_expiry_date TIMESTAMPTZ;

-- Criar índice para melhorar consultas de assinaturas expiradas
CREATE INDEX IF NOT EXISTS idx_orders_subscription_expiry ON orders(subscription_expiry_date);

-- Comentário: subscription_start_date é definido quando o bot é configurado pela primeira vez
-- subscription_expiry_date é calculado como subscription_start_date + 30 dias

