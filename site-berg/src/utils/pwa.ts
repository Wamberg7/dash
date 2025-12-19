// Utilitários para PWA
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado com sucesso:', registration.scope)
        })
        .catch((error) => {
          console.log('Falha ao registrar Service Worker:', error)
        })
    })
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error('Erro ao desregistrar Service Worker:', error)
      })
  }
}

// Solicitar instalação do PWA
export function promptInstall() {
  // Verificar se o evento beforeinstallprompt está disponível
  let deferredPrompt: any

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir o prompt padrão
    e.preventDefault()
    // Salvar o evento para uso posterior
    deferredPrompt = e
  })

  return deferredPrompt
}

