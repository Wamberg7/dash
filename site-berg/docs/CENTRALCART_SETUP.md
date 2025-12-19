# Configuração do CentralCart

Este guia explica como configurar o CentralCart como gateway de pagamento no projeto.

## 📋 Pré-requisitos

1. Conta no [CentralCart](https://www.centralcart.com.br)
2. Webstore criada na CentralCart
3. Produtos cadastrados na CentralCart

## 🔧 Passo a Passo

### 1. Criar Conta e Webstore na CentralCart

1. Acesse https://www.centralcart.com.br
2. Faça login ou crie uma conta
3. Crie uma nova webstore ou use uma existente
4. Anote o **Webstore ID** da sua webstore

### 2. Obter API Key

1. Acesse o painel da CentralCart
2. Vá em **Configurações** > **API**
3. Gere ou copie sua **API Key**
4. Guarde esta chave em local seguro

### 3. Criar Produtos na CentralCart

1. Acesse sua webstore na CentralCart
2. Vá em **Produtos** > **Adicionar Produto**
3. Preencha os dados do produto:
   - Nome
   - Descrição
   - Preço
   - Tipo de produto (digital, físico, etc.)
4. Anote o **Package ID** do produto criado (este será usado para vincular)

### 4. Configurar no Dashboard

1. Acesse o dashboard administrativo do projeto
2. Vá em **Configurações**
3. Selecione **CentralCart** como Gateway de Pagamento
4. Preencha os campos:
   - **API Key**: Sua API Key da CentralCart
   - **Webstore ID**: ID da sua webstore na CentralCart
5. Clique em **Salvar**

### 5. Vincular Produtos

Para que os pagamentos funcionem corretamente, você precisa vincular cada produto do sistema ao produto correspondente na CentralCart:

1. Acesse **Produtos** no dashboard
2. Clique em **Editar** no produto desejado
3. No campo **CentralCart Package ID**, insira o **Package ID** do produto correspondente na CentralCart
4. Clique em **Salvar**

**Importante**: Sem o Package ID vinculado, o checkout não funcionará para aquele produto.

### 6. Executar Migration do Banco de Dados

Execute o script de migração para adicionar os campos do CentralCart:

1. Abra o arquivo `database/migrations/add-centralcart-fields.sql`
2. Copie o conteúdo
3. Execute no SQL Editor do Supabase

Ou execute diretamente:

```sql
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS central_cart_api_key TEXT,
ADD COLUMN IF NOT EXISTS central_cart_webstore_id TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS central_cart_package_id INTEGER;
```

## 🚀 Como Funciona

### Fluxo de Pagamento

1. Cliente seleciona um produto e preenche os dados no checkout
2. Sistema verifica se o produto tem `centralCartPackageId` vinculado
3. Sistema cria um checkout na CentralCart usando a API
4. Cliente é redirecionado para a página de pagamento da CentralCart
5. Após o pagamento, a CentralCart processa e entrega o produto automaticamente

### Métodos de Pagamento Suportados

A CentralCart suporta múltiplos gateways:
- **PIX** (recomendado)
- **Mercado Pago**
- **Stripe**
- **PayPal**
- **PicPay**

O método de pagamento é determinado automaticamente baseado na seleção do cliente no checkout.

## 🔐 Segurança

- **Nunca** compartilhe suas credenciais
- **Nunca** commite credenciais no código
- Use variáveis de ambiente em produção
- As credenciais são armazenadas de forma segura no Supabase

## 📚 Documentação da API

Para mais informações sobre a API da CentralCart, consulte:
- [Documentação Oficial](https://docs.centralcart.com.br)
- [API Reference](https://docs.centralcart.com.br/api-reference)
- [Endpoint de Checkout](https://docs.centralcart.com.br/api-reference/endpoint/webstore/checkout)

## ⚠️ Troubleshooting

### Erro: "Produto não vinculado"
- **Causa**: O produto não tem `centralCartPackageId` configurado
- **Solução**: Edite o produto e adicione o Package ID da CentralCart

### Erro: "API Key e Webstore ID não configurados"
- **Causa**: Credenciais não foram configuradas nas Configurações
- **Solução**: Configure a API Key e Webstore ID em **Configurações** > **Gateway de Pagamento**

### Erro: "Erro ao criar checkout na CentralCart"
- **Causa**: Credenciais inválidas ou produto não existe na CentralCart
- **Solução**: Verifique se a API Key e Webstore ID estão corretos, e se o Package ID existe na CentralCart

## 💡 Dicas

1. **Teste primeiro**: Use produtos de teste antes de colocar em produção
2. **Mantenha sincronizado**: Quando criar um produto no sistema, crie também na CentralCart e vincule
3. **Monitore os pagamentos**: Acompanhe os pagamentos no painel da CentralCart
4. **Webhooks**: Configure webhooks na CentralCart para receber notificações de pagamento (opcional)

