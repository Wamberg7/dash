# Como Desabilitar Confirmação de Email no Supabase

Este guia explica como desabilitar a confirmação de email para que usuários possam fazer login imediatamente após o cadastro.

## 🔧 Passo a Passo

### 1. Acessar Configurações de Autenticação

1. Acesse o dashboard do seu projeto no Supabase
2. No menu lateral, vá em **Authentication**
3. Clique em **Settings** (ou **Configurações**)

### 2. Desabilitar Confirmação de Email

1. Na seção **Email Auth**, encontre a opção:
   - **"Enable email confirmations"** (ou "Confirm email")
   - **"Require email confirmation"**
   - Ou similar

2. **Desative** essa opção (desmarque o checkbox ou desligue o toggle)

3. **Salve** as alterações

### 3. Verificar

Após desabilitar:
- Usuários podem fazer login imediatamente após o cadastro
- Não será enviado email de confirmação
- O campo `email_confirmed_at` será preenchido automaticamente

## ⚠️ Importante

- **Desenvolvimento**: Normal desabilitar para facilitar testes
- **Produção**: Considere manter habilitado para segurança
- **Segurança**: Sem confirmação, qualquer pessoa com um email pode criar contas

## 📝 Nota

O código do projeto já está configurado para funcionar com ou sem confirmação de email. Apenas desabilite no dashboard do Supabase conforme descrito acima.

