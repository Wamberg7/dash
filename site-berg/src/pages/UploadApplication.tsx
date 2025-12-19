import { SquareCloudUpload } from '@/components/admin/SquareCloudUpload'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { useState, useEffect } from 'react'

export default function UploadApplication() {
  const [activeTab, setActiveTab] = useState('upload')

  // Garantir que o activeTab seja 'upload' quando estiver nesta página
  useEffect(() => {
    setActiveTab('upload')
  }, [])

  return (
    <div className="min-h-screen bg-black text-foreground">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />

      <div className="lg:pl-64 min-h-screen flex flex-col pb-20 lg:pb-0">
        <AdminHeader />

        <main className="flex-1 p-4 md:p-8 space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Enviar Aplicação
            </h1>
            <p className="text-zinc-400">
              Faça upload de um arquivo ZIP com seu projeto para hospedar na SquareCloud.
            </p>
          </div>

          <SquareCloudUpload />
        </main>
      </div>
    </div>
  )
}

