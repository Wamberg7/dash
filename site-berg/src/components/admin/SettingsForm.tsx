import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CreditCard, Save, RefreshCw, Eye, EyeOff, ExternalLink, AlertCircle, Settings } from 'lucide-react'
import { useAppStore } from '@/stores/main'
import { CheckoutSettings } from '@/types'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

const settingsSchema = z.object({
  paymentGateway: z.string().min(1),
  apiKey: z.string().optional(),
  enablePix: z.boolean(),
  enableCreditCard: z.boolean(),
  // Mercado Pago fields
  mercadoPagoClientId: z.string().optional(),
  mercadoPagoClientSecret: z.string().optional(),
  mercadoPagoPublicKey: z.string().optional(),
  mercadoPagoAccessToken: z.string().optional(),
  // LivePix fields
  livepixClientId: z.string().optional(),
  livepixClientSecret: z.string().optional(),
  // CentralCart fields
  centralCartApiToken: z.string().optional(),
  additionalFee: z.boolean().optional(),
  }).superRefine((data, ctx) => {
  if (data.paymentGateway === 'MercadoPago') {
    if (!data.mercadoPagoClientId || data.mercadoPagoClientId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Client ID do Mercado Pago é obrigatório',
        path: ['mercadoPagoClientId'],
      })
    }
    if (!data.mercadoPagoClientSecret || data.mercadoPagoClientSecret.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Client Secret do Mercado Pago é obrigatório',
        path: ['mercadoPagoClientSecret'],
      })
    }
    if (!data.mercadoPagoAccessToken || data.mercadoPagoAccessToken.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Access Token do Mercado Pago é obrigatório para processar pagamentos',
        path: ['mercadoPagoAccessToken'],
      })
    }
  } else if (data.paymentGateway === 'LivePix') {
    if (!data.livepixClientId || data.livepixClientId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Client ID do LivePix é obrigatório',
        path: ['livepixClientId'],
      })
    }
    if (!data.livepixClientSecret || data.livepixClientSecret.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Client Secret do LivePix é obrigatório',
        path: ['livepixClientSecret'],
      })
    }
  } else if (data.paymentGateway === 'CentralCart') {
    if (!data.centralCartApiToken || data.centralCartApiToken.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Token da API da CentralCart é obrigatório',
        path: ['centralCartApiToken'],
      })
    }
  } else if (data.paymentGateway !== 'MercadoPago' && data.paymentGateway !== 'LivePix' && data.paymentGateway !== 'CentralCart') {
    if (!data.apiKey || data.apiKey.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Chave de API é obrigatória',
        path: ['apiKey'],
      })
    }
  }
})

export function SettingsForm() {
  const { settings, updateSettings, isLoading } = useAppStore()
  const { toast } = useToast()
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      paymentGateway: settings?.paymentGateway || 'MercadoPago',
      apiKey: settings?.apiKey || '',
      enablePix: settings?.enablePix ?? true,
      enableCreditCard: settings?.enableCreditCard ?? true,
      mercadoPagoClientId: settings?.mercadoPagoClientId || '',
      mercadoPagoClientSecret: settings?.mercadoPagoClientSecret || '',
      mercadoPagoPublicKey: settings?.mercadoPagoPublicKey || '',
      mercadoPagoAccessToken: settings?.mercadoPagoAccessToken || '',
      livepixClientId: settings?.livepixClientId || '',
      livepixClientSecret: settings?.livepixClientSecret || '',
      centralCartApiToken: settings?.centralCartApiToken || '',
      additionalFee: settings?.additionalFee ?? false,
    },
  })

  const selectedGateway = form.watch('paymentGateway')

  useEffect(() => {
    if (settings) {
      const currentValues = form.getValues()
      const newValues = {
        paymentGateway: settings.paymentGateway || 'MercadoPago',
        apiKey: settings.apiKey || '',
        enablePix: settings.enablePix ?? true,
        enableCreditCard: settings.enableCreditCard ?? true,
        mercadoPagoClientId: settings.mercadoPagoClientId || '',
        mercadoPagoClientSecret: settings.mercadoPagoClientSecret || '',
        mercadoPagoPublicKey: settings.mercadoPagoPublicKey || '',
        mercadoPagoAccessToken: settings.mercadoPagoAccessToken || '',
        livepixClientId: settings.livepixClientId || '',
        livepixClientSecret: settings.livepixClientSecret || '',
        centralCartApiToken: settings.centralCartApiToken || '',
        additionalFee: settings.additionalFee ?? false,
      }
      
      // Só reseta se os valores mudaram (comparação mais robusta)
      const currentGateway = currentValues.paymentGateway || 'MercadoPago'
      const newGateway = newValues.paymentGateway || 'MercadoPago'
      
      if (currentGateway !== newGateway || 
          currentValues.mercadoPagoClientId !== newValues.mercadoPagoClientId ||
          currentValues.mercadoPagoClientSecret !== newValues.mercadoPagoClientSecret) {
        form.reset(newValues)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  const toggleSecret = (field: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const [isSaving, setIsSaving] = useState(false)
  const [configuringGateway, setConfiguringGateway] = useState<string | null>(null)

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    setIsSaving(true)
    try {
      // Garantir que os campos obrigatórios estão presentes
      const settingsToSave: CheckoutSettings = {
        paymentGateway: values.paymentGateway,
        apiKey: values.apiKey || '',
        enablePix: values.enablePix,
        enableCreditCard: values.enableCreditCard,
        mercadoPagoClientId: values.mercadoPagoClientId?.trim() || '',
        mercadoPagoClientSecret: values.mercadoPagoClientSecret?.trim() || '',
        mercadoPagoPublicKey: values.mercadoPagoPublicKey?.trim() || '',
        mercadoPagoAccessToken: values.mercadoPagoAccessToken?.trim() || '',
        livepixClientId: values.livepixClientId?.trim() || '',
        livepixClientSecret: values.livepixClientSecret?.trim() || '',
        centralCartApiToken: values.centralCartApiToken?.trim() || '',
        additionalFee: values.additionalFee,
      }

      // Debug: verificar o que está sendo salvo
      console.log('Salvando settings:', {
        gateway: settingsToSave.paymentGateway,
        hasAccessToken: !!settingsToSave.mercadoPagoAccessToken,
        accessTokenLength: settingsToSave.mercadoPagoAccessToken?.length || 0,
        accessTokenPrefix: settingsToSave.mercadoPagoAccessToken?.substring(0, 15) || 'N/A',
        hasLivePixClientId: !!settingsToSave.livepixClientId,
        hasLivePixClientSecret: !!settingsToSave.livepixClientSecret,
        livePixClientIdLength: settingsToSave.livepixClientId?.length || 0,
        livePixClientSecretLength: settingsToSave.livepixClientSecret?.length || 0,
      })

      await updateSettings(settingsToSave)
      toast({
        title: 'Configurações salvas',
        description: 'As alterações foram aplicadas com sucesso.',
      })
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: 'Erro ao salvar',
        description: error?.message || 'Ocorreu um erro ao salvar as configurações. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin text-zinc-500" />
      </div>
    )
  }

  const gateways = [
    {
      id: 'MercadoPago',
      name: 'Mercado Pago',
      logo: 'https://vectorseek.com/wp-content/uploads/2023/08/Mercado-Pago-Icon-Logo-Vector.svg-.png',
      isActive: selectedGateway === 'MercadoPago',
      isConfigured: !!(settings?.mercadoPagoClientId && settings?.mercadoPagoAccessToken),
    },
    {
      id: 'LivePix',
      name: 'LivePix',
      logo: 'https://play-lh.googleusercontent.com/HAN8nvHpwAAb8kPdPzEqm_xNpDbvbOBMcnGM3rL2WtCKsGspAptxj5K9pIHungHEYn5s',
      isActive: selectedGateway === 'LivePix',
      isConfigured: !!(settings?.livepixClientId && settings?.livepixClientSecret),
    },
    {
      id: 'CentralCart',
      name: 'CentralCart',
      logo: 'https://www.centralcart.com.br/logo-central.png',
      isActive: selectedGateway === 'CentralCart',
      isConfigured: !!settings?.centralCartApiToken,
    },
  ]

  const handleGatewayToggle = async (gatewayId: string) => {
    // Atualizar o gateway selecionado
    form.setValue('paymentGateway', gatewayId)
    await form.handleSubmit(onSubmit)()
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          {/* Cards de Gateways */}
          <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {gateways.map((gateway) => (
              <Card key={gateway.id} className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border border-zinc-200 shadow-sm">
                        <img 
                          src={gateway.logo} 
                          alt={gateway.name}
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                      <Switch
                        checked={gateway.isActive}
                        onCheckedChange={() => handleGatewayToggle(gateway.id)}
                      />
                    </div>
                    <Dialog open={configuringGateway === gateway.id} onOpenChange={(open) => setConfiguringGateway(open ? gateway.id : null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="default"
                          className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                        >
                          Configurar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Configurar {gateway.name}</DialogTitle>
                          <DialogDescription className="text-zinc-400">
                            Preencha as credenciais para ativar o {gateway.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {gateway.id === 'MercadoPago' && (
                            <>
                              <FormField
                                control={form.control}
                                name="mercadoPagoClientId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-zinc-300">
                                      Client ID <span className="text-red-400">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        className="bg-zinc-900 border-zinc-800 text-white font-mono"
                                        placeholder="8328788419871354"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="mercadoPagoClientSecret"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-zinc-300">
                                      Client Secret <span className="text-red-400">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Input
                                          type={showSecrets.clientSecret ? 'text' : 'password'}
                                          className="bg-zinc-900 border-zinc-800 text-white font-mono pr-10"
                                          placeholder="kipwdBUOsnh7ZQDe6kElpIZIjiPA7VOY"
                                          {...field}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => toggleSecret('clientSecret')}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                                        >
                                          {showSecrets.clientSecret ? (
                                            <EyeOff className="w-4 h-4" />
                                          ) : (
                                            <Eye className="w-4 h-4" />
                                          )}
                                        </button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="mercadoPagoAccessToken"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-zinc-300">
                                      Access Token <span className="text-red-400">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Input
                                          type={showSecrets.accessToken ? 'text' : 'password'}
                                          className="bg-zinc-900 border-zinc-800 text-white font-mono pr-10"
                                          placeholder="APP_USR-..."
                                          {...field}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => toggleSecret('accessToken')}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                                        >
                                          {showSecrets.accessToken ? (
                                            <EyeOff className="w-4 h-4" />
                                          ) : (
                                            <Eye className="w-4 h-4" />
                                          )}
                                        </button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                          {gateway.id === 'LivePix' && (
                            <>
                              <FormField
                                control={form.control}
                                name="livepixClientId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-zinc-300">
                                      Client ID <span className="text-red-400">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        className="bg-zinc-900 border-zinc-800 text-white font-mono"
                                        placeholder="Seu Client ID"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="livepixClientSecret"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-zinc-300">
                                      Client Secret <span className="text-red-400">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Input
                                          type={showSecrets.livepixClientSecret ? 'text' : 'password'}
                                          className="bg-zinc-900 border-zinc-800 text-white font-mono pr-10"
                                          placeholder="Seu Client Secret"
                                          {...field}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => toggleSecret('livepixClientSecret')}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                                        >
                                          {showSecrets.livepixClientSecret ? (
                                            <EyeOff className="w-4 h-4" />
                                          ) : (
                                            <Eye className="w-4 h-4" />
                                          )}
                                        </button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                          {gateway.id === 'CentralCart' && (
                            <FormField
                              control={form.control}
                              name="centralCartApiToken"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-zinc-300">
                                    Token da API <span className="text-red-400">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type={showSecrets.centralCartApiToken ? 'text' : 'password'}
                                        className="bg-zinc-900 border-zinc-800 text-white font-mono pr-10"
                                        placeholder="Seu token da API da CentralCart"
                                        {...field}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => toggleSecret('centralCartApiToken')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                                      >
                                        {showSecrets.centralCartApiToken ? (
                                          <EyeOff className="w-4 h-4" />
                                        ) : (
                                          <Eye className="w-4 h-4" />
                                        )}
                                      </button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setConfiguringGateway(null)}
                            className="text-zinc-400 hover:text-white"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={async () => {
                              await form.handleSubmit(onSubmit)()
                              setConfiguringGateway(null)
                            }}
                            className="bg-white text-black hover:bg-zinc-200"
                          >
                            Salvar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Provedor</span>
                      <span className="text-sm font-medium text-white">{gateway.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Taxa da plataforma</span>
                      <Badge className="bg-green-600 text-white border-0 text-xs px-2.5 py-1 font-medium">
                        SEM TAXA
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </form>
      </Form>
    </div>
  )
}
