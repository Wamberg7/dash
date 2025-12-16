# Configuração de Autenticação com Discord

Este guia explica como configurar o login com Discord no projeto.

## 📋 Pré-requisitos

1. Uma conta Discord
2. Acesso ao [Discord Developer Portal](https://discord.com/developers/applications)

## 🔧 Passo a Passo

### 1. Criar uma Aplicação no Discord

1. Acesse https://discord.com/developers/applications
2. Clique em **"New Application"**
3. Dê um nome para sua aplicação (ex: "Berg App")
4. Clique em **"Create"**

### 2. Configurar OAuth2

1. No menu lateral, vá em **"OAuth2"**
2. Em **"Redirects"**, adicione a URL de redirecionamento:
   - Para desenvolvimento: `http://localhost:8080/auth/callback`
   - Para produção: `https://seudominio.com/auth/callback`
3. Copie o **Client ID** (você precisará dele)

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Discord OAuth2 Configuration
VITE_DISCORD_CLIENT_ID=seu_client_id_aqui

# URL de redirecionamento (opcional, padrão: http://localhost:8080/auth/callback)
VITE_DISCORD_REDIRECT_URI=http://localhost:8080/auth/callback

# IDs dos administradores (separados por vírgula)
# Obtenha o ID do Discord: https://discord.com/developers/applications -> OAuth2 -> User ID
VITE_ADMIN_IDS=123456789,987654321

# URL da API backend (opcional, para produção)
# VITE_API_URL=http://localhost:3000
```

### 4. Instalar e Executar

```bash
npm install
npm start
```

## 🚀 Como Funciona

1. Usuário clica em **"Entrar"** no header
2. É redirecionado para a página de login
3. Clica em **"Entrar com Discord"**
4. É redirecionado para o Discord para autorizar
5. Discord redireciona de volta com um código
6. O código é processado e o usuário é autenticado

## 🔒 Segurança

**Importante**: Em produção, você DEVE ter um backend para trocar o código do Discord por um token de acesso. O código atual usa dados mock quando não há backend disponível, o que é apenas para desenvolvimento.

Para produção, crie um endpoint no seu backend:

```
POST /api/auth/discord/callback
Body: { code: string }
Response: { user: User, token: string }
```

O backend deve:
1. Receber o código
2. Trocar o código por um token usando o Client Secret
3. Buscar informações do usuário na API do Discord
4. Retornar os dados do usuário e um token JWT (ou similar)

## 👑 Configuração de Administradores

Para permitir que apenas administradores acessem o dashboard:

1. Obtenha o ID do Discord do usuário que será administrador
   - Você pode obter o ID através do Discord Developer Portal
   - Ou use um bot do Discord que mostre IDs de usuários
   - Ou ative o "Modo Desenvolvedor" no Discord e clique com botão direito no usuário

2. Adicione os IDs no arquivo `.env`:
   ```env
   VITE_ADMIN_IDS=123456789,987654321,456789123
   ```
   - Separe múltiplos IDs por vírgula
   - Sem espaços entre os IDs

3. Reinicie o servidor de desenvolvimento após alterar o `.env`

**Nota**: Apenas usuários com IDs na lista `VITE_ADMIN_IDS` terão acesso ao dashboard administrativo. Usuários não-administradores serão redirecionados para uma página de "Acesso Negado".

## 📝 Notas

- O Client Secret do Discord NUNCA deve ser exposto no frontend
- Use HTTPS em produção
- Configure as URLs de redirecionamento corretamente no Discord Developer Portal
- O escopo atual é `identify email` - você pode adicionar mais escopos se necessário
- A verificação de administrador é feita pelo ID do Discord, que é único e não pode ser alterado

