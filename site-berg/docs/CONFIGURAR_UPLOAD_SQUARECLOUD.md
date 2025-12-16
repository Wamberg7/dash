# Como Configurar o Upload para SquareCloud

## 📍 Onde Configurar a URL

A URL do backend precisa ser configurada em **variáveis de ambiente**. Você pode fazer isso de duas formas:

### 1. **Para Desenvolvimento Local** (arquivo `.env`)

Crie um arquivo `.env` na pasta `site-berg`:

```env
# URL do Backend
VITE_API_URL=http://localhost:3001
# OU
VITE_BACKEND_URL=http://localhost:3001
```

### 2. **Para Produção (Vercel)**

1. Acesse o dashboard da Vercel: https://vercel.com
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://sua-api-backend.vercel.app` (ou a URL do seu backend)
5. Clique em **Save**
6. Faça um novo deploy

## 🔗 Qual URL Usar?

A URL deve apontar para o **seu backend** que faz o proxy para a SquareCloud. Não use a URL da SquareCloud diretamente!

### Exemplos:

**Desenvolvimento:**
```
VITE_API_URL=http://localhost:3001
```

**Produção (se o backend estiver na Vercel):**
```
VITE_API_URL=https://seu-backend.vercel.app
```

**Produção (se o backend estiver em outro servidor):**
```
VITE_API_URL=https://api.seudominio.com
```

## ⚙️ O que o Backend Precisa Ter?

O backend precisa ter um endpoint que recebe o arquivo e faz upload para a SquareCloud:

**Endpoint necessário:** `POST /api/squarecloud/upload`

**O que o endpoint recebe:**
- `file` (FormData) - O arquivo ZIP
- `accessToken` (string) - Token da SquareCloud
- `name` (string, opcional) - Nome da aplicação
- `description` (string, opcional) - Descrição
- `memory` (number, opcional) - Memória em MB

**O que o endpoint retorna:**
```json
{
  "appId": "id_da_aplicacao",
  "message": "Aplicação enviada com sucesso!"
}
```

## ✅ Backend Já Criado!

O backend já foi criado na pasta `api/` na raiz do projeto! Você só precisa:

### 1. Instalar e Iniciar

```bash
cd api
npm install
npm start
```

O servidor estará rodando em `http://localhost:3001`

**⚠️ IMPORTANTE:** Certifique-se de que o backend está rodando antes de tentar fazer upload! 

Para verificar se está funcionando, abra no navegador:
- `http://localhost:3001/health` - Deve retornar `{"status":"ok",...}`

### 2. Configurar o Frontend

Crie um arquivo `.env` na pasta `site-berg`:

```env
VITE_API_URL=http://localhost:3001
```

### 3. Pronto!

Agora você pode fazer upload de aplicações sem erro de CORS!

---

## 📝 Exemplo de Backend (Referência)

Se quiser entender como funciona, aqui está o código do backend:

```javascript
// server.js
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/squarecloud/upload', upload.single('file'), async (req, res) => {
  try {
    const { accessToken, name, description, memory } = req.body;
    const file = req.file;

    if (!file || !accessToken) {
      return res.status(400).json({ error: 'Arquivo e token são obrigatórios' });
    }

    // Criar FormData para enviar para SquareCloud
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);
    if (memory) formData.append('memory', memory.toString());

    // Fazer upload para SquareCloud
    const response = await fetch('https://api.squarecloud.app/v2/apps/upload', {
      method: 'POST',
      headers: {
        'Authorization': accessToken.trim(),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      return res.status(response.status).json({
        error: data.message || 'Erro ao fazer upload',
      });
    }

    res.json({
      appId: data.response?.id || data.response?.appId || '',
      message: data.response?.message || 'Aplicação enviada com sucesso!',
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
```

## 📝 Resumo

1. **Crie o arquivo `.env`** na pasta `site-berg` com:
   ```
   VITE_API_URL=http://localhost:3001
   ```

2. **Inicie o backend** na porta 3001 (ou a porta que você configurar)

3. **Certifique-se** de que o backend tem o endpoint `/api/squarecloud/upload` implementado

4. **Em produção**, configure `VITE_API_URL` nas variáveis de ambiente da Vercel

## ⚠️ Importante

- **NÃO** use a URL da SquareCloud diretamente (`https://api.squarecloud.app`) - isso causará erro de CORS
- Use sempre a URL do **seu backend** que faz o proxy
- O backend precisa estar rodando e acessível para o upload funcionar

