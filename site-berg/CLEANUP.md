# Limpeza do Projeto - site-berg

## Arquivos Removidos

### Lock Files Desnecessários
- ✅ `bun.lockb` - Removido (projeto usa npm/pnpm, não Bun)

### Configurações Desnecessárias
- ✅ `pnpm-workspace.yaml` - Removido (não está sendo usado, configuração específica de ambiente)

## Arquivos Mantidos (Necessários)

### Configurações Essenciais
- `.npmrc` - Configuração do pnpm (pode ser útil se mudar para pnpm)
- `package-lock.json` - Lock file do npm (necessário)
- `.prettierrc` - Configuração do Prettier
- `.prettierignore` - Arquivos ignorados pelo Prettier
- `.oxlintrc.json` - Configuração do Oxlint (usado no lint)
- `components.json` - Configuração do shadcn/ui
- `tailwind.config.ts` - Configuração do Tailwind
- `postcss.config.js` - Configuração do PostCSS
- `vite.config.ts` - Configuração do Vite
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - Configurações TypeScript
- `vercel.json` - Configuração do Vercel

### Estrutura de Pastas
- `src/` - Código fonte
- `public/` - Arquivos públicos
- `docs/` - Documentação
- `database/` - Scripts SQL e migrações
- `dist/` - Build output (ignorado pelo git)

## Melhorias no .gitignore

Adicionados ao `.gitignore`:
- `bun.lockb` - Lock file do Bun
- `yarn.lock` - Lock file do Yarn (caso mude)
- `.oxlintcache` - Cache do Oxlint
- Arquivos temporários e de cache
- Arquivos do sistema operacional

## Notas

- O projeto está usando **npm** como gerenciador de pacotes principal (baseado no `package-lock.json` e `vercel.json`)
- Configurações do pnpm foram mantidas no `.npmrc` caso queira migrar no futuro
- A pasta `dist/` está sendo ignorada pelo git (arquivos de build)
- Todos os arquivos de configuração necessários foram mantidos

