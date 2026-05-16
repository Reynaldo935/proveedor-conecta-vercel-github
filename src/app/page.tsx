"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAppStore, type AppView } from "@/store/app-store"
import { useAuthStore, type User } from "@/store/auth-store"
import { useChatStore } from "@/store/chat-store"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HomeFeed } from "@/components/marketplace/home-feed"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { ProductDetail } from "@/components/marketplace/product-detail"
import { SellProductForm } from "@/components/marketplace/sell-product-form"
import { MyProducts } from "@/components/vendor/my-products"
import { VendorProfile } from "@/components/vendor/vendor-profile"
import { VendorDashboard } from "@/components/vendor/vendor-dashboard"
import { BuyerDashboard } from "@/components/marketplace/buyer-dashboard"
import { ChatView } from "@/components/chat/chat-view"
import { ChatList } from "@/components/chat/chat-list"
import { CheckoutView } from "@/components/payment/checkout-view"
import { MapView } from "@/components/map/map-view"
import { CotizacionView } from "@/components/cotizacion/cotizacion-view"
import { NotificationsPanel } from "@/components/layout/notifications-panel"
import { ProfileSettings } from "@/components/auth/profile-settings"
import { SearchView } from "@/components/marketplace/search-view"
import { AIChatbot } from "@/components/chatbot/ai-chatbot"

export default function ProveedorConecta() {
  const { currentView } = useAppStore()
  const { setUser, setLoading, isAuthenticated } = useAuthStore()
  const [showChatbot, setShowChatbot] = useState(false)

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
    </div>
  )
}
