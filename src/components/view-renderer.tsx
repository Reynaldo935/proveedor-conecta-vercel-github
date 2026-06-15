"use client"

import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { VerifyEmail } from "@/components/auth/verify-email"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { ProfileSettings } from "@/components/auth/profile-settings"
import { HomeFeed } from "@/components/marketplace/home-feed"
import { ProductDetail } from "@/components/marketplace/product-detail"
import { SellProductForm } from "@/components/marketplace/sell-product-form"
import { SearchView } from "@/components/marketplace/search-view"
import { BuyerDashboard } from "@/components/marketplace/buyer-dashboard"
import { FeaturedView } from "@/components/marketplace/featured-view"
import { CurrenciesView } from "@/components/marketplace/currencies-view"
import { MyProducts } from "@/components/vendor/my-products"
import { VendorProfile } from "@/components/vendor/vendor-profile"
import { VendorDashboard } from "@/components/vendor/vendor-dashboard"
import { ChatView } from "@/components/chat/chat-view"
import { ChatList } from "@/components/chat/chat-list"
import { CheckoutView } from "@/components/payment/checkout-view"
import { PaymentsView } from "@/components/payments/payments-view"
import { CotizacionView } from "@/components/cotizacion/cotizacion-view"
import { MapView } from "@/components/map/map-view"
import { NotificationsPanel } from "@/components/layout/notifications-panel"
import { CalendarView } from "@/components/calendar/calendar-view"
import { AdminPanel } from "@/components/admin/admin-panel"
import { AuditPanel } from "@/components/audit/audit-panel"
import { BackupView } from "@/components/backup/backup-view"
import { DownloadsView } from "@/components/downloads/downloads-view"
import { ReviewsSection } from "@/components/reviews/reviews-section"
import { LoyaltyDashboard } from "@/components/loyalty/loyalty-dashboard"
import { CreateAdForm } from "@/components/ads/create-ad-form"
import { TermsPage, PrivacyPage, RefundPage } from "@/components/legal/legal-pages"

export function ViewRenderer() {
  const { currentView, selectedVendorId } = useAppStore()
  const { isAuthenticated, user } = useAuthStore()

  const authGate = (view: React.ReactNode) => isAuthenticated ? view : <LoginForm />

  switch (currentView) {
    case "login": return <LoginForm />
    case "register": return <RegisterForm />
    case "verify-email": return <VerifyEmail />
    case "forgot-password": return <ForgotPasswordForm />
    case "product-detail": return <ProductDetail />
    case "sell-product": return authGate(<SellProductForm />)
    case "edit-product": return authGate(<SellProductForm editMode />)
    case "my-products": return authGate(<MyProducts />)
    case "vendor-profile": return <VendorProfile />
    case "vendor-dashboard": return authGate(<VendorDashboard />)
    case "buyer-dashboard": return authGate(<BuyerDashboard />)
    case "chat": return authGate(<ChatView />)
    case "chat-list": return authGate(<ChatList />)
    case "checkout": return authGate(<CheckoutView />)
    case "map": return <MapView />
    case "cotizaciones": return <CotizacionView />
    case "notifications": return authGate(<NotificationsPanel />)
    case "profile": return authGate(<ProfileSettings />)
    case "settings": return authGate(<ProfileSettings />)
    case "search": return <SearchView />
    case "admin": return authGate(<AdminPanel />)
    case "terms": return <TermsPage />
    case "privacy": return <PrivacyPage />
    case "refund": return <RefundPage />
    case "downloads": return authGate(<DownloadsView />)
    case "backup": return authGate(<BackupView />)
    case "payments": return <PaymentsView />
    case "featured": return <FeaturedView />
    case "loyalty": return authGate(<LoyaltyDashboard />)
    case "reviews": return authGate(<ReviewsSection targetId={selectedVendorId ?? user?.id ?? ""} />)
    case "calendar": return authGate(<CalendarView />)
    case "currencies": return <CurrenciesView />
    case "audit": return authGate(<AuditPanel />)
    case "create-ad": return authGate(<CreateAdForm />)
    default: return <HomeFeed />
  }
}
