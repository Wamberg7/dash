-- Migration: Adicionar novos status de bot (online, offline, invalid_data)
-- Data: 2025-12-07

-- Remover constraint antiga
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_bot_status_check;

-- Adicionar nova constraint com os novos status
ALTER TABLE orders 
ADD CONSTRAINT orders_bot_status_check 
CHECK (bot_status IN ('waiting', 'hosted', 'active', 'inactive', 'online', 'offline', 'invalid_data'));

