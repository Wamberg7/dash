import { Star } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const testimonials = [
  {
    name: 'Ana Silva',
    role: 'CEO, TechStart',
    image: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2',
    content:
      'O Berg transformou completamente nossa presença digital. O novo site não é apenas bonito, mas extremamente funcional.',
    rating: 5,
  },
  {
    name: 'Carlos Mendes',
    role: 'Diretor, CreativeAg',
    image: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=3',
    content:
      'Profissionalismo e técnica impecáveis. O projeto foi entregue antes do prazo e superou todas as expectativas.',
    rating: 5,
  },
  {
    name: 'Juliana Costa',
    role: 'Fundadora, EcoLife',
    image: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=4',
    content:
      'A comunicação foi excelente durante todo o processo. Recomendo fortemente para quem busca qualidade.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-24 bg-black border-t border-zinc-900"
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Depoimentos
          </h2>
          <p className="text-zinc-400 text-lg">
            O que dizem aqueles que já confiaram no meu trabalho.
          </p>
        </div>

        <div className="relative px-12">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={index}
                  className="pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <div className="h-full bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-white text-white"
                        />
                      ))}
                    </div>
                    <p className="text-zinc-300 text-sm mb-6 flex-grow leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-zinc-900">
                      <Avatar className="h-10 w-10 border border-zinc-800">
                        <AvatarImage
                          src={testimonial.image}
                          alt={testimonial.name}
                        />
                        <AvatarFallback className="bg-zinc-800 text-zinc-400">
                          {testimonial.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white text-sm">
                          {testimonial.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="bg-black border-zinc-800 text-white hover:bg-zinc-900 -left-4" />
            <CarouselNext className="bg-black border-zinc-800 text-white hover:bg-zinc-900 -right-4" />
          </Carousel>
        </div>
      </div>
    </section>
  )
}
