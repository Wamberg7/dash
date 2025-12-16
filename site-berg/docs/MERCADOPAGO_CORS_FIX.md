# Solução para Erro "Failed to fetch" no Mercado Pago

## Problema

O erro "Failed to fetch" geralmente ocorre quando:

1. **CORS (Cross-Origin Resource Sharing)**: A API do Mercado Pago pode bloquear requisições diretas do navegador por segurança
2. **Access Token inválido ou expirado**: O token pode estar incorreto ou ter expirado
3. **Problema de rede**: Conexão com a internet instável

## Soluções

### Solução 1: Verificar Access Token (Recomendado primeiro)

1. Acesse https://www.mercadopago.com.br/developers
2. Vá em **Suas integrações** > **Credenciais**
3. Gere um novo **Access Token** (Production ou Test)
4. Copie o token completo
5. Cole nas **Configurações** do sistema
6. Salve e tente novamente

### Solução 2: Usar Backend (Recomendado para produção)

Por segurança, pagamentos devem ser processados no **backend**, não no frontend.

**Por quê?**
- Evita expor credenciais no código do cliente
- Resolve problemas de CORS
- Mais seguro e confiável

**Como implementar:**

1. Crie um endpoint no seu backend (Node.js, Python, etc.)
2. O backend faz a requisição para o Mercado Pago
3. O frontend chama seu backend

**Exemplo de endpoint backend (Node.js):**

```javascript
// Backend: /api/create-pix-payment
app.post('/api/create-pix-payment', async (req, res) => {
  const { accessToken, paymentData } = req.body
  
  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paymentData),
    })
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

**Modificar frontend para usar backend:**

```typescript
// Em vez de chamar diretamente a API do Mercado Pago:
const pixPayment = await createPixPayment(accessToken, paymentData)

// Chamar seu backend:
const response = await fetch('/api/create-pix-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ accessToken, paymentData }),
})
const pixPayment = await response.json()
```

### Solução 3: Verificar Configurações do Mercado Pago

1. Verifique se está usando o token correto (Test ou Production)
2. Confirme que o token não expirou
3. Verifique se a aplicação está ativa no Mercado Pago

### Solução 4: Testar em Modo Desenvolvimento

Se estiver em desenvolvimento local:

1. Use tokens de **Test** (sandbox)
2. Verifique se não há bloqueios de firewall
3. Teste em diferentes navegadores

## Verificação Rápida

1. ✅ Access Token está configurado?
2. ✅ Token não está expirado?
3. ✅ Internet está funcionando?
4. ✅ Está usando token de Test ou Production corretamente?

## Nota Importante

⚠️ **Para produção, sempre use um backend!** Processar pagamentos diretamente no frontend expõe suas credenciais e pode causar problemas de segurança e CORS.

