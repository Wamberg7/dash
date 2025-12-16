# Guia: Como Obter o Access Token do Mercado Pago

Se você está recebendo erro de "Access Token inválido", siga este guia para obter o token correto.

## 🔍 Verificar o Token Atual

1. Acesse o dashboard administrativo
2. Vá em **Configurações**
3. Verifique o **Access Token** configurado
4. O token deve começar com `APP_USR-` ou `TEST-` (para testes)

## 📋 Como Obter o Access Token Correto

### Opção 1: Via Dashboard do Mercado Pago (Recomendado)

1. Acesse https://www.mercadopago.com.br/developers
2. Faça login na sua conta
3. Vá em **Suas integrações**
4. Selecione sua aplicação
5. Na seção **Credenciais de produção** ou **Credenciais de teste**:
   - Copie o **Access Token** (não confunda com Public Key ou Client Secret)
   - O Access Token é um token longo que começa com `APP_USR-` (produção) ou `TEST-` (teste)

### Opção 2: Via API (Avançado)

Se você tem Client ID e Client Secret, pode obter o Access Token via OAuth:

```bash
curl -X POST \
  https://api.mercadopago.com/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials' \
  -d 'client_id=SEU_CLIENT_ID' \
  -d 'client_secret=SEU_CLIENT_SECRET'
```

## ⚠️ Problemas Comuns

### 1. Token de Teste vs Produção

- **Token de Teste**: Começa com `TEST-` - Use apenas para desenvolvimento
- **Token de Produção**: Começa com `APP_USR-` - Use em produção

### 2. Token Expirado

- Tokens podem expirar
- Gere um novo token no dashboard do Mercado Pago

### 3. Token com Espaços

- Certifique-se de copiar o token completo, sem espaços extras
- O sistema remove espaços automaticamente, mas verifique

### 4. Token Sem Permissões

- O token precisa ter permissões para criar pagamentos
- Verifique as permissões da aplicação no Mercado Pago

## 🔧 Como Configurar

1. Copie o Access Token do Mercado Pago
2. Acesse **Configurações** no dashboard
3. Cole o token no campo **Access Token**
4. Clique em **Salvar**
5. Tente fazer um pagamento novamente

## 🧪 Testar o Token

Para testar se o token está funcionando, você pode:

1. Fazer um pagamento de teste no checkout
2. Verificar o console do navegador (F12) para ver os logs
3. Se aparecer erro 401, o token está inválido
4. Se aparecer erro 400, pode ser problema nos dados do pagamento

## 📝 Notas

- O Access Token é diferente do Client ID e Client Secret
- O Access Token é obrigatório para processar pagamentos
- Mantenha o token seguro e não o compartilhe
- Em produção, use sempre o token de produção

