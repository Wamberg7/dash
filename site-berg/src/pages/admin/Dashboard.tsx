import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DashboardStats } from '@/components/admin/DashboardStats'
import { BotStats } from '@/components/admin/BotStats'
import { BotSettingsForm } from '@/components/admin/BotSettingsForm'
import { BotActivityLog } from '@/components/admin/BotActivityLog'
import { SquareCloudUpload } from '@/components/admin/SquareCloudUpload'
import { ProductManager } from '@/components/admin/ProductManager'
import { OrderList } from '@/components/admin/OrderList'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { Tabs, TabsContent } from '@/components/ui/tabs'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-black text-foreground">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />

      <div className="lg:pl-64 min-h-screen flex flex-col pb-20 lg:pb-0">
        <AdminHeader />

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {activeTab === 'overview' && 'Visão Geral'}
              {activeTab === 'products' && 'Produtos'}
              {activeTab === 'orders' && 'Pedidos'}
              {activeTab === 'payment' && 'Gateway'}
              {activeTab === 'bots' && 'Estatísticas dos Bots'}
              {activeTab === 'upload' && 'Enviar Aplicação'}
              {activeTab === 'bot' && 'Configurações do Bot'}
              {activeTab === 'activity' && 'Registro de Atividades'}
            </h1>
            <p className="text-sm md:text-base text-zinc-400">
              {activeTab === 'overview' &&
                'Acompanhe o desempenho da sua loja em tempo real.'}
              {activeTab === 'products' &&
                'Gerencie seus produtos, preços e arquivos ZIP dos bots.'}
              {activeTab === 'orders' &&
                'Visualize e gerencie todos os pedidos dos clientes.'}
              {activeTab === 'payment' &&
                'Configure os gateways de pagamento (Mercado Pago, LivePix) e métodos de pagamento disponíveis.'}
              {activeTab === 'bots' &&
                'Visualize informações e estatísticas em tempo real dos seus bots na SquareCloud.'}
              {activeTab === 'upload' &&
                'Faça upload de um arquivo ZIP com seu projeto para hospedar na SquareCloud.'}
              {activeTab === 'bot' &&
                'Configure o token da API da SquareCloud e outras configurações do bot.'}
              {activeTab === 'activity' &&
                'Histórico de comandos, alterações e operações realizadas nos bots.'}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsContent value="overview" className="space-y-8 mt-0">
              <DashboardStats />
              <BotStats />
            </TabsContent>

            <TabsContent value="products" className="mt-0">
              <ProductManager />
            </TabsContent>

            <TabsContent value="orders" className="mt-0">
              <OrderList />
            </TabsContent>

            <TabsContent value="payment" className="mt-0">
              <SettingsForm />
            </TabsContent>

            <TabsContent value="bots" className="space-y-8 mt-0">
              <BotStats />
            </TabsContent>

            <TabsContent value="upload" className="mt-0">
              <SquareCloudUpload />
            </TabsContent>

            <TabsContent value="bot" className="mt-0">
              <BotSettingsForm />
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <BotActivityLog />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
