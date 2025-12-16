import { useEffect } from 'react'
import { Hero } from '@/components/sections/Hero'
import { Clients } from '@/components/sections/Clients'
import { Products } from '@/components/sections/Products'
import { Features } from '@/components/sections/Features'
import { SalesSecurity } from '@/components/sections/SalesSecurity'
import { FAQ } from '@/components/sections/FAQ'
import { Privacy } from '@/components/sections/Privacy'
import { AppShowcase } from '@/components/sections/AppShowcase'
import { useAppStore } from '@/stores/main'

const Index = () => {
  const { incrementVisits } = useAppStore()

  useEffect(() => {
    window.scrollTo(0, 0)
    incrementVisits()
  }, [incrementVisits])

  return (
    <div className="flex flex-col w-full bg-black min-h-screen">
      <Hero />
      <Clients />
      <Products />
      <Features />
      <SalesSecurity />
      <FAQ />
      <Privacy />
      <AppShowcase />
    </div>
  )
}

export default Index
