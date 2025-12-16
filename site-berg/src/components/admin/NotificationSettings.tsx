import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Bell, MessageSquare, Mail, Smartphone, Save } from 'lucide-react'
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
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'

const notificationSchema = z.object({
  discordSalesPublic: z.boolean(),
  discordSalesAdmin: z.boolean(),
  discordStockOut: z.boolean(),
  discordAffiliateWithdrawal: z.boolean(),
  appSalesNotification: z.boolean(),
  emailStoreExpiration: z.boolean(),
})

export function NotificationSettings() {
  const { settings, updateSettings, isLoading } = useAppStore()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      discordSalesPublic: settings?.discordSalesPublic ?? false,
      discordSalesAdmin: settings?.discordSalesAdmin ?? false,
      discordStockOut: settings?.discordStockOut ?? false,
      discordAffiliateWithdrawal: settings?.discordAffiliateWithdrawal ?? false,
      appSalesNotification: settings?.appSalesNotification ?? false,
      emailStoreExpiration: settings?.emailStoreExpiration ?? false,
    },
  })

  // Atualizar form quando settings mudarem
  useEffect(() => {
    if (settings) {
      form.reset({
        discordSalesPublic: settings.discordSalesPublic ?? false,
        discordSalesAdmin: settings.discordSalesAdmin ?? false,
        discordStockOut: settings.discordStockOut ?? false,
        discordAffiliateWithdrawal: settings.discordAffiliateWithdrawal ?? false,
        appSalesNotification: settings.appSalesNotification ?? false,
        emailStoreExpiration: settings.emailStoreExpiration ?? false,
      })
    }
  }, [settings, form])

  const onSubmit = async (values: z.infer<typeof notificationSchema>) => {
    setIsSaving(true)
    try {
      const updatedSettings: CheckoutSettings = {
        ...settings!,
        ...values,
      }
      await updateSettings(updatedSettings)
      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências de notificação foram atualizadas.',
      })
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="pt-6">
          <div className="text-center text-zinc-400">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Configurar notificações
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Receba notificações sobre suas vendas e outros eventos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Discord Category */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-zinc-400" />
                <h3 className="text-lg font-semibold text-white">Discord</h3>
              </div>

              <FormField
                control={form.control}
                name="discordSalesPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-white">
                        Notificação de vendas (pública)
                      </FormLabel>
                      <FormDescription className="text-zinc-500">
                        Receba notificações de vendas no canal público do Discord.
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
                name="discordSalesAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-white">
                        Notificação de vendas (administrador)
                      </FormLabel>
                      <FormDescription className="text-zinc-500">
                        Receba notificações detalhadas de vendas em um canal privado.
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
                name="discordStockOut"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-white">
                        Notificação de estoque esgotado
                      </FormLabel>
                      <FormDescription className="text-zinc-500">
                        Seja notificado quando um produto ficar sem estoque.
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
                name="discordAffiliateWithdrawal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-white">
                        Notificação de saque (afiliado)
                      </FormLabel>
                      <FormDescription className="text-zinc-500">
                        Seja notificado quando um afiliado solicitar saque.
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

            <Separator className="bg-zinc-800" />

            {/* App Category */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-zinc-400" />
                <h3 className="text-lg font-semibold text-white">App</h3>
              </div>

              <FormField
                control={form.control}
                name="appSalesNotification"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-white">
                        Notificação de vendas
                      </FormLabel>
                      <FormDescription className="text-zinc-500">
                        Receba notificações de vendas no aplicativo.
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

            <Separator className="bg-zinc-800" />

            {/* Email Category */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-zinc-400" />
                <h3 className="text-lg font-semibold text-white">Email</h3>
              </div>

              <FormField
                control={form.control}
                name="emailStoreExpiration"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-white">
                        Aviso de expiração da loja
                      </FormLabel>
                      <FormDescription className="text-zinc-500">
                        Receba avisos importantes sobre a expiração da sua loja.
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

            <div className="flex justify-end pt-4">
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
                    Salvar configurações
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

