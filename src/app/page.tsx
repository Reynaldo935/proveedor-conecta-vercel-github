"use client"

import { useEffect, useState, useSyncExternalStore, lazy, Suspense } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { ViewErrorBoundary } from "@/components/layout/view-error-boundary"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"

// ─── Lazy-loaded heavy components ────────────────────────────────────────────
// ViewRenderer is only loaded AFTER mount + auth init, avoiding the OOM crash
// that occurs when Turbopack tries to compile all 30+ view components at once.
const LazyViewRenderer = lazy(() =>
  import("@/components/view-renderer").then((m) => ({
    default: m.ViewRenderer,
  }))
)

const LazyAIChatbot = lazy(() =>
  import("@/components/chatbot/ai-chatbot").then((m) => ({
    default: m.AIChatbot,
  }))
)

// ─── Hydration-safe "mounted" flag ────────────────────────────────────────────
const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Loading fallback for the main view area ─────────────────────────────────
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

// ─── Minimal chatbot placeholder ─────────────────────────────────────────────
function ChatbotLoader() {
  return null
}

// ─── Auth initialization skeleton (shown before mount / during auth check) ────
function AuthInitSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6 p-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <footer className="border-t bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
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

// ─── Main application component ──────────────────────────────────────────────
export default function ProveedorConecta() {
  const { currentView, navigate } = useAppStore()
  const { isAuthenticated, user, initAuth, isLoading } = useAuthStore()
  const [showChatbot, setShowChatbot] = useState(false)
  const mounted = useMounted()

  const isSeller = isAuthenticated && user?.role === "SELLER"

  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Before mount or while checking auth, show the skeleton — no JS heavy loads
  if (!mounted || isLoading) {
    return <AuthInitSkeleton />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ViewErrorBoundary viewName={currentView}>
          <Suspense fallback={<ViewLoader />}>
            <LazyViewRenderer />
          </Suspense>
        </ViewErrorBoundary>
      </main>
      <Footer />

      {/* AI Chatbot — lazy loaded so it doesn't compete with the view chunk */}
      <Suspense fallback={<ChatbotLoader />}>
        <LazyAIChatbot isOpen={showChatbot} onToggle={() => setShowChatbot(!showChatbot)} />
      </Suspense>

      {/* Floating "Vender" button for sellers */}
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
