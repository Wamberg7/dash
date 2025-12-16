# Sistema de Renovação de Assinaturas

## 📋 Funcionalidades Implementadas

### 1. ✅ Tempo Padrão de 1 Mês
- Cada bot recebe automaticamente **1 mês (30 dias)** de assinatura ao ser configurado
- Configurado em `BotSetup.tsx` - usa `setMonth()` para garantir 1 mês exato

### 2. ✅ Renovação Inteligente
- **Renovação adiciona 1 mês ao tempo restante** (não substitui)
- Se renovar faltando muitos dias, apenas adiciona mais 1 mês
- Se renovar faltando poucos dias, adiciona 1 mês ao tempo restante
- Implementado em `api/routes/orders.routes.js` - endpoint `/api/orders/renew-subscription`

### 3. ✅ Notificação aos 7 Dias
- Sistema detecta quando faltam **7 dias ou menos** para expirar
- Mostra mensagem de aviso visual na página "Meus Bots"
- Mensagens personalizadas:
  - "Sua assinatura expira em X dias. Renove agora!"
  - "Sua assinatura expira hoje! Renove agora para continuar usando."
  - "Sua assinatura expirou há X dias. Renove agora!"
- Implementado em `src/utils/subscription-notifications.ts`

### 4. ✅ Edição de Tempo (Admin)
- Administradores podem editar a data de expiração de qualquer bot
- Interface disponível em `OrderDetail.tsx`
- Botão "Editar" ao lado da data de expiração
- Endpoint: `PATCH /api/orders/update-expiry`

### 5. ✅ Fluxo de Renovação Completo
- Usuário clica em "Renovar Assinatura" em "Meus Bots"
- Redireciona para checkout com parâmetro `renew`
- Checkout mostra informações de renovação
- Após pagamento aprovado, renova automaticamente adicionando 1 mês
- Redireciona para "Meus Bots" com mensagem de sucesso

## 🔌 Endpoints da API

### Renovar Assinatura
```
POST /api/orders/renew-subscription
Body: { orderId: string }
Response: { success: boolean, newExpiryDate: string }
```

### Atualizar Data de Expiração (Admin)
```
PATCH /api/orders/update-expiry
Body: { orderId: string, expiryDate: string }
Response: { success: boolean, newExpiryDate: string }
```

## 📁 Arquivos Modificados/Criados

### Backend (API)
- `api/routes/orders.routes.js` - Adicionadas rotas de renovação e atualização

### Frontend
- `src/lib/api.ts` - Adicionadas funções `renewSubscription()` e `updateExpiryDate()`
- `src/pages/Checkout.tsx` - Detecção de renovação e exibição de informações
- `src/pages/PaymentPix.tsx` - Processamento de renovação após pagamento aprovado
- `src/pages/MyBots.tsx` - Notificações visuais e botão de renovação
- `src/pages/BotSetup.tsx` - Configuração inicial de 1 mês
- `src/components/admin/OrderDetail.tsx` - Interface de edição de data (admin)
- `src/utils/subscription-notifications.ts` - Utilitários de notificação

## 🎯 Como Funciona

### Renovação Normal
1. Usuário vê bot com 7 dias ou menos restantes
2. Clica em "Renovar Assinatura"
3. Vai para checkout (mostra que é renovação)
4. Faz pagamento
5. Após aprovação, sistema adiciona 1 mês ao tempo restante
6. Usuário recebe confirmação

### Renovação Antecipada
1. Usuário pode renovar mesmo faltando muitos dias
2. Sistema adiciona 1 mês ao tempo restante atual
3. Exemplo: Se faltam 20 dias, após renovar terá 50 dias (20 + 30)

### Edição Admin
1. Admin acessa detalhes do pedido
2. Clica em "Editar" ao lado da data de expiração
3. Seleciona nova data
4. Salva - data é atualizada imediatamente

## 🔔 Notificações

As notificações aparecem automaticamente quando:
- Faltam 7 dias ou menos para expirar
- A assinatura já expirou (até 7 dias após expiração)

Mensagens são exibidas em:
- Cards de bots na página "Meus Bots"
- Aba "Renovar" com destaque visual
- Badges coloridos (amarelo para próximo de expirar, vermelho para expirado)

