# Configuração da URL da API

A URL da API foi configurada para usar `https://api-berg.squareweb.app/` por padrão em produção.

## Configuração Automática

O arquivo `src/lib/api-config.ts` foi atualizado para:
- **Desenvolvimento:** Usa `http://localhost:3001` automaticamente
- **Produção:** Usa `https://api-berg.squareweb.app` como padrão

## Configuração Manual (Opcional)

Se quiser sobrescrever a URL, crie um arquivo `.env.local` na raiz do projeto `site-berg/`:

```env
VITE_API_URL=https://api-berg.squareweb.app
```

Ou configure na Vercel (se estiver usando):
- Vá em **Settings > Environment Variables**
- Adicione: `VITE_API_URL` = `https://api-berg.squareweb.app`

## Testar a API

Após configurar, teste se a API está respondendo:

1. **Rota raiz:**
   ```
   https://api-berg.squareweb.app/
   ```

2. **Health check:**
   ```
   https://api-berg.squareweb.app/health
   ```

3. **Produtos:**
   ```
   https://api-berg.squareweb.app/api/products
   ```

## Verificar se está funcionando

1. Abra o console do navegador (F12)
2. Procure por: `🌐 Usando URL padrão da SquareCloud: https://api-berg.squareweb.app`
3. Teste fazer uma requisição (ex: carregar produtos)
4. Verifique se não há erros de CORS ou conexão

