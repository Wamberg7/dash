import { useState, useEffect } from 'react'
import {
  Database,
  FileJson,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BotDatabaseViewerProps {
  appId: string
  isOpen: boolean
  onClose: () => void
}

interface DatabaseFile {
  name: string
  path: string
  content?: any
  isLoading?: boolean
}

export function BotDatabaseViewer({ appId, isOpen, onClose }: BotDatabaseViewerProps) {
  const { toast } = useToast()
  const [databaseFiles, setDatabaseFiles] = useState<DatabaseFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<any>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  const loadDatabaseFiles = async () => {
    try {
      setIsLoading(true)
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      // Tentar listar arquivos da pasta database
      try {
        const files = await api.getSquareCloudBotFiles(
          appId,
          botSettings.squarecloudAccessToken,
          'database'
        )

        // Se retornar uma lista de arquivos, processar
        if (Array.isArray(files)) {
          const jsonFiles = files
            .filter((file: any) => file.name && file.name.endsWith('.json'))
            .map((file: any) => ({
              name: file.name || file,
              path: `database/${file.name || file}`,
            }))
          setDatabaseFiles(jsonFiles)
        } else {
          // Se não retornar lista, tentar os arquivos padrão do lucas_ticket
          const defaultFiles = [
            { name: 'tickets_assumidos.json', path: 'database/tickets_assumidos.json' },
            { name: 'tickets_data.json', path: 'database/tickets_data.json' },
            { name: 'config.json', path: 'database/config.json' },
            { name: 'painel_config.json', path: 'database/painel_config.json' },
            { name: 'keys.json', path: 'database/keys.json' },
            { name: 'keysandroid.json', path: 'database/keysandroid.json' },
          ]
          setDatabaseFiles(defaultFiles)
        }
      } catch (error: any) {
        // Se der erro ao listar, usar arquivos padrão
        console.warn('Erro ao listar arquivos, usando padrão:', error)
        const defaultFiles = [
          { name: 'tickets_assumidos.json', path: 'database/tickets_assumidos.json' },
          { name: 'tickets_data.json', path: 'database/tickets_data.json' },
          { name: 'config.json', path: 'database/config.json' },
          { name: 'painel_config.json', path: 'database/painel_config.json' },
          { name: 'keys.json', path: 'database/keys.json' },
          { name: 'keysandroid.json', path: 'database/keysandroid.json' },
        ]
        setDatabaseFiles(defaultFiles)
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os arquivos do database.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadFileContent = async (filePath: string) => {
    try {
      setIsLoadingContent(true)
      setSelectedFile(filePath)
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      const content = await api.getSquareCloudBotFileContent(
        appId,
        botSettings.squarecloudAccessToken,
        filePath
      )

      // Tentar fazer parse se for string
      if (typeof content === 'string') {
        try {
          setFileContent(JSON.parse(content))
        } catch {
          setFileContent(content)
        }
      } else if (content.content) {
        // Se tiver propriedade content, tentar parse
        try {
          setFileContent(JSON.parse(content.content))
        } catch {
          setFileContent(content.content || content)
        }
      } else {
        setFileContent(content)
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar o conteúdo do arquivo.',
        variant: 'destructive',
      })
      setFileContent(null)
    } finally {
      setIsLoadingContent(false)
    }
  }

  useEffect(() => {
    if (isOpen && appId) {
      loadDatabaseFiles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, appId])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database do Bot
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Visualize os arquivos JSON do database da aplicação {appId.substring(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Lista de arquivos */}
          <Card className="bg-zinc-900 border-zinc-800 w-80 flex-shrink-0 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Arquivos</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadDatabaseFiles}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : databaseFiles.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  Nenhum arquivo encontrado
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {databaseFiles.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => loadFileContent(file.path)}
                        className={`w-full text-left p-2 rounded-md transition-colors flex items-center gap-2 ${
                          selectedFile === file.path
                            ? 'bg-zinc-800 text-white'
                            : 'hover:bg-zinc-800/50 text-zinc-300'
                        }`}
                      >
                        <FileJson className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate flex-1">{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visualizador de conteúdo */}
          <Card className="bg-zinc-900 border-zinc-800 flex-1 flex flex-col min-w-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">
                  {selectedFile ? selectedFile.split('/').pop() : 'Selecione um arquivo'}
                </CardTitle>
                {selectedFile && fileContent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(fileContent, null, 2)], {
                        type: 'application/json',
                      })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = selectedFile.split('/').pop() || 'file.json'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              {!selectedFile ? (
                <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                  Selecione um arquivo para visualizar
                </div>
              ) : isLoadingContent ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : fileContent === null ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <span className="text-sm">Erro ao carregar arquivo</span>
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="p-4">
                    <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap break-words">
                      {JSON.stringify(fileContent, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

