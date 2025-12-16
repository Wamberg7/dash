-- Migration: Adicionar campos de recursos do bot (CPU, RAM, Network)
-- Data: 2025-12-07

-- Adicionar colunas de recursos do bot
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS bot_cpu_percent DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bot_ram_mb INTEGER DEFAULT 512,
ADD COLUMN IF NOT EXISTS bot_ram_used_mb DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bot_network_total_down BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bot_network_total_up BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bot_network_current_down BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bot_network_current_up BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bot_service_id TEXT,
ADD COLUMN IF NOT EXISTS bot_cluster TEXT;

-- Comentários explicativos
COMMENT ON COLUMN orders.bot_cpu_percent IS 'Percentual de uso de CPU do bot (0-100)';
COMMENT ON COLUMN orders.bot_ram_mb IS 'Quantidade total de RAM alocada para o bot em MB';
COMMENT ON COLUMN orders.bot_ram_used_mb IS 'Quantidade de RAM utilizada pelo bot em MB';
COMMENT ON COLUMN orders.bot_network_total_down IS 'Total de dados baixados pelo bot em bytes';
COMMENT ON COLUMN orders.bot_network_total_up IS 'Total de dados enviados pelo bot em bytes';
COMMENT ON COLUMN orders.bot_network_current_down IS 'Taxa atual de download em bytes';
COMMENT ON COLUMN orders.bot_network_current_up IS 'Taxa atual de upload em bytes';
COMMENT ON COLUMN orders.bot_service_id IS 'ID do serviço no sistema de hospedagem';
COMMENT ON COLUMN orders.bot_cluster IS 'Cluster onde o bot está hospedado';

