# Configurar Bot via Dashboard - Guia Completo

## ✅ O que foi implementado

### 1. Banco de Dados
- ✅ Tabela `bot_settings` criada no Supabase
- ✅ Migration disponível em `database/migrations/add-bot-settings.sql`
- ✅ Políticas RLS configuradas (apenas admins podem editar)

### 2. Dashboard
- ✅ Componente `BotSettingsForm` criado
- ✅ Aba "Bot Manager" adicionada no sidebar
- ✅ Interface completa para configurar todas as opções do bot
- ✅ Campos com máscara para tokens sensíveis

### 3. Backend
- ✅ Endpoint `GET /api/bot-settings` criado
- ✅ Retorna configurações no formato esperado pelo bot
- ✅ Integração com Supabase

### 4. Bot
- ✅ Carregamento automático do backend
- ✅ Fallback para arquivo `config.json` se backend falhar
- ✅ Suporte a variáveis de ambiente

## 🚀 Como usar

### Passo 1: Executar Migration

```sql
-- Execute no SQL Editor do Supabase
-- Arquivo: database/migrations/add-bot-settings.sql
```

### Passo 2: Configurar no Dashboard

1. Inicie o servidor:
```bash
cd site-berg-08670
npm run dev:full
```

2. Acesse: `http://localhost:5173`
3. Faça login como admin
4. Vá em **Bot Manager**
5. Preencha todas as configurações
6. Clique em **Salvar Configurações**

### Passo 3: Configurar o Bot

No arquivo `botmanger/configs/config.json`:

```json
{
    "backendURL": "http://localhost:3001",
    "useBackend": true
}
```

Ou use variáveis de ambiente:

```bash
BACKEND_URL=http://localhost:3001
USE_BACKEND=true
```

### Passo 4: Iniciar o Bot

```bash
cd botmanger
node index.js
```

O bot irá:
1. Tentar carregar do backend
2. Se falhar, usar `config.json`

## 📋 Campos Configuráveis

### Tokens e Credenciais
- Token do Discord
- SquareCloud Access Token
- Mercado Pago Access Token

### IDs do Discord
- Bot ID
- Server ID
- Owner ID

### Configurações do Backend
- URL do Backend
- Usar Backend (toggle)
- Webhook URL

### Canais do Discord
- Canal de Carrinhos
- Logs de Compras
- Logs de Bots Enviados
- Logs de Bots Expirados
- Logs de Renovação
- Logs de Start

### Valores dos Produtos
- Bot Gen
- Bot Ticket
- Bot Auth
- Stock Ex
- Stock Auto
- Stock Man
- Bio Perso

## 🔒 Segurança

- Tokens são armazenados no banco de dados
- RLS (Row Level Security) ativado
- Apenas administradores podem editar
- Campos sensíveis com máscara no dashboard

## 🐛 Troubleshooting

### Bot não carrega do backend

1. Verifique se o backend está rodando
2. Verifique `useBackend: true` no config.json
3. Verifique a URL do backend
4. Veja os logs do bot

### Erro 404 no endpoint

1. Verifique se a migration foi executada
2. Verifique se há um registro na tabela `bot_settings`
3. Verifique as variáveis de ambiente do backend

### Configurações não aparecem

1. Recarregue a página do dashboard
2. Verifique se você está logado como admin
3. Verifique o console do navegador para erros

## 📝 Notas Importantes

- Sempre mantenha o `config.json` como backup
- O bot faz fallback automático se o backend falhar
- As configurações são salvas em tempo real no Supabase
- Você pode alternar entre backend e arquivo local facilmente

