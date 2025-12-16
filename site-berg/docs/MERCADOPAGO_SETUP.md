# Configuração do Mercado Pago

Este guia explica como configurar o Mercado Pago como gateway de pagamento no projeto.

## 📋 Pré-requisitos

1. Conta no [Mercado Pago](https://www.mercadopago.com.br)
2. Aplicação criada no Mercado Pago Developers

## 🔧 Passo a Passo

### 1. Criar Aplicação no Mercado Pago

1. Acesse https://www.mercadopago.com.br/developers
2. Faça login na sua conta
3. Vá em **Suas integrações** > **Criar aplicação**
4. Preencha os dados:
   - Nome da aplicação
   - Descrição
   - Site (URL do seu site)
5. Clique em **Criar**

### 2. Obter Credenciais

Após criar a aplicação, você terá acesso a:

1. **Client ID** - ID da aplicação
2. **Client Secret** - Chave secreta da aplicação
3. **Public Key** - Chave pública (para frontend)
4. **Access Token** - Token de acesso (para backend)

**Importante**: 
- Use credenciais de **Teste** para desenvolvimento
- Use credenciais de **Produção** apenas em produção

### 3. Configurar no Dashboard

1. Acesse o dashboard administrativo do projeto
2. Vá em **Configurações**
3. Selecione **Mercado Pago** como Gateway de Pagamento
4. Preencha os campos:
   - **Client ID**: Seu Client ID do Mercado Pago
   - **Client Secret**: Sua Client Secret (será ocultada)
   - **Public Key**: Sua Public Key (opcional, para checkout transparente)
   - **Access Token**: Seu Access Token (obrigatório)
5. Configure a **Taxa adicional** se desejar repassar taxas para o cliente
6. Clique em **Salvar**

### 4. Executar Migration do Banco de Dados

Execute o script de migração para adicionar os campos do Mercado Pago:

1. Abra o arquivo `database/migrations/add-mercadopago-fields.sql`
2. Copie o conteúdo
3. Execute no SQL Editor do Supabase

Ou execute diretamente:

```sql
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS mercado_pago_client_id TEXT,
ADD COLUMN IF NOT EXISTS mercado_pago_client_secret TEXT,
ADD COLUMN IF NOT EXISTS mercado_pago_public_key TEXT,
ADD COLUMN IF NOT EXISTS mercado_pago_access_token TEXT,
ADD COLUMN IF NOT EXISTS additional_fee BOOLEAN DEFAULT false;
```

## 🔒 Segurança

- **Nunca** exponha o Access Token no frontend
- Use o Access Token apenas no backend
- Para checkout transparente, use a Public Key no frontend
- Mantenha as credenciais seguras e não as compartilhe

## 💳 Métodos de Pagamento

O Mercado Pago suporta:
- **Pix**: Pagamento instantâneo
- **Cartão de Crédito**: Visa, Mastercard, Elo, etc.
- **Cartão de Débito**: Débito online
- **Boleto**: Pagamento via boleto bancário

## 🧪 Teste

### Cartões de Teste

Use estes cartões para testar:

**Cartão Aprovado:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Validade: `11/25`
- Nome: Qualquer nome
- CPF: `12345678909`

**Cartão Recusado:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Validade: `11/25`

### Pix de Teste

Para testar Pix, use a conta de teste do Mercado Pago.

## 📝 Notas

- O Access Token é obrigatório para processar pagamentos
- A Public Key é opcional e usada apenas para checkout transparente
- O Client ID e Client Secret são usados para autenticação OAuth (opcional)
- A taxa adicional repassa as taxas do gateway para o cliente final

## 🐛 Troubleshooting

**Erro: "Invalid access token"**
- Verifique se o Access Token está correto
- Certifique-se de estar usando o token correto (teste ou produção)

**Erro: "Payment not processed"**
- Verifique se o Access Token tem permissões para criar pagamentos
- Certifique-se de que as credenciais estão corretas

**Pagamento não aparece no dashboard**
- Verifique os webhooks do Mercado Pago
- Confirme que as URLs de retorno estão configuradas corretamente

