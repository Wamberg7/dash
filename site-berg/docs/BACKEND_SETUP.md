# Configuração do Backend para Mercado Pago

## ⚠️ IMPORTANTE: API Movida

A API foi movida para a pasta `api/` na **raiz do projeto** e agora é um projeto independente.

## Por que usar um backend?

A API do Mercado Pago bloqueia requisições diretas do navegador (CORS). Por isso, criamos um backend simples que processa os pagamentos de forma segura.

## Como usar

### 1. Configurar e Rodar a API

```bash
# Na raiz do projeto
cd api
npm install
npm start
```

A API estará rodando em `http://localhost:3001`

### 2. Rodar o Frontend

```bash
# Em outro terminal
cd site-berg-08670
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## Endpoints do Backend

- `POST /api/create-pix-payment` - Cria pagamento Pix
- `POST /api/create-preference` - Cria preferência de pagamento (Checkout Pro)
- `GET /api/payment-status/:paymentId` - Consulta status do pagamento
- `GET /health` - Verifica se o backend está funcionando

## Configuração

O backend usa a porta **3001** por padrão. Se precisar mudar, defina a variável de ambiente:

```bash
PORT=3001 npm run server
```

No frontend, você pode configurar a URL do backend criando um arquivo `.env`:

```
VITE_BACKEND_URL=http://localhost:3001
```

## Testando

1. Certifique-se de que o backend está rodando
2. Acesse http://localhost:5173
3. Configure o Access Token do Mercado Pago nas Configurações
4. Tente fazer uma compra

## Solução de Problemas

### Erro: "Erro de conexão com o backend"
- Certifique-se de que o backend está rodando (`npm run server`)
- Verifique se a porta 3001 está livre
- Verifique se não há firewall bloqueando

### Erro: "Access Token inválido"
- Verifique se o token está correto nas Configurações
- Gere um novo token em https://www.mercadopago.com.br/developers

### CORS ainda aparece
- O backend já resolve CORS, mas se ainda aparecer, verifique se está chamando a URL correta do backend

