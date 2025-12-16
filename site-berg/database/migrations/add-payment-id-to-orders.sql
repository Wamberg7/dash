-- Adicionar colunas à tabela orders para rastrear pagamentos e configuração do bot
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS bot_token TEXT,
ADD COLUMN IF NOT EXISTS server_id TEXT,
ADD COLUMN IF NOT EXISTS owner_id TEXT,
ADD COLUMN IF NOT EXISTS bot_status TEXT CHECK (bot_status IN ('waiting', 'hosted', 'active', 'inactive')) DEFAULT 'waiting';

-- Criar índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_bot_status ON orders(bot_status);

-- Comentários explicativos
COMMENT ON COLUMN orders.payment_id IS 'ID do pagamento no Mercado Pago para rastreamento e atualização de status';
COMMENT ON COLUMN orders.bot_token IS 'Token do bot Discord para integração';
COMMENT ON COLUMN orders.server_id IS 'ID do servidor Discord onde o bot será instalado';
COMMENT ON COLUMN orders.owner_id IS 'ID do dono do servidor Discord';
COMMENT ON COLUMN orders.bot_status IS 'Status do bot: waiting (aguardando), hosted (hospedado), active (ativo), inactive (inativo)';

