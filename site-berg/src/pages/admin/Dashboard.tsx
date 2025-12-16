import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DashboardStats } from '@/components/admin/DashboardStats'
import { BotStats } from '@/components/admin/BotStats'
import { BotSettingsForm } from '@/components/admin/BotSettingsForm'
import { Tabs, TabsContent } from '@/components/ui/tabs'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-black text-foreground">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="pl-64 min-h-screen flex flex-col">
        <AdminHeader />

        <main className="flex-1 p-8 space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {activeTab === 'overview' && 'Visão Geral'}
              {activeTab === 'bots' && 'Estatísticas dos Bots'}
              {activeTab === 'bot' && 'Configurações'}
            </h1>
            <p className="text-zinc-400">
              {activeTab === 'overview' &&
                'Acompanhe o desempenho da sua loja em tempo real.'}
              {activeTab === 'bots' &&
                'Visualize informações e estatísticas em tempo real dos seus bots na SquareCloud.'}
              {activeTab === 'bot' &&
                'Configure o token da API da SquareCloud.'}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsContent value="overview" className="space-y-8 mt-0">
              <DashboardStats />
              <BotStats />
            </TabsContent>

            <TabsContent value="bots" className="space-y-8 mt-0">
              <BotStats />
            </TabsContent>

            <TabsContent value="bot" className="mt-0">
              <BotSettingsForm />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
