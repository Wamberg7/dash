-- Migration: Adicionar campos do LivePix na tabela settings
-- Execute este SQL no SQL Editor do Supabase
-- Esta migration adiciona os campos necessários para usar Client ID e Client Secret do LivePix

-- Adicionar colunas para LivePix
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS livepix_client_id TEXT,
ADD COLUMN IF NOT EXISTS livepix_client_secret TEXT;

-- Comentário: Client ID e Client Secret são obrigatórios para autenticação OAuth2 do LivePix
-- O LivePix usa OAuth2 para autenticação, então não precisa de Access Token separado

