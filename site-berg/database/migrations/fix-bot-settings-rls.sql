-- Script para corrigir as políticas RLS da tabela bot_settings
-- Permite que a API (usando chave anônima) possa ler e escrever
-- Execute este SQL no SQL Editor do Supabase

-- Remover TODAS as políticas antigas (incluindo as novas que podem já existir)
DROP POLICY IF EXISTS "Permitir leitura de bot_settings para usuários autenticados" ON bot_settings;
DROP POLICY IF EXISTS "Permitir atualização de bot_settings para admins" ON bot_settings;
DROP POLICY IF EXISTS "Permitir inserção de bot_settings para admins" ON bot_settings;
DROP POLICY IF EXISTS "Bot settings are viewable by everyone" ON bot_settings;
DROP POLICY IF EXISTS "Bot settings are insertable by everyone" ON bot_settings;
DROP POLICY IF EXISTS "Bot settings are updatable by everyone" ON bot_settings;

-- Criar políticas mais permissivas (similar à tabela settings)
-- SELECT: leitura pública (permite que a API leia usando chave anônima)
CREATE POLICY "Bot settings are viewable by everyone" ON bot_settings
  FOR SELECT USING (true);

-- INSERT: permite inserção para todos (API precisa poder inserir)
CREATE POLICY "Bot settings are insertable by everyone" ON bot_settings
  FOR INSERT 
  WITH CHECK (true);

-- UPDATE: permite atualização para todos (API precisa poder atualizar)
CREATE POLICY "Bot settings are updatable by everyone" ON bot_settings
  FOR UPDATE 
  USING (true);

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
AND tablename = 'bot_settings'
ORDER BY cmd, policyname;

