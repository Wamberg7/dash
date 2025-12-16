# Configuração do Discord OAuth na Vercel

Este guia explica como configurar o login com Discord quando o projeto está hospedado na Vercel.

## 🔧 Configuração no Supabase

### 1. Adicionar URL de Callback no Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Authentication** > **URL Configuration**
4. Na seção **Redirect URLs**, adicione:
   ```
   https://bergsite.vercel.app/auth/callback
   ```
5. Clique em **Save**

### 2. Configurar Provider Discord no Supabase

1. No dashboard do Supabase, vá em **Authentication** > **Providers**
2. Encontre **Discord** na lista
3. Certifique-se de que está **ativado**
4. Configure:
   - **Client ID**: Seu Client ID do Discord
   - **Client Secret**: Seu Client Secret do Discord
5. Salve as alterações

## 🔧 Configuração no Discord Developer Portal

### 1. Adicionar URL de Callback no Discord

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications)
2. Selecione sua aplicação
3. Vá em **OAuth2** > **General**
4. Na seção **Redirects**, adicione:
   ```
   https://bergsite.vercel.app/auth/callback
   ```
5. **Importante**: Se você já tinha `http://localhost:8080/auth/callback`, mantenha ela também para desenvolvimento local
6. Clique em **Save Changes**

### 2. Verificar Scopes

Certifique-se de que os seguintes scopes estão habilitados:
- `identify`
- `email`

## ✅ Verificação

Após configurar:

1. A URL de callback será construída dinamicamente pelo código: `${window.location.origin}/auth/callback`
2. Em produção (Vercel): `https://bergsite.vercel.app/auth/callback`
3. Em desenvolvimento local: `http://localhost:8080/auth/callback` (ou a porta que você usar)

## 🚨 Problemas Comuns

### Erro: "redirect_uri_mismatch"

**Causa**: A URL de callback não está configurada corretamente no Discord ou Supabase.

**Solução**:
1. Verifique se adicionou exatamente `https://bergsite.vercel.app/auth/callback` (sem barra no final)
2. Certifique-se de que salvou as alterações no Discord Developer Portal
3. Aguarde alguns minutos para as alterações propagarem

### Erro: "Invalid redirect URI"

**Causa**: O Supabase não reconhece a URL de callback.

**Solução**:
1. Vá em **Authentication** > **URL Configuration** no Supabase
2. Adicione `https://bergsite.vercel.app/auth/callback` na lista de Redirect URLs
3. Salve as alterações

## 📝 Notas Importantes

- O código já está configurado para usar `window.location.origin` dinamicamente
- Não é necessário alterar o código - apenas configurar as URLs no Supabase e Discord
- Mantenha as URLs de desenvolvimento (`localhost`) para poder testar localmente
- URLs de produção devem usar `https://` (não `http://`)

