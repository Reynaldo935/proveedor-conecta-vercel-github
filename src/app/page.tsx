"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"

// Dynamic imports to reduce initial bundle size and prevent server overload
const HomeFeed = dynamic(() => import("@/components/marketplace/home-feed").then(m => ({ default: m.HomeFeed })), { ssr: true })
const LoginForm = dynamic(() => import("@/components/auth/login-form").then(m => ({ default: m.LoginForm })), { ssr: false })
const RegisterForm = dynamic(() => import("@/components/auth/register-form").then(m => ({ default: m.RegisterForm })), { ssr: false })
const VerifyEmail = dynamic(() => import("@/components/auth/verify-email").then(m => ({ default: m.VerifyEmail })), { ssr: false })
const ProductDetail = dynamic(() => import("@/components/marketplace/product-detail").then(m => ({ default: m.ProductDetail })), { ssr: false })
const SellProductForm = dynamic(() => import("@/components/marketplace/sell-product-form").then(m => ({ default: m.SellProductForm })), { ssr: false })
const MyProducts = dynamic(() => import("@/components/vendor/my-products").then(m => ({ default: m.MyProducts })), { ssr: false })
const VendorProfile = dynamic(() => import("@/components/vendor/vendor-profile").then(m => ({ default: m.VendorProfile })), { ssr: false })
const VendorDashboard = dynamic(() => import("@/components/vendor/vendor-dashboard").then(m => ({ default: m.VendorDashboard })), { ssr: false })
const BuyerDashboard = dynamic(() => import("@/components/marketplace/buyer-dashboard").then(m => ({ default: m.BuyerDashboard })), { ssr: false })
const ChatView = dynamic(() => import("@/components/chat/chat-view").then(m => ({ default: m.ChatView })), { ssr: false })
const ChatList = dynamic(() => import("@/components/chat/chat-list").then(m => ({ default: m.ChatList })), { ssr: false })
const CheckoutView = dynamic(() => import("@/components/payment/checkout-view").then(m => ({ default: m.CheckoutView })), { ssr: false })
const MapView = dynamic(() => import("@/components/map/map-view").then(m => ({ default: m.MapView })), { ssr: false })
const CotizacionView = dynamic(() => import("@/components/cotizacion/cotizacion-view").then(m => ({ default: m.CotizacionView })), { ssr: false })
const NotificationsPanel = dynamic(() => import("@/components/layout/notifications-panel").then(m => ({ default: m.NotificationsPanel })), { ssr: false })
const ProfileSettings = dynamic(() => import("@/components/auth/profile-settings").then(m => ({ default: m.ProfileSettings })), { ssr: false })
const SearchView = dynamic(() => import("@/components/marketplace/search-view").then(m => ({ default: m.SearchView })), { ssr: false })
const AIChatbot = dynamic(() => import("@/components/chatbot/ai-chatbot").then(m => ({ default: m.AIChatbot })), { ssr: false })
const AdminPanel = dynamic(() => import("@/components/admin/admin-panel").then(m => ({ default: m.AdminPanel })), { ssr: false })

// Loading fallback
function PageLoader() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProveedorConecta() {
  const { currentView, navigate } = useAppStore()
  const { setUser, isAuthenticated, user } = useAuthStore()
  const [showChatbot, setShowChatbot] = useState(false)

  const isSeller = isAuthenticated && user?.role === "SELLER"

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          if (data.success) setUser(data.data)
          else setUser(null)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
    }
    checkAuth()
  }, [setUser])

  const renderView = () => {
    switch (currentView) {
      case "login": return <LoginForm />
      case "register": return <RegisterForm />
      case "verify-email": return <VerifyEmail />
      case "product-detail": return <ProductDetail />
      case "sell-product": return isAuthenticated ? <SellProductForm /> : <LoginForm />
      case "edit-product": return isAuthenticated ? <SellProductForm editMode /> : <LoginForm />
      case "my-products": return isAuthenticated ? <MyProducts /> : <LoginForm />
      case "vendor-profile": return <VendorProfile />
      case "vendor-dashboard": return isAuthenticated ? <VendorDashboard /> : <LoginForm />
      case "buyer-dashboard": return isAuthenticated ? <BuyerDashboard /> : <LoginForm />
      case "chat": return isAuthenticated ? <ChatView /> : <LoginForm />
      case "chat-list": return isAuthenticated ? <ChatList /> : <LoginForm />
      case "checkout": return isAuthenticated ? <CheckoutView /> : <LoginForm />
      case "map": return <MapView />
      case "cotizaciones": return <CotizacionView />
      case "notifications": return isAuthenticated ? <NotificationsPanel /> : <LoginForm />
      case "profile": return isAuthenticated ? <ProfileSettings /> : <LoginForm />
      case "settings": return isAuthenticated ? <ProfileSettings /> : <LoginForm />
      case "search": return <SearchView />
      case "admin": return isAuthenticated ? <AdminPanel /> : <LoginForm />
      default: return <HomeFeed />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderView()}
      </main>
      <Footer />
      <AIChatbot isOpen={showChatbot} onToggle={() => setShowChatbot(!showChatbot)} />

      {/* Floating Vender Button for authenticated sellers */}
      {isSeller && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.08, boxShadow: "0 8px 30px rgba(26, 82, 118, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("sell-product")}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-semibold shadow-lg"
          style={{
            background: "linear-gradient(135deg, #1A5276, #2E86C1)",
            boxShadow: "0 4px 20px rgba(26, 82, 118, 0.35)",
          }}
          aria-label="Vender producto"
        >
          <Plus className="h-5 w-5" />
          <span>Vender</span>
        </motion.button>
      )}
    </div>
  )
}
