import { useState } from 'react'
import { X, Send, ExternalLink, Search, Home, MessageSquare, HelpCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'help'>('home')

  const handleWhatsApp = () => {
    // Substitua pela URL do seu WhatsApp
    window.open('https://wa.me/5511999999999', '_blank')
  }

  const handleDiscord = () => {
    // Substitua pela URL do seu Discord
    window.open('https://discord.gg/your-server', '_blank')
  }

  const handleSendMessage = () => {
    // Implementar lógica de envio de mensagem
    console.log('Enviar mensagem')
  }

  const handleFAQClick = (question: string) => {
    // Implementar lógica para mostrar resposta da FAQ
    console.log('FAQ:', question)
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-white text-black hover:bg-zinc-200 shadow-lg"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[600px] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-[#10B981] px-4 py-4 relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <div className="w-6 h-6 bg-[#10B981] rounded"></div>
          </div>
          <span className="text-white font-semibold">centralcart</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-white hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-black font-semibold text-lg">Olá 👋</div>
        <div className="text-black font-semibold text-lg">Como podemos ajudar?</div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white p-4 space-y-4">
        {activeTab === 'home' && (
          <>
            {/* Envie uma mensagem */}
            <div
              onClick={handleSendMessage}
              className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors"
            >
              <div>
                <div className="font-semibold text-black mb-1">Envie uma mensagem</div>
                <div className="text-sm text-zinc-600">Estaremos online novamente ainda hoje</div>
              </div>
              <Send className="h-5 w-5 text-[#10B981]" />
            </div>

            {/* Suporte via WhatsApp */}
            <div
              onClick={handleWhatsApp}
              className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors"
            >
              <div className="font-semibold text-black">Suporte via WhatsApp</div>
              <div className="w-6 h-6 bg-[#10B981] rounded flex items-center justify-center">
                <ExternalLink className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Suporte via Discord */}
            <div
              onClick={handleDiscord}
              className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors"
            >
              <div className="font-semibold text-black">Suporte via Discord</div>
              <div className="w-6 h-6 bg-[#10B981] rounded flex items-center justify-center">
                <ExternalLink className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-black">Qual é a sua dúvida?</div>
                <Search className="h-5 w-5 text-black" />
              </div>
              <div className="space-y-2">
                <div
                  onClick={() => handleFAQClick('O que é CentralCart?')}
                  className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-black">O que é CentralCart?</span>
                  <div className="w-5 h-5 border-2 border-[#10B981] rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                  </div>
                </div>
                <div
                  onClick={() => handleFAQClick('O que posso vender na CentralCart?')}
                  className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-black">O que posso vender na CentralCart?</span>
                  <div className="w-5 h-5 border-2 border-[#10B981] rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'messages' && (
          <div className="text-center text-zinc-600 py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
            <p>Nenhuma mensagem ainda</p>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="text-center text-zinc-600 py-8">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
            <p>Central de Ajuda</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-zinc-200 bg-white flex">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
            activeTab === 'home' ? 'text-[#10B981]' : 'text-zinc-600'
          }`}
        >
          <div className={`w-6 h-6 mb-1 ${activeTab === 'home' ? 'bg-[#10B981]' : 'bg-zinc-400'} rounded flex items-center justify-center`}>
            {activeTab === 'home' ? (
              <Home className="h-4 w-4 text-white" />
            ) : (
              <div className="w-2 h-2 bg-white rounded-full"></div>
            )}
          </div>
          <span className="text-xs font-medium">Início</span>
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
            activeTab === 'messages' ? 'text-[#10B981]' : 'text-zinc-600'
          }`}
        >
          <MessageSquare className={`h-5 w-5 mb-1 ${activeTab === 'messages' ? 'text-[#10B981]' : 'text-zinc-600'}`} />
          <span className="text-xs font-medium">Mensagens</span>
        </button>
        <button
          onClick={() => setActiveTab('help')}
          className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
            activeTab === 'help' ? 'text-[#10B981]' : 'text-zinc-600'
          }`}
        >
          <HelpCircle className={`h-5 w-5 mb-1 ${activeTab === 'help' ? 'text-[#10B981]' : 'text-zinc-600'}`} />
          <span className="text-xs font-medium">Ajuda</span>
        </button>
      </div>

      {/* Minimize Button */}
      <button
        onClick={() => setIsOpen(false)}
        className="absolute bottom-[-50px] right-0 w-12 h-12 bg-[#10B981] rounded-full flex items-center justify-center shadow-lg"
      >
        <ChevronDown className="h-6 w-6 text-white" />
      </button>
    </div>
  )
}

