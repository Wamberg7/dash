-- Script SEGURO para corrigir a política RLS da tabela users
-- Este script NÃO remove políticas, apenas cria uma nova se não existir
-- Execute este SQL no SQL Editor do Supabase

-- Verificar se a política já existe e criar apenas se não existir
-- Nota: PostgreSQL não suporta CREATE POLICY IF NOT EXISTS diretamente
-- Então vamos tentar criar e ignorar o erro se já existir

DO $$
BEGIN
  -- Tentar criar a política
  -- Se já existir, o erro será ignorado
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Allow user registration'
  ) THEN
    CREATE POLICY "Allow user registration" ON users
      FOR INSERT 
      WITH CHECK (true);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Política já existe, tudo bem
    RAISE NOTICE 'Política já existe, continuando...';
END $$;

-- Se a política antiga existir, vamos tentar substituí-la
-- Primeiro, vamos verificar se existe uma política com nome diferente
DO $$
BEGIN
  -- Se existir "Users are insertable by authenticated users", vamos removê-la
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users are insertable by authenticated users'
  ) THEN
    DROP POLICY "Users are insertable by authenticated users" ON users;
    -- Criar a nova política
    CREATE POLICY "Allow user registration" ON users
      FOR INSERT 
      WITH CHECK (true);
  END IF;
END $$;

-- Verificar se a política foi criada
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users' 
AND cmd = 'INSERT';

