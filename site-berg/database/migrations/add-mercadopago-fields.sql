-- Migration: Adicionar campos do Mercado Pago na tabela settings
-- Execute este SQL no SQL Editor do Supabase
-- Esta migration adiciona os campos necessários para usar Client ID e Client Secret do Mercado Pago

-- Adicionar colunas para Mercado Pago
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS mercado_pago_client_id TEXT,
ADD COLUMN IF NOT EXISTS mercado_pago_client_secret TEXT,
ADD COLUMN IF NOT EXISTS mercado_pago_public_key TEXT,
ADD COLUMN IF NOT EXISTS mercado_pago_access_token TEXT,
ADD COLUMN IF NOT EXISTS additional_fee BOOLEAN DEFAULT false;

-- Comentário: Client ID e Client Secret são obrigatórios para autenticação OAuth do Mercado Pago
-- Public Key e Access Token são opcionais (usados para checkout transparente)

