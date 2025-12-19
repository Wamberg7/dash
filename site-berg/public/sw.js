// Service Worker para PWA
const CACHE_NAME = 'es-berg-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json'
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto:', CACHE_NAME)
        return cache.addAll(urlsToCache).catch((err) => {
          console.log('[SW] Erro ao adicionar ao cache:', err)
        })
      })
  )
  // Força a ativação imediata
  self.skipWaiting()
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Assume controle de todas as páginas
  return self.clients.claim()
})

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') {
    return
  }

  // Ignorar requisições de API e recursos externos
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('api.centralcart.com.br') ||
    event.request.url.includes('api.mercadopago.com')
  ) {
    return fetch(event.request)
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se disponível
        if (response) {
          return response
        }
        // Busca na rede e armazena no cache
        return fetch(event.request).then((response) => {
          // Verifica se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          // Clona a resposta para armazenar no cache
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
      })
      .catch(() => {
        // Em caso de erro, retorna uma página offline se disponível
        if (event.request.destination === 'document') {
          return caches.match('/index.html')
        }
      })
  )
})

