# Configuração do LivePix

Este guia explica como configurar o LivePix como gateway de pagamento no projeto.

## 📋 Pré-requisitos

1. Conta no [LivePix](https://livepix.gg)
2. Aplicação criada no painel do LivePix

## 🔧 Passo a Passo

### 1. Criar Aplicação no LivePix

1. Acesse https://livepix.gg
2. Faça login na sua conta
3. Vá em **Configurações** > **Aplicações**
4. Clique em **Criar Nova Aplicação**
5. Preencha os dados:
   - Nome da aplicação
   - Descrição
   - URL de callback (opcional)
6. Clique em **Criar**

### 2. Obter Credenciais

Após criar a aplicação, você terá acesso a:

1. **Client ID** - ID da aplicação
2. **Client Secret** - Chave secreta da aplicação

**Importante**: 
- O LivePix usa autenticação OAuth2
- O token de acesso é obtido automaticamente pelo backend
- Não é necessário configurar Access Token manualmente

### 3. Configurar no Dashboard

1. Acesse o dashboard administrativo do projeto
2. Vá em **Configurações**
3. Selecione **LivePix** como Gateway de Pagamento
4. Preencha os campos:
   - **Client ID**: Seu Client ID do LivePix
   - **Client Secret**: Seu Client Secret (será ocultada)
5. Configure a **Taxa adicional** se desejar repassar taxas para o cliente
6. Clique em **Salvar**

### 4. Executar Migration do Banco de Dados

Execute o script de migração para adicionar os campos do LivePix:

1. Abra o arquivo `database/migrations/add-livepix-fields.sql`
2. Copie o conteúdo
3. Execute no SQL Editor do Supabase

Ou execute diretamente:

```sql
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS livepix_client_id TEXT,
ADD COLUMN IF NOT EXISTS livepix_client_secret TEXT;
```

## 🔐 Segurança

- **Nunca** compartilhe suas credenciais
- **Nunca** commite credenciais no código
- Use variáveis de ambiente em produção
- As credenciais são armazenadas de forma segura no Supabase

## 📚 Documentação da API

Para mais informações sobre a API do LivePix, consulte:
- [Documentação Oficial](https://docs.livepix.gg)
- [Guia de Integração](https://docs.livepix.gg/integration)

## ✅ Testando

1. Certifique-se de que o backend está rodando
2. Configure as credenciais do LivePix nas Configurações
3. Tente fazer uma compra
4. Verifique se o pagamento é processado corretamente

## 🔄 Diferenças entre Mercado Pago e LivePix

| Recurso | Mercado Pago | LivePix |
|---------|--------------|---------|
| Autenticação | Access Token direto | OAuth2 (Client Credentials) |
| Token | Manual | Automático (cache de 1 hora) |
| Pagamentos PIX | ✅ | ✅ |
| Cartão de Crédito | ✅ | ❌ (apenas PIX) |

## 🐛 Solução de Problemas

### Erro: "Client ID e Client Secret são obrigatórios"
- Verifique se preencheu ambos os campos nas Configurações
- Certifique-se de que salvou as configurações

### Erro: "Credenciais inválidas"
- Verifique se o Client ID e Client Secret estão corretos
- Certifique-se de que copiou as credenciais completas
- Gere novas credenciais se necessário

### Erro: "Erro ao obter token OAuth2"
- Verifique sua conexão com a internet
- Certifique-se de que o backend está rodando
- Verifique os logs do backend para mais detalhes

### Pagamento não é processado
- Verifique se o gateway está configurado como "LivePix"
- Certifique-se de que as credenciais estão corretas
- Verifique os logs do backend para erros

