import { Apple, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function AppShowcase() {
  return (
    <section className="py-24 bg-black overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Phone Mockup - Left Side */}
          <div className="relative mx-auto lg:mx-0 w-full max-w-[360px]">
            <div className="relative border-8 border-zinc-800 bg-black rounded-[3rem] h-[700px] overflow-hidden shadow-2xl">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-black rounded-b-xl z-20" />

              {/* Screen Content */}
              <div className="h-full w-full bg-black flex flex-col p-6 pt-16">
                <div className="mb-8 flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center text-black font-bold text-sm">
                    ES
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <h3 className="text-2xl font-bold text-white">
                    Bem-vindo de volta
                  </h3>
                  <p className="text-zinc-500 text-sm">
                    Entre na sua conta para continuar
                  </p>
                </div>

                <div className="space-y-4">
                  <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white h-12 font-medium">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                    </svg>
                    Discord
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-black px-2 text-zinc-500">ou</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400 ml-1">Email</label>
                    <Input
                      placeholder="seo@mail.com"
                      className="bg-zinc-900/50 border-zinc-800 h-12 text-white placeholder:text-zinc-600"
                    />
                  </div>

                  <Button className="w-full bg-zinc-100 hover:bg-white text-black h-12 font-medium mt-4">
                    Acessar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Pronto para <br /> Começar?
            </h2>
            <p className="text-zinc-400 text-lg md:text-xl max-w-md mb-10">
              Monitore e receba notificações das suas vendas em tempo real
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                className="h-14 px-8 bg-white text-black hover:bg-zinc-200 rounded-xl"
              >
                <Apple className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="text-[10px] uppercase leading-none font-semibold">
                    Download para
                  </div>
                  <div className="text-base font-bold leading-none mt-0.5">
                    iOS
                  </div>
                </div>
              </Button>
              <Button
                size="lg"
                className="h-14 px-8 bg-white text-black hover:bg-zinc-200 rounded-xl"
              >
                <Play className="mr-2 h-5 w-5 fill-current" />
                <div className="text-left">
                  <div className="text-[10px] uppercase leading-none font-semibold">
                    Download para
                  </div>
                  <div className="text-base font-bold leading-none mt-0.5">
                    Android
                  </div>
                </div>
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <Avatar key={i} className="border-2 border-black w-10 h-10">
                    <AvatarImage
                      src={`https://img.usecurling.com/ppl/thumbnail?gender=${i % 2 === 0 ? 'female' : 'male'}&seed=${i + 10}`}
                    />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
                <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-[10px] font-bold text-white">
                  +995
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Junte-se agora a</p>
                <p className="text-sm font-bold text-white">+1000 usuários</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
