-- Adicionar campos de assinatura na tabela applications
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_expiry_date TIMESTAMPTZ;

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_applications_subscription_expiry_date 
ON applications(subscription_expiry_date);

-- Comentários para documentação
COMMENT ON COLUMN applications.subscription_start_date IS 'Data de início da assinatura do bot';
COMMENT ON COLUMN applications.subscription_expiry_date IS 'Data de expiração da assinatura do bot';

