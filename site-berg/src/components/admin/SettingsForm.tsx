import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CreditCard, Save, RefreshCw, Eye, EyeOff, ExternalLink } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

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
  } else if (data.paymentGateway !== 'MercadoPago' && data.paymentGateway !== 'LivePix') {
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

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Configurações de Checkout</CardTitle>
        <CardDescription className="text-zinc-400">
          Gerencie as integrações de pagamento e métodos aceitos na loja.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="paymentGateway"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">
                      Gateway de Pagamento
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectValue placeholder="Selecione o gateway" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="MercadoPago">
                          Mercado Pago
                        </SelectItem>
                        <SelectItem value="LivePix">LivePix</SelectItem>
                        <SelectItem value="Stripe">Stripe</SelectItem>
                        <SelectItem value="PagarMe">Pagar.me</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-zinc-500">
                          {field.value ? (
                        <span>
                          Gateway configurado: <span className="text-green-400 font-semibold">
                            {field.value === 'MercadoPago' ? 'Mercado Pago' : 
                             field.value === 'LivePix' ? 'LivePix' :
                             field.value === 'Stripe' ? 'Stripe' : 
                             field.value === 'PagarMe' ? 'Pagar.me' : field.value}
                          </span>
                        </span>
                      ) : (
                        'Provedor que processará as transações.'
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Mercado Pago Configuration */}
            {selectedGateway === 'MercadoPago' && (
              <div className="space-y-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    Mercado Pago
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Não sabe configurar o Mercado Pago?{' '}
                    <a
                      href="https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/checkout-customization/preferences"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Confira o passo a passo
                    </a>
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                        <FormDescription className="text-zinc-500">
                          ID da sua aplicação no Mercado Pago.
                        </FormDescription>
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
                        <FormDescription className="text-zinc-500">
                          Chave secreta da sua aplicação no Mercado Pago.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mercadoPagoAccessToken"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
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
                        <FormDescription className="text-zinc-500">
                          Token de acesso obrigatório para processar pagamentos. Obtenha em https://www.mercadopago.com.br/developers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="additionalFee"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Taxa adicional para o cliente
                        </FormLabel>
                        <FormDescription className="text-zinc-500">
                          Repasse taxas do gateway para o cliente final.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* LivePix Configuration */}
            {selectedGateway === 'LivePix' && (
              <div className="space-y-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    LivePix
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Configure suas credenciais OAuth2 do LivePix.{' '}
                    <a
                      href="https://docs.livepix.gg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Confira a documentação
                    </a>
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                        <FormDescription className="text-zinc-500">
                          Client ID da sua aplicação no LivePix.
                        </FormDescription>
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
                        <FormDescription className="text-zinc-500">
                          Client Secret da sua aplicação no LivePix.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="additionalFee"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Taxa adicional para o cliente
                        </FormLabel>
                        <FormDescription className="text-zinc-500">
                          Repasse taxas do gateway para o cliente final.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Other Gateways Configuration */}
            {selectedGateway !== 'MercadoPago' && selectedGateway !== 'LivePix' && (
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">API Key</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showSecrets.apiKey ? 'text' : 'password'}
                          className="bg-zinc-900 border-zinc-800 text-white font-mono pr-10"
                          placeholder="sk_test_..."
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecret('apiKey')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                        >
                          {showSecrets.apiKey ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormDescription className="text-zinc-500">
                      Chave secreta de produção ou teste.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Métodos de Pagamento
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="enablePix"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Pix
                        </FormLabel>
                        <FormDescription className="text-zinc-500">
                          Aceitar pagamentos instantâneos via Pix.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enableCreditCard"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Cartão de Crédito
                        </FormLabel>
                        <FormDescription className="text-zinc-500">
                          Aceitar pagamentos via cartão de crédito.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="bg-white text-black hover:bg-zinc-200"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
