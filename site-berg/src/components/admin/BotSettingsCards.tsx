import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Key, 
  Hash, 
  Settings, 
  Image as ImageIcon, 
  DollarSign,
  Save,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react'
import { BotSettings } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'

interface BotSettingsCardsProps {
  botSettings: BotSettings | null
  onSave: (settings: BotSettings) => Promise<void>
  isLoading?: boolean
}

// Schema para cada seção
const credentialsSchema = z.object({
  discordToken: z.string().optional(),
  squarecloudAccessToken: z.string().optional(),
  mercadoPagoAccessToken: z.string().optional(),
})

const idsSchema = z.object({
  botId: z.string().optional(),
  serverId: z.string().optional(),
  ownerId: z.string().optional(),
})

const backendSchema = z.object({
  backendUrl: z.string().url().optional().or(z.literal('')),
  useBackend: z.boolean().optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
})

const channelsSchema = z.object({
  carrinhosChannelId: z.string().optional(),
  logsComprasChannelId: z.string().optional(),
  logsBotEnviadosChannelId: z.string().optional(),
  logsBotExpiradosChannelId: z.string().optional(),
  logsQuebrarTermosChannelId: z.string().optional(),
  logsRenovacaoChannelId: z.string().optional(),
  logsStartChannelId: z.string().optional(),
})

const imagesSchema = z.object({
  imagemGen: z.string().url().optional().or(z.literal('')),
  imagemMoney: z.string().url().optional().or(z.literal('')),
  imagemAuth: z.string().url().optional().or(z.literal('')),
  imagemTicket: z.string().url().optional().or(z.literal('')),
})

const pricesSchema = z.object({
  valorBotGen: z.string().optional(),
  valorBotAuth: z.string().optional(),
  valorBioPerso: z.string().optional(),
  valorStockEx: z.string().optional(),
  valorStockAuto: z.string().optional(),
  valorStockMan: z.string().optional(),
  valorBotTicket: z.string().optional(),
})

export function BotSettingsCards({ botSettings, onSave, isLoading }: BotSettingsCardsProps) {
  const { toast } = useToast()
  const [openModal, setOpenModal] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)

  const toggleSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  // Form para Credenciais
  const credentialsForm = useForm<z.infer<typeof credentialsSchema>>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      discordToken: botSettings?.discordToken || '',
      squarecloudAccessToken: botSettings?.squarecloudAccessToken || '',
      mercadoPagoAccessToken: botSettings?.mercadoPagoAccessToken || '',
    },
  })

  // Form para IDs
  const idsForm = useForm<z.infer<typeof idsSchema>>({
    resolver: zodResolver(idsSchema),
    defaultValues: {
      botId: botSettings?.botId || '',
      serverId: botSettings?.serverId || '',
      ownerId: botSettings?.ownerId || '',
    },
  })

  // Form para Backend
  const backendForm = useForm<z.infer<typeof backendSchema>>({
    resolver: zodResolver(backendSchema),
    defaultValues: {
      backendUrl: botSettings?.backendUrl || 'http://localhost:3001',
      useBackend: botSettings?.useBackend ?? false,
      webhookUrl: botSettings?.webhookUrl || '',
    },
  })

  // Form para Canais
  const channelsForm = useForm<z.infer<typeof channelsSchema>>({
    resolver: zodResolver(channelsSchema),
    defaultValues: {
      carrinhosChannelId: botSettings?.carrinhosChannelId || '',
      logsComprasChannelId: botSettings?.logsComprasChannelId || '',
      logsBotEnviadosChannelId: botSettings?.logsBotEnviadosChannelId || '',
      logsBotExpiradosChannelId: botSettings?.logsBotExpiradosChannelId || '',
      logsQuebrarTermosChannelId: botSettings?.logsQuebrarTermosChannelId || '',
      logsRenovacaoChannelId: botSettings?.logsRenovacaoChannelId || '',
      logsStartChannelId: botSettings?.logsStartChannelId || '',
    },
  })

  // Form para Imagens
  const imagesForm = useForm<z.infer<typeof imagesSchema>>({
    resolver: zodResolver(imagesSchema),
    defaultValues: {
      imagemGen: botSettings?.imagemGen || '',
      imagemMoney: botSettings?.imagemMoney || '',
      imagemAuth: botSettings?.imagemAuth || '',
      imagemTicket: botSettings?.imagemTicket || '',
    },
  })

  // Form para Preços
  const pricesForm = useForm<z.infer<typeof pricesSchema>>({
    resolver: zodResolver(pricesSchema),
    defaultValues: {
      valorBotGen: botSettings?.valorBotGen || '',
      valorBotAuth: botSettings?.valorBotAuth || '',
      valorBioPerso: botSettings?.valorBioPerso || '',
      valorStockEx: botSettings?.valorStockEx || '',
      valorStockAuto: botSettings?.valorStockAuto || '',
      valorStockMan: botSettings?.valorStockMan || '',
      valorBotTicket: botSettings?.valorBotTicket || '',
    },
  })

  const handleSave = async (section: string, values: any) => {
    setIsSaving(true)
    try {
      // Garantir que todos os campos sejam sempre enviados (mesmo que sejam strings vazias)
      // Isso evita que campos sejam perdidos quando salva apenas uma seção
      const updatedSettings: BotSettings = {
        // Preservar todos os campos existentes do botSettings atual
        id: botSettings?.id,
        discordToken: botSettings?.discordToken ?? '',
        squarecloudAccessToken: botSettings?.squarecloudAccessToken ?? '',
        mercadoPagoAccessToken: botSettings?.mercadoPagoAccessToken ?? '',
        botId: botSettings?.botId ?? '',
        serverId: botSettings?.serverId ?? '',
        ownerId: botSettings?.ownerId ?? '',
        backendUrl: botSettings?.backendUrl ?? 'http://localhost:3001',
        useBackend: botSettings?.useBackend ?? false,
        webhookUrl: botSettings?.webhookUrl ?? '',
        carrinhosChannelId: botSettings?.carrinhosChannelId ?? '',
        logsComprasChannelId: botSettings?.logsComprasChannelId ?? '',
        logsBotEnviadosChannelId: botSettings?.logsBotEnviadosChannelId ?? '',
        logsBotExpiradosChannelId: botSettings?.logsBotExpiradosChannelId ?? '',
        logsQuebrarTermosChannelId: botSettings?.logsQuebrarTermosChannelId ?? '',
        logsRenovacaoChannelId: botSettings?.logsRenovacaoChannelId ?? '',
        logsStartChannelId: botSettings?.logsStartChannelId ?? '',
        imagemGen: botSettings?.imagemGen ?? '',
        imagemMoney: botSettings?.imagemMoney ?? '',
        imagemAuth: botSettings?.imagemAuth ?? '',
        imagemTicket: botSettings?.imagemTicket ?? '',
        valorBotGen: botSettings?.valorBotGen ?? '',
        valorBotAuth: botSettings?.valorBotAuth ?? '',
        valorBioPerso: botSettings?.valorBioPerso ?? '',
        valorStockEx: botSettings?.valorStockEx ?? '',
        valorStockAuto: botSettings?.valorStockAuto ?? '',
        valorStockMan: botSettings?.valorStockMan ?? '',
        valorBotTicket: botSettings?.valorBotTicket ?? '',
        // Sobrescrever com os novos valores da seção editada
        ...values,
      }
      
      // Garantir que valores undefined/null sejam convertidos para string vazia
      Object.keys(values).forEach((key) => {
        if (updatedSettings[key as keyof BotSettings] === undefined || updatedSettings[key as keyof BotSettings] === null) {
          updatedSettings[key as keyof BotSettings] = '' as any
        }
      })
      
      console.log('Salvando configurações:', {
        section,
        hasSquarecloudToken: !!updatedSettings.squarecloudAccessToken,
        squarecloudTokenLength: updatedSettings.squarecloudAccessToken?.length || 0,
        squarecloudTokenValue: updatedSettings.squarecloudAccessToken ? `${updatedSettings.squarecloudAccessToken.substring(0, 10)}...` : 'vazio',
        allFields: Object.keys(updatedSettings)
      })
      
      await onSave(updatedSettings)
      setOpenModal(null)
      toast({
        title: 'Configurações salvas',
        description: `As configurações de ${section} foram salvas com sucesso.`,
      })
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: 'Erro ao salvar',
        description: error?.message || 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const cards = [
    {
      id: 'credentials',
      title: 'Tokens e Credenciais',
      description: 'Configure os tokens de acesso do Discord, SquareCloud e Mercado Pago',
      icon: Key,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      form: credentialsForm,
      schema: credentialsSchema,
      onSubmit: (values: z.infer<typeof credentialsSchema>) => handleSave('credenciais', values),
      fields: [
        { name: 'discordToken', label: 'Token do Discord', type: 'password', description: 'Token do bot Discord' },
        { name: 'squarecloudAccessToken', label: 'SquareCloud Token', type: 'password', description: 'Token de acesso da SquareCloud' },
        { name: 'mercadoPagoAccessToken', label: 'Mercado Pago Token', type: 'password', description: 'Token de acesso do Mercado Pago' },
      ],
    },
    {
      id: 'ids',
      title: 'IDs do Discord',
      description: 'Configure os IDs do bot, servidor e proprietário',
      icon: Hash,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      form: idsForm,
      schema: idsSchema,
      onSubmit: (values: z.infer<typeof idsSchema>) => handleSave('IDs', values),
      fields: [
        { name: 'botId', label: 'Bot ID', type: 'text', description: 'ID do bot Discord' },
        { name: 'serverId', label: 'Server ID', type: 'text', description: 'ID do servidor Discord' },
        { name: 'ownerId', label: 'Owner ID', type: 'text', description: 'ID do proprietário' },
      ],
    },
    {
      id: 'backend',
      title: 'Configurações do Backend',
      description: 'Configure a URL do backend e opções de integração',
      icon: Settings,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      form: backendForm,
      schema: backendSchema,
      onSubmit: (values: z.infer<typeof backendSchema>) => handleSave('backend', values),
      fields: [
        { name: 'backendUrl', label: 'URL do Backend', type: 'text', description: 'URL do servidor backend' },
        { name: 'useBackend', label: 'Usar Backend', type: 'switch', description: 'Usar backend para processar pagamentos' },
        { name: 'webhookUrl', label: 'Webhook URL', type: 'text', description: 'URL do webhook para notificações' },
      ],
    },
    {
      id: 'channels',
      title: 'Canais do Discord',
      description: 'Configure os IDs dos canais para logs e notificações',
      icon: Hash,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      form: channelsForm,
      schema: channelsSchema,
      onSubmit: (values: z.infer<typeof channelsSchema>) => handleSave('canais', values),
      fields: [
        { name: 'carrinhosChannelId', label: 'Canal de Carrinhos', type: 'text', description: 'ID do canal de carrinhos' },
        { name: 'logsComprasChannelId', label: 'Logs de Compras', type: 'text', description: 'ID do canal de logs de compras' },
        { name: 'logsBotEnviadosChannelId', label: 'Logs Bot Enviados', type: 'text', description: 'ID do canal de logs de bots enviados' },
        { name: 'logsBotExpiradosChannelId', label: 'Logs Bot Expirados', type: 'text', description: 'ID do canal de logs de bots expirados' },
        { name: 'logsQuebrarTermosChannelId', label: 'Logs Quebrar Termos', type: 'text', description: 'ID do canal de logs de quebra de termos' },
        { name: 'logsRenovacaoChannelId', label: 'Logs Renovação', type: 'text', description: 'ID do canal de logs de renovação' },
        { name: 'logsStartChannelId', label: 'Logs Start', type: 'text', description: 'ID do canal de logs de start' },
      ],
    },
    {
      id: 'images',
      title: 'URLs de Imagens',
      description: 'Configure as URLs das imagens usadas pelo bot',
      icon: ImageIcon,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      form: imagesForm,
      schema: imagesSchema,
      onSubmit: (values: z.infer<typeof imagesSchema>) => handleSave('imagens', values),
      fields: [
        { name: 'imagemGen', label: 'Imagem Gen', type: 'text', description: 'URL da imagem de geração' },
        { name: 'imagemMoney', label: 'Imagem Money', type: 'text', description: 'URL da imagem de dinheiro' },
        { name: 'imagemAuth', label: 'Imagem Auth', type: 'text', description: 'URL da imagem de autenticação' },
        { name: 'imagemTicket', label: 'Imagem Ticket', type: 'text', description: 'URL da imagem de ticket' },
      ],
    },
    {
      id: 'prices',
      title: 'Valores dos Produtos',
      description: 'Configure os preços dos produtos/bots',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      form: pricesForm,
      schema: pricesSchema,
      onSubmit: (values: z.infer<typeof pricesSchema>) => handleSave('preços', values),
      fields: [
        { name: 'valorBotGen', label: 'Valor Bot Gen', type: 'text', description: 'Preço do bot gen' },
        { name: 'valorBotAuth', label: 'Valor Bot Auth', type: 'text', description: 'Preço do bot auth' },
        { name: 'valorBioPerso', label: 'Valor Bio Perso', type: 'text', description: 'Preço da bio personalizada' },
        { name: 'valorStockEx', label: 'Valor Stock Ex', type: 'text', description: 'Preço do stock ex' },
        { name: 'valorStockAuto', label: 'Valor Stock Auto', type: 'text', description: 'Preço do stock auto' },
        { name: 'valorStockMan', label: 'Valor Stock Man', type: 'text', description: 'Preço do stock man' },
        { name: 'valorBotTicket', label: 'Valor Bot Ticket', type: 'text', description: 'Preço do bot ticket' },
      ],
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => {
        const Icon = card.icon
        const form = card.form

        return (
          <div key={card.id}>
            <Card className={`bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors ${card.borderColor}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Reset form com valores atuais
                      form.reset({
                        ...(card.id === 'credentials' && {
                          discordToken: botSettings?.discordToken || '',
                          squarecloudAccessToken: botSettings?.squarecloudAccessToken || '',
                          mercadoPagoAccessToken: botSettings?.mercadoPagoAccessToken || '',
                        }),
                        ...(card.id === 'ids' && {
                          botId: botSettings?.botId || '',
                          serverId: botSettings?.serverId || '',
                          ownerId: botSettings?.ownerId || '',
                        }),
                        ...(card.id === 'backend' && {
                          backendUrl: botSettings?.backendUrl || 'http://localhost:3001',
                          useBackend: botSettings?.useBackend ?? false,
                          webhookUrl: botSettings?.webhookUrl || '',
                        }),
                        ...(card.id === 'channels' && {
                          carrinhosChannelId: botSettings?.carrinhosChannelId || '',
                          logsComprasChannelId: botSettings?.logsComprasChannelId || '',
                          logsBotEnviadosChannelId: botSettings?.logsBotEnviadosChannelId || '',
                          logsBotExpiradosChannelId: botSettings?.logsBotExpiradosChannelId || '',
                          logsQuebrarTermosChannelId: botSettings?.logsQuebrarTermosChannelId || '',
                          logsRenovacaoChannelId: botSettings?.logsRenovacaoChannelId || '',
                          logsStartChannelId: botSettings?.logsStartChannelId || '',
                        }),
                        ...(card.id === 'images' && {
                          imagemGen: botSettings?.imagemGen || '',
                          imagemMoney: botSettings?.imagemMoney || '',
                          imagemAuth: botSettings?.imagemAuth || '',
                          imagemTicket: botSettings?.imagemTicket || '',
                        }),
                        ...(card.id === 'prices' && {
                          valorBotGen: botSettings?.valorBotGen || '',
                          valorBotAuth: botSettings?.valorBotAuth || '',
                          valorBioPerso: botSettings?.valorBioPerso || '',
                          valorStockEx: botSettings?.valorStockEx || '',
                          valorStockAuto: botSettings?.valorStockAuto || '',
                          valorStockMan: botSettings?.valorStockMan || '',
                          valorBotTicket: botSettings?.valorBotTicket || '',
                        }),
                      })
                      setOpenModal(card.id)
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-white mt-4">{card.title}</CardTitle>
                <CardDescription className="text-zinc-400">{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {card.fields.slice(0, 3).map((field) => {
                    const value = botSettings?.[field.name as keyof BotSettings] as string
                    return (
                      <div key={field.name} className="text-sm">
                        <span className="text-zinc-500">{field.label}:</span>
                        <span className="ml-2 text-zinc-300 font-mono text-xs">
                          {value ? (field.type === 'password' ? '••••••••' : value.substring(0, 20) + (value.length > 20 ? '...' : '')) : 'Não configurado'}
                        </span>
                      </div>
                    )
                  })}
                  {card.fields.length > 3 && (
                    <p className="text-xs text-zinc-500 mt-2">
                      +{card.fields.length - 3} mais campos
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Modal para editar */}
            <Dialog open={openModal === card.id} onOpenChange={(open) => !open && setOpenModal(null)}>
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${card.color}`} />
                    {card.title}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400">{card.description}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(card.onSubmit)} className="space-y-4">
                    {card.fields.map((field) => (
                      <FormField
                        key={field.name}
                        control={form.control}
                        name={field.name as any}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-300">{field.label}</FormLabel>
                            {field.type === 'switch' ? (
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={formField.value}
                                    onCheckedChange={formField.onChange}
                                  />
                                  <span className="text-sm text-zinc-400">{formField.value ? 'Ativado' : 'Desativado'}</span>
                                </div>
                              </FormControl>
                            ) : (
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={field.type === 'password' && !showSecrets[field.name] ? 'password' : 'text'}
                                    className="bg-zinc-900 border-zinc-800 text-white font-mono"
                                    {...formField}
                                  />
                                  {field.type === 'password' && (
                                    <button
                                      type="button"
                                      onClick={() => toggleSecret(field.name)}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                                    >
                                      {showSecrets[field.name] ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </FormControl>
                            )}
                            <FormDescription className="text-zinc-500">{field.description}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpenModal(null)}
                        className="text-zinc-400 hover:text-white"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-white text-black hover:bg-zinc-200"
                      >
                        {isSaving ? (
                          <>
                            <Save className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )
      })}
    </div>
  )
}

