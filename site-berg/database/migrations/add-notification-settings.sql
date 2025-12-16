-- Adicionar campos de notificações à tabela settings
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS discord_sales_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discord_sales_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discord_stock_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discord_affiliate_withdrawal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS app_sales_notification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_store_expiration BOOLEAN DEFAULT false;

-- Atualizar registro existente se houver
UPDATE settings 
SET 
  discord_sales_public = false,
  discord_sales_admin = false,
  discord_stock_out = false,
  discord_affiliate_withdrawal = false,
  app_sales_notification = false,
  email_store_expiration = false
WHERE id = 'main' AND discord_sales_public IS NULL;

