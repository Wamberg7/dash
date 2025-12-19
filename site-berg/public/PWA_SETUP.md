# Configuração PWA (Progressive Web App)

A aplicação está configurada para funcionar como uma PWA instalável.

## Ícones Necessários

Para completar a configuração, você precisa criar os seguintes ícones na pasta `public/`:

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

### Como criar os ícones:

1. Use uma imagem quadrada de alta qualidade (mínimo 512x512)
2. Converta para PNG usando ferramentas online como:
   - https://www.iloveimg.com/resize-image
   - https://www.favicon-generator.org/
3. Salve os arquivos na pasta `public/`

### Gerar ícones automaticamente:

Você pode usar o favicon atual como base e gerar os ícones necessários.

## Funcionalidades PWA

- ✅ Instalável em dispositivos móveis e desktop
- ✅ Funciona offline (com cache básico)
- ✅ Atalhos para páginas principais
- ✅ Tema escuro configurado

## Testar a PWA

1. Execute `npm run build`
2. Execute `npm run preview`
3. Abra o DevTools (F12)
4. Vá para a aba "Application" > "Service Workers"
5. Verifique se o Service Worker está registrado
6. Vá para "Application" > "Manifest" para verificar o manifest

## Instalar no dispositivo

### Desktop (Chrome/Edge):
- Clique no ícone de instalação na barra de endereços
- Ou vá em Menu > "Instalar aplicativo"

### Mobile (Android):
- Abra o site no Chrome
- Menu > "Adicionar à tela inicial"

### Mobile (iOS):
- Abra o site no Safari
- Compartilhar > "Adicionar à Tela de Início"

