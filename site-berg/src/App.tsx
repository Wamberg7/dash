import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/main'
import { AuthProvider } from '@/stores/auth'
import { AdminRoute } from '@/components/AdminRoute'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Checkout from './pages/Checkout'
import PaymentPix from './pages/PaymentPix'
import BotSetup from './pages/BotSetup'
import BotStatus from './pages/BotStatus'
import MyBots from './pages/MyBots'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import AccessDenied from './pages/AccessDenied'
import Dashboard from './pages/admin/Dashboard'
import BotDatabase from './pages/BotDatabase'
import Legal from './pages/Legal'
import Support from './pages/Support'
import FAQ from './pages/FAQ'
import Pricing from './pages/Pricing'
import Layout from './components/Layout'

const App = () => (
  <AuthProvider>
    <AppProvider>
      <BrowserRouter
        future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment/pix/:orderId" element={<PaymentPix />} />
              <Route path="/bot-setup/:orderId" element={<BotSetup />} />
              <Route path="/bot-status/:orderId" element={<BotStatus />} />
              <Route path="/bot-database/:appId" element={<BotDatabase />} />
              <Route path="/my-bots" element={<MyBots />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/support" element={<Support />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/pricing" element={<Pricing />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/bot-database/:appId"
              element={
                <AdminRoute>
                  <BotDatabase />
                </AdminRoute>
              }
            />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AppProvider>
  </AuthProvider>
)

export default App
