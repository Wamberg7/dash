// Biblioteca para integração com a API da SquareCloud
// A API da SquareCloud requer autenticação via token

import { getApiUrl } from './api-config'

const SQUARECLOUD_API_URL = 'https://api.squarecloud.app/v2'

export interface SquareCloudApplication {
  id: string
  name: string
  description?: string
  avatar?: string
  cluster: string
  ram: number
  lang: string
  type: string
  status: 'running' | 'stopped'
}

export interface SquareCloudStatus {
  cpu: number
  ram: number
  status: 'running' | 'stopped'
  running: boolean
  storage: number
  network: {
    total: {
      input: number
      output: number
    }
    now: {
      input: number
      output: number
    }
  }
  uptime: number
  requests: number
}

export interface SquareCloudDatabase {
  id: string
  name: string
  type: string
  host: string
  port: number
  database: string
  username: string
  password?: string
  ssl: boolean
  createdAt: string
}

class SquareCloudAPI {
  private token: string
  private apiUrl: string

  constructor(token: string) {
    this.token = token
    this.apiUrl = SQUARECLOUD_API_URL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.token,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}` 
      }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.response || data
  }

  // Listar todas as aplicações do usuário
  async getApplications(): Promise<SquareCloudApplication[]> {
    try {
      const user = await this.request<{ applications: SquareCloudApplication[] }>('/user')
      return user.applications || []
    } catch (error) {
      console.error('Erro ao buscar aplicações:', error)
      throw error
    }
  }

  // Obter informações de uma aplicação específica
  async getApplication(appId: string): Promise<SquareCloudApplication> {
    return this.request<SquareCloudApplication>(`/apps/${appId}`)
  }

  // Obter status de uma aplicação (CPU, RAM, Network, etc)
  async getApplicationStatus(appId: string): Promise<SquareCloudStatus> {
    const data = await this.request<{
      cpu: number
      ram: number
      status: string
      running: boolean
      storage: number
      network: {
        total: { input: number; output: number }
        now: { input: number; output: number }
      }
      uptime: number
      requests: number
    }>(`/apps/${appId}/status`)

    return {
      cpu: data.cpu,
      ram: data.ram,
      status: data.running ? 'running' : 'stopped',
      running: data.running,
      storage: data.storage,
      network: {
        total: {
          input: data.network.total.input,
          output: data.network.total.output,
        },
        now: {
          input: data.network.now.input,
          output: data.network.now.output,
        },
      },
      uptime: data.uptime,
      requests: data.requests,
    }
  }

  // Iniciar aplicação
  async startApplication(appId: string): Promise<void> {
    await this.request(`/apps/${appId}/start`, { method: 'POST' })
  }

  // Parar aplicação
  async stopApplication(appId: string): Promise<void> {
    await this.request(`/apps/${appId}/stop`, { method: 'POST' })
  }

  // Reiniciar aplicação
  async restartApplication(appId: string): Promise<void> {
    await this.request(`/apps/${appId}/restart`, { method: 'POST' })
  }

  // Obter logs da aplicação
  async getApplicationLogs(appId: string): Promise<string> {
    const data = await this.request<{ content: string }>(`/apps/${appId}/logs`)
    return data.content || ''
  }

  // Obter databases da aplicação (se disponível)
  async getApplicationDatabases(appId: string): Promise<SquareCloudDatabase[]> {
    try {
      // A API da SquareCloud pode não ter endpoint direto para databases
      // Isso depende da documentação oficial
      // Por enquanto, retornamos array vazio
      // Você pode precisar fazer uma requisição diferente ou usar outro método
      return []
    } catch (error) {
      console.error('Erro ao buscar databases:', error)
      return []
    }
  }

  // Obter logs da aplicação (últimas linhas)
  async getApplicationLogsTail(appId: string, lines: number = 100): Promise<string[]> {
    try {
      const logs = await this.getApplicationLogs(appId)
      const logLines = logs.split('\n').filter(line => line.trim())
      return logLines.slice(-lines)
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
      return []
    }
  }
}

// Função helper para criar instância da API
export function createSquareCloudAPI(token: string): SquareCloudAPI {
  return new SquareCloudAPI(token)
}

// Função helper para buscar através do backend (mais seguro)
export async function fetchSquareCloudData(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const API_URL = getApiUrl()
  const url = `${API_URL}/api/squarecloud${endpoint}`

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: `HTTP ${response.status}` 
    }))
    throw new Error(error.error || error.message || `HTTP ${response.status}`)
  }

  return response.json()
}


