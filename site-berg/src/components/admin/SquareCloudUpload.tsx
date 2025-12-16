import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { Loader2, Upload, FileArchive, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function SquareCloudUpload() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    appId?: string
  } | null>(null)
  
  // Configurações simplificadas
  const [appName, setAppName] = useState('Minha aplicação')
  const [appDescription, setAppDescription] = useState('Minha aplicação é incrível!')
  const [memory, setMemory] = useState('256')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = (file: File) => {
    // Validar se é arquivo ZIP
    if (!file.name.endsWith('.zip')) {
      toast({
        title: 'Erro',
        description: 'Apenas arquivos ZIP são permitidos.',
        variant: 'destructive',
      })
      return
    }

    // Validar tamanho (máximo 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      toast({
        title: 'Erro',
        description: 'O arquivo é muito grande. Tamanho máximo: 100MB',
        variant: 'destructive',
      })
      return
    }

    setSelectedFile(file)
    setUploadResult(null)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      // Validar se é arquivo ZIP
      if (!file.name.endsWith('.zip')) {
        toast({
          title: 'Erro',
          description: 'Apenas arquivos ZIP são permitidos.',
          variant: 'destructive',
        })
        return
      }

      // Validar tamanho (máximo 100MB)
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (file.size > maxSize) {
        toast({
          title: 'Erro',
          description: 'O arquivo é muito grande. Tamanho máximo: 100MB',
          variant: 'destructive',
        })
        return
      }

      setSelectedFile(file)
      setUploadResult(null)
    }
  }, [toast])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo antes de enviar.',
        variant: 'destructive',
      })
      return
    }

    if (!appName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para a aplicação.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadResult(null)

    try {
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado. Configure nas Configurações.',
          variant: 'destructive',
        })
        return
      }

      // Verificar se há backend configurado
      const { getApiUrl } = await import('@/lib/api-config')
      const backendUrl = getApiUrl()
      
      if (!backendUrl) {
        toast({
          title: 'Configuração Necessária',
          description: 'Para fazer upload de aplicações, é necessário configurar VITE_API_URL nas variáveis de ambiente. O upload direto não é possível devido a CORS.',
          variant: 'destructive',
        })
        setIsUploading(false)
        return
      }

      // Verificar se o backend está rodando (tentativa não bloqueante)
      try {
        const healthCheck = await fetch(`${backendUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Timeout de 3 segundos
          signal: AbortSignal.timeout(3000),
        })
        if (!healthCheck.ok) {
          console.warn('⚠️ Health check retornou status não OK:', healthCheck.status)
          // Não bloquear, apenas avisar
        } else {
          console.log('✅ Health check OK')
        }
      } catch (error: any) {
        // Se for erro de timeout ou CORS, apenas avisar mas não bloquear
        if (error.name === 'AbortError' || error.message?.includes('Failed to fetch') || error.message?.includes('CORS')) {
          console.warn('⚠️ Health check falhou, mas continuando:', error.message)
          // Não bloquear o upload, apenas avisar
        } else {
          // Outros erros também não devem bloquear
          console.warn('⚠️ Health check falhou:', error.message)
        }
        // Não bloquear o upload por causa do health check
      }

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Fazer upload para SquareCloud através do backend (evita CORS)
      const result = await api.uploadSquareCloudApplication(
        botSettings.squarecloudAccessToken,
        selectedFile,
        {
          name: appName,
          description: appDescription,
          memory: parseInt(memory),
          discordUserId: user?.id || null, // Discord ID do usuário
          userId: user?.userId || null, // UUID do usuário na tabela users
        }
      )

      clearInterval(progressInterval)
      setUploadProgress(100)

      setUploadResult({
        success: true,
        message: result.message || 'Aplicação enviada com sucesso!',
        appId: result.appId,
      })

      toast({
        title: 'Sucesso',
        description: 'Aplicação enviada com sucesso para a SquareCloud!',
      })

      // Limpar após sucesso
      setTimeout(() => {
        setSelectedFile(null)
        setAppName('Minha aplicação')
        setAppDescription('Minha aplicação é incrível!')
        setMemory('256')
        setUploadResult(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 3000)
    } catch (error: any) {
      setUploadProgress(0)
      let errorMessage = error.message || 'Erro ao enviar aplicação'
      
      // Melhorar mensagens de erro específicas
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS')) {
        errorMessage = 'Erro de conexão com o backend. Verifique se a API está acessível em https://api-berg.squareweb.app e se tem o endpoint /api/squarecloud/upload implementado.'
      } else if (errorMessage.includes('Backend não configurado')) {
        errorMessage = 'Backend não configurado. Configure VITE_API_URL nas variáveis de ambiente. Em produção, use https://api-berg.squareweb.app'
      }
      
      setUploadResult({
        success: false,
        message: errorMessage,
      })

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Vamos construir algo novo</h1>
        <p className="text-zinc-400 mt-1">Siga as instruções abaixo para enviar sua aplicação.</p>
      </div>

      {/* Aviso sobre Backend */}
      <Alert className="bg-yellow-500/10 border-yellow-500/50">
        <AlertCircle className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-300">
          <strong>Importante:</strong> Para fazer upload de aplicações, é necessário ter o backend rodando com o endpoint <code className="bg-zinc-900 px-1 rounded">/api/squarecloud/upload</code> implementado. 
          Em produção, a API está disponível em <code className="bg-zinc-900 px-1 rounded">https://api-berg.squareweb.app</code>. 
          Configure <code className="bg-zinc-900 px-1 rounded">VITE_API_URL=https://api-berg.squareweb.app</code> nas variáveis de ambiente.
        </AlertDescription>
      </Alert>

      {/* Seção de Upload */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Quase lá! Agora, configure o seu zip.</CardTitle>
          <CardDescription className="text-zinc-400">
            Selecione o zip que será importado. Se for um monorepo, não se esqueça de alterar o diretório raiz para a pasta correta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Área de Drag and Drop */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xl">
                  A
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xl">
                  B
                </div>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Arraste e solte seu arquivo .zip</p>
                <p className="text-zinc-400 text-sm">Você só pode enviar arquivos até 100 MB</p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={isUploading}
              >
                Selecione seu arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isUploading}
              />
              {selectedFile && (
                <div className="mt-4 p-4 bg-zinc-800 rounded-lg w-full max-w-md">
                  <div className="flex items-center gap-3">
                    <FileArchive className="h-6 w-6 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm text-white font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-zinc-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações da Aplicação */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Configurações da aplicação</CardTitle>
          <CardDescription className="text-zinc-400">
            Defina os parâmetros essenciais para a implantação do seu projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="app-name" className="text-white">Nome da aplicação</Label>
              <Input
                id="app-name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
                placeholder="Minha aplicação"
                disabled={isUploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-description" className="text-white">Descrição</Label>
              <Input
                id="app-description"
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
                placeholder="Minha aplicação é incrível!"
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memory" className="text-white">Memória</Label>
            <div className="flex gap-2">
              <Input
                id="memory"
                type="number"
                value={memory}
                onChange={(e) => setMemory(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
                min="256"
                max="1024"
                step="128"
                disabled={isUploading}
              />
              <Select value="MB" disabled>
                <SelectTrigger className="w-32 bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue>MB</SelectValue>
                </SelectTrigger>
              </Select>
            </div>
            <p className="text-xs text-zinc-400">Recomendado: 256 MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Barra de progresso */}
      {isUploading && (
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Enviando...</span>
                <span className="text-zinc-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado do upload */}
      {uploadResult && (
        <Alert
          className={
            uploadResult.success
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-red-500/10 border-red-500/50'
          }
        >
          {uploadResult.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
          <AlertDescription
            className={uploadResult.success ? 'text-green-300' : 'text-red-300'}
          >
            <strong>{uploadResult.success ? 'Sucesso!' : 'Erro:'}</strong>{' '}
            {uploadResult.message}
            {uploadResult.appId && (
              <div className="mt-2 text-sm">
                <strong>ID da Aplicação:</strong> {uploadResult.appId}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Botão de Deploy */}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading || !appName.trim()}
        className="w-full"
        size="lg"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Realizando o deploy...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Realizar o deploy
          </>
        )}
      </Button>
    </div>
  )
}
