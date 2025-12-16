-- Script para corrigir a política RLS da tabela settings
-- Permite que usuários autenticados possam inserir e atualizar configurações
-- Execute este SQL no SQL Editor do Supabase

-- Remover políticas antigas
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
DROP POLICY IF EXISTS "Settings are updatable by authenticated users" ON settings;
DROP POLICY IF EXISTS "Settings are insertable by authenticated users" ON settings;

-- Criar políticas para settings
-- SELECT: leitura públicaar
CREATE POLICY "Settings are viewable by everyone" ON settings
  FOR SELECT USING (true);

-- INSERT: permite inserção para usuários autenticados
CREATE POLICY "Settings are insertable by authenticated users" ON settings
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: permite atualização para usuários autenticados
CREATE POLICY "Settings are updatable by authenticated users" ON settings
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Verificar se as políticas foram criadas
SELECT 
  policyname as "Nome da Política",
  cmd as "Comando",
  CASE 
    WHEN with_check = 'true' THEN 'Permite'
    WHEN with_check IS NULL THEN 'Sem restrição'
    ELSE with_check::text
  END as "Permissão"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'settings'
ORDER BY cmd, policyname;

