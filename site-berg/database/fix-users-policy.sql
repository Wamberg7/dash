-- Script para corrigir a política RLS da tabela users
-- Permite que usuários se registrem na tabela users durante o cadastro
-- Execute este SQL no SQL Editor do Supabase

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users are insertable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users are insertable during registration" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;

-- Criar nova política que permite inserção durante registro
-- Esta política permite inserção se:
-- 1. O discord_id corresponde ao ID do usuário autenticado (auth.uid())
-- 2. OU permite inserção para todos (durante registro inicial, antes da confirmação de email)
CREATE POLICY "Users are insertable during registration" ON users
  FOR INSERT 
  WITH CHECK (true);

-- Manter as outras políticas
-- SELECT: apenas usuários autenticados podem ver
-- UPDATE: apenas usuários autenticados podem atualizar seus próprios registros

