"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import dynamic from "next/dynamic"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { ViewErrorBoundary } from "@/components/layout/view-error-boundary"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"

// ALL dynamic imports with ssr: false to prevent server-side hanging
const Header = dynamic(() => import("@/components/layout/header").then(m => ({ default: m.Header })), { ssr: false })
const Footer = dynamic(() => import("@/components/layout/footer").then(m => ({ default: m.Footer })), { ssr: false })

// Dynamic imports to reduce initial bundle size and prevent server overload
const HomeFeed = dynamic(() => import("@/components/marketplace/home-feed").then(m => ({ default: m.HomeFeed })), { ssr: false, loading: () => <PageLoader /> })
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
const TermsPage = dynamic(() => import("@/components/legal/legal-pages").then(m => ({ default: m.TermsPage })), { ssr: false })
const PrivacyPage = dynamic(() => import("@/components/legal/legal-pages").then(m => ({ default: m.PrivacyPage })), { ssr: false })
const RefundPage = dynamic(() => import("@/components/legal/legal-pages").then(m => ({ default: m.RefundPage })), { ssr: false })
const DownloadsView = dynamic(() => import("@/components/downloads/downloads-view").then(m => ({ default: m.DownloadsView })), { ssr: false })
const BackupView = dynamic(() => import("@/components/backup/backup-view").then(m => ({ default: m.BackupView })), { ssr: false })
const PaymentsView = dynamic(() => import("@/components/payments/payments-view").then(m => ({ default: m.PaymentsView })), { ssr: false })
const FeaturedView = dynamic(() => import("@/components/marketplace/featured-view").then(m => ({ default: m.FeaturedView })), { ssr: false })
const ForgotPasswordForm = dynamic(() => import("@/components/auth/forgot-password-form").then(m => ({ default: m.ForgotPasswordForm })), { ssr: false })
const LoyaltyDashboard = dynamic(() => import("@/components/loyalty/loyalty-dashboard").then(m => ({ default: m.LoyaltyDashboard })), { ssr: false })
const ReviewsSection = dynamic(() => import("@/components/reviews/reviews-section").then(m => ({ default: m.ReviewsSection })), { ssr: false })
const CalendarView = dynamic(() => import("@/components/calendar/calendar-view").then(m => ({ default: m.CalendarView })), { ssr: false })
const CurrenciesView = dynamic(() => import("@/components/marketplace/currencies-view").then(m => ({ default: m.CurrenciesView })), { ssr: false })

// ─── Hydration-safe "mounted" flag ────────────────────────────────────────────
const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

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

// Auth initialization skeleton — shown while the auth state is being resolved
// to prevent a flash of unauthenticated content
function AuthInitSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-5 w-36 hidden sm:block" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content skeleton */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageLoader />
      </main>

      {/* Footer skeleton */}
      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function ProveedorConecta() {
  const { currentView, navigate, selectedVendorId } = useAppStore()
  const { isAuthenticated, user, initAuth, isLoading } = useAuthStore()
  const [showChatbot, setShowChatbot] = useState(false)
  const mounted = useMounted()

  const isSeller = isAuthenticated && user?.role === "SELLER"

  // Check auth on mount using robust initAuth (localStorage + cookie)
  useEffect(() => {
    initAuth()
  }, [initAuth])

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
      case "terms": return <TermsPage />
      case "privacy": return <PrivacyPage />
      case "refund": return <RefundPage />
      case "downloads": return isAuthenticated ? <DownloadsView /> : <LoginForm />
      case "backup": return isAuthenticated ? <BackupView /> : <LoginForm />
      case "payments": return <PaymentsView />
      case "featured": return <FeaturedView />
      case "forgot-password": return <ForgotPasswordForm />
      case "loyalty": return isAuthenticated ? <LoyaltyDashboard /> : <LoginForm />
      case "reviews": return isAuthenticated ? <ReviewsSection targetId={selectedVendorId ?? user?.id ?? ""} /> : <LoginForm />
      case "calendar": return isAuthenticated ? <CalendarView /> : <LoginForm />
      case "currencies": return <CurrenciesView />
      default: return <HomeFeed />
    }
  }

  // Show full-page skeleton during auth initialization to prevent
  // flash of unauthenticated content (login buttons → logged in UI)
  if (!mounted || isLoading) {
    return <AuthInitSkeleton />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ViewErrorBoundary viewName={currentView}>
          {renderView()}
        </ViewErrorBoundary>
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
