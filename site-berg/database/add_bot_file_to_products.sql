-- Adicionar campos para arquivo ZIP do bot na tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS bot_file_path TEXT,
ADD COLUMN IF NOT EXISTS bot_file_name TEXT;

-- Comentário explicativo
COMMENT ON COLUMN products.bot_file_path IS 'Caminho completo do arquivo ZIP do bot vinculado ao produto';
COMMENT ON COLUMN products.bot_file_name IS 'Nome do arquivo ZIP do bot vinculado ao produto';

