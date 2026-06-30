"use client"

import { lazy, Suspense, type ComponentType } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"

// ─── Lazy-loaded view components ─────────────────────────────────────────────
// Each view is imported individually so Turbopack only compiles the ACTIVE view.
// Named exports require the `.then(m => ({ default: m.X }))` wrapper.

const HomeFeed = lazy(() =>
  import("@/components/marketplace/home-feed").then((m) => ({
    default: m.HomeFeed,
  }))
)
const LoginForm = lazy(() =>
  import("@/components/auth/login-form").then((m) => ({
    default: m.LoginForm,
  }))
)
const RegisterForm = lazy(() =>
  import("@/components/auth/register-form").then((m) => ({
    default: m.RegisterForm,
  }))
)
const VerifyEmail = lazy(() =>
  import("@/components/auth/verify-email").then((m) => ({
    default: m.VerifyEmail,
  }))
)
const ForgotPasswordForm = lazy(() =>
  import("@/components/auth/forgot-password-form").then((m) => ({
    default: m.ForgotPasswordForm,
  }))
)
const ProfileSettings = lazy(() =>
  import("@/components/auth/profile-settings").then((m) => ({
    default: m.ProfileSettings,
  }))
)
const ProductDetail = lazy(() =>
  import("@/components/marketplace/product-detail").then((m) => ({
    default: m.ProductDetail,
  }))
)
const SellProductForm = lazy(() =>
  import("@/components/marketplace/sell-product-form").then((m) => ({
    default: m.SellProductForm,
  }))
)
const SearchView = lazy(() =>
  import("@/components/marketplace/search-view").then((m) => ({
    default: m.SearchView,
  }))
)
const BuyerDashboard = lazy(() =>
  import("@/components/marketplace/buyer-dashboard").then((m) => ({
    default: m.BuyerDashboard,
  }))
)
const FeaturedView = lazy(() =>
  import("@/components/marketplace/featured-view").then((m) => ({
    default: m.FeaturedView,
  }))
)
const CurrenciesView = lazy(() =>
  import("@/components/marketplace/currencies-view").then((m) => ({
    default: m.CurrenciesView,
  }))
)
const MyProducts = lazy(() =>
  import("@/components/vendor/my-products").then((m) => ({
    default: m.MyProducts,
  }))
)
const VendorProfile = lazy(() =>
  import("@/components/vendor/vendor-profile").then((m) => ({
    default: m.VendorProfile,
  }))
)
const VendorDashboard = lazy(() =>
  import("@/components/vendor/vendor-dashboard").then((m) => ({
    default: m.VendorDashboard,
  }))
)
const ChatView = lazy(() =>
  import("@/components/chat/chat-view").then((m) => ({
    default: m.ChatView,
  }))
)
const ChatList = lazy(() =>
  import("@/components/chat/chat-list").then((m) => ({
    default: m.ChatList,
  }))
)
const CheckoutView = lazy(() =>
  import("@/components/payment/checkout-view").then((m) => ({
    default: m.CheckoutView,
  }))
)
const PaymentsView = lazy(() =>
  import("@/components/payments/payments-view").then((m) => ({
    default: m.PaymentsView,
  }))
)
const CotizacionView = lazy(() =>
  import("@/components/cotizacion/cotizacion-view").then((m) => ({
    default: m.CotizacionView,
  }))
)
const MapView = lazy(() =>
  import("@/components/map/map-view").then((m) => ({
    default: m.MapView,
  }))
)
const NotificationsPanel = lazy(() =>
  import("@/components/layout/notifications-panel").then((m) => ({
    default: m.NotificationsPanel,
  }))
)
const CalendarView = lazy(() =>
  import("@/components/calendar/calendar-view").then((m) => ({
    default: m.CalendarView,
  }))
)
const AdminPanel = lazy(() =>
  import("@/components/admin/admin-panel").then((m) => ({
    default: m.AdminPanel,
  }))
)
const AuditPanel = lazy(() =>
  import("@/components/audit/audit-panel").then((m) => ({
    default: m.AuditPanel,
  }))
)
const BackupView = lazy(() =>
  import("@/components/backup/backup-view").then((m) => ({
    default: m.BackupView,
  }))
)
const DownloadsView = lazy(() =>
  import("@/components/downloads/downloads-view").then((m) => ({
    default: m.DownloadsView,
  }))
)
const ReviewsSection = lazy(() =>
  import("@/components/reviews/reviews-section").then((m) => ({
    default: m.ReviewsSection,
  }))
)
const LoyaltyDashboard = lazy(() =>
  import("@/components/loyalty/loyalty-dashboard").then((m) => ({
    default: m.LoyaltyDashboard,
  }))
)
const CreateAdForm = lazy(() =>
  import("@/components/ads/create-ad-form").then((m) => ({
    default: m.CreateAdForm,
  }))
)
const SurveysView = lazy(() =>
  import("@/components/surveys/surveys-view").then((m) => ({
    default: m.SurveysView,
  }))
)
const SuppliersView = lazy(() =>
  import("@/components/marketplace/suppliers-view").then((m) => ({
    default: m.SuppliersView,
  }))
)
const SupplierCatalogsView = lazy(() =>
  import("@/components/marketplace/supplier-catalogs-view").then((m) => ({
    default: m.SupplierCatalogsView,
  }))
)
const WhyUsSection = lazy(() =>
  import("@/components/marketing/why-us-section").then((m) => ({
    default: m.WhyUsSection,
  }))
)
const TermsPage = lazy(() =>
  import("@/components/legal/legal-pages").then((m) => ({
    default: m.TermsPage,
  }))
)
const PrivacyPage = lazy(() =>
  import("@/components/legal/legal-pages").then((m) => ({
    default: m.PrivacyPage,
  }))
)
const RefundPage = lazy(() =>
  import("@/components/legal/legal-pages").then((m) => ({
    default: m.RefundPage,
  }))
)

// ─── Loading spinner shown while a chunk is being fetched ─────────────────────
function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-3">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}

// ─── Auth gate helper ─────────────────────────────────────────────────────────
function AuthGate({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean
  children: React.ReactNode
}) {
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<ViewLoader />}>
        <LoginForm />
      </Suspense>
    )
  }
  return <>{children}</>
}

// ─── Main renderer ────────────────────────────────────────────────────────────
export function ViewRenderer() {
  const { currentView, selectedVendorId } = useAppStore()
  const { isAuthenticated, user } = useAuthStore()

  return (
    <Suspense fallback={<ViewLoader />}>
      {resolveView(currentView, isAuthenticated, user, selectedVendorId)}
    </Suspense>
  )
}

function resolveView(
  view: string,
  isAuthenticated: boolean,
  user: { id?: string } | null,
  selectedVendorId: string | null
): React.ReactNode {
  switch (view) {
    case "login":
      return <LoginForm />
    case "register":
      return <RegisterForm />
    case "verify-email":
      return <VerifyEmail />
    case "forgot-password":
      return <ForgotPasswordForm />
    case "product-detail":
      return <ProductDetail />
    case "sell-product":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <SellProductForm />
        </AuthGate>
      )
    case "edit-product":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <SellProductForm editMode />
        </AuthGate>
      )
    case "my-products":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <MyProducts />
        </AuthGate>
      )
    case "vendor-profile":
      return <VendorProfile />
    case "vendor-dashboard":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <VendorDashboard />
        </AuthGate>
      )
    case "buyer-dashboard":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <BuyerDashboard />
        </AuthGate>
      )
    case "chat":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <ChatView />
        </AuthGate>
      )
    case "chat-list":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <ChatList />
        </AuthGate>
      )
    case "checkout":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <CheckoutView />
        </AuthGate>
      )
    case "map":
      return <MapView />
    case "cotizaciones":
      return <CotizacionView />
    case "cotizacion-detail":
      return <CotizacionView />
    case "notifications":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <NotificationsPanel />
        </AuthGate>
      )
    case "profile":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <ProfileSettings />
        </AuthGate>
      )
    case "settings":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <ProfileSettings />
        </AuthGate>
      )
    case "search":
      return <SearchView />
    case "admin":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <AdminPanel />
        </AuthGate>
      )
    case "terms":
      return <TermsPage />
    case "privacy":
      return <PrivacyPage />
    case "refund":
      return <RefundPage />
    case "downloads":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <DownloadsView />
        </AuthGate>
      )
    case "backup":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <BackupView />
        </AuthGate>
      )
    case "payments":
      return <PaymentsView />
    case "featured":
      return <FeaturedView />
    case "loyalty":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <LoyaltyDashboard />
        </AuthGate>
      )
    case "reviews":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <ReviewsSection
            targetId={selectedVendorId ?? user?.id ?? ""}
          />
        </AuthGate>
      )
    case "calendar":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <CalendarView />
        </AuthGate>
      )
    case "currencies":
      return <CurrenciesView />
    case "audit":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <AuditPanel />
        </AuthGate>
      )
    case "create-ad":
      return (
        <AuthGate isAuthenticated={isAuthenticated}>
          <CreateAdForm />
        </AuthGate>
      )
    case "surveys":
      return <SurveysView />
    case "suppliers":
      return <SuppliersView />
    case "supplier-catalogs":
      return <SupplierCatalogsView />
    case "why-us":
      return <WhyUsSection />
    default:
      return <HomeFeed />
  }
}
