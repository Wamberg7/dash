-- Adicionar coluna display_order à tabela products
-- Esta coluna será usada para ordenar os produtos na exibição

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Criar índice para melhorar performance nas consultas ordenadas
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);

-- Atualizar produtos existentes para terem display_order baseado na ordem atual
-- (opcional: pode ser removido se não quiser definir ordem inicial)
UPDATE products 
SET display_order = subquery.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
  FROM products
) AS subquery
WHERE products.id = subquery.id;

