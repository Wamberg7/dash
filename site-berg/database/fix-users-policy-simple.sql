-- Script SIMPLES para corrigir a política RLS da tabela users
-- Execute este SQL no SQL Editor do Supabase
-- Este script permite que usuários sejam inseridos durante o registro
--
-- ⚠️ AVISO: Este script contém comandos DROP POLICY
-- O Supabase mostrará um aviso sobre "operação destrutiva"
-- Isso é NORMAL e SEGURO - estamos apenas removendo políticas antigas
-- para criar uma nova que permite registro de usuários
--
-- Clique em "Execute esta consulta" quando o aviso aparecer

-- Remover TODAS as políticas de INSERT antigas
DROP POLICY IF EXISTS "Users are insertable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users are insertable during registration" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Criar política SIMPLES que permite inserção para todos
-- Isso permite que usuários sejam criados durante o registro
CREATE POLICY "Allow user registration" ON users
  FOR INSERT 
  WITH CHECK (true);

-- Verificar se a política foi criada
SELECT 
  policyname as "Nome da Política",
  cmd as "Comando",
  CASE 
    WHEN with_check = 'true' THEN 'Permite inserção'
    ELSE with_check::text
  END as "Permissão"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users' 
AND cmd = 'INSERT';

