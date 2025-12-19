-- Adiciona campos da CentralCart na tabela settings
-- Execute este SQL no SQL Editor do Supabase

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS central_cart_api_token TEXT;

-- Adiciona campo central_cart_package_id na tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS central_cart_package_id INTEGER;

-- Comentários para documentação
COMMENT ON COLUMN settings.central_cart_api_token IS 'Token da API da CentralCart para autenticação (contém todas as informações necessárias)';
COMMENT ON COLUMN products.central_cart_package_id IS 'ID do produto (package_id) na CentralCart para vincular produtos';

