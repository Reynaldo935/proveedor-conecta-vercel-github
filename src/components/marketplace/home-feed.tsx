"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useAppStore, type AppView } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import {
  Heart,
  MapPin,
  Bookmark,
  Store,
  Search,
  Star,
  ChevronUp,
  Sparkles,
  Users,
  Package,
  CreditCard,
  MessageCircle,
  Share2,
  Send,
  Zap,
  Eye,
  TrendingUp,
  X,
} from "lucide-react"
import { PRODUCT_CATEGORIES, NICARAGUA_DEPARTMENTS } from "@/lib/validators"
import { authFetch } from "@/lib/client-auth"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { WeatherWidget } from "@/components/weather/weather-widget"

// ─── Product Interface ────────────────────────────────────────────────────────
interface Product {
  id: string
  title: string
  description: string
  price: number
  discountPrice: number | null
  discountPercent: number | null
  category: string
  images: string[]
  tags: string
  quantity: number
  likeCount: number
  seller: {
    id: string
    name: string
    avatar: string
    address: string
    businessProfile?: { businessName: string; logo: string } | null
  }
}

// ─── Category Icons Map ──────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  "Construcción y Ferretería": "🏗️",
  "Agricultura y Ganadería": "🌾",
  "Tecnología y Electrónica": "💻",
  "Alimentos y Bebidas": "🍽️",
  "Textil y Calzado": "👕",
  "Salud y Farmacia": "💊",
  "Hogar y Muebles": "🏠",
  "Transporte y Logística": "🚛",
  "Educación y Papelería": "📚",
  "Servicios Profesionales": "💼",
  "Artesanías y Manualidades": "🎨",
  "Belleza y Cuidado Personal": "💅",
  "Deportes y Recreación": "⚽",
  "Energía y Combustible": "⚡",
  "Impresión y Diseño": "🖨️",
  "Otros": "📦",
}

// ─── Department Emojis Map ───────────────────────────────────────────────────
const DEPARTMENT_EMOJIS: Record<string, string> = {
  "Managua": "🏙️",
  "León": "⛪",
  "Granada": "🏛️",
  "Masaya": "🎭",
  "Carazo": "🌊",
  "Rivas": "🏖️",
  "Chinandega": "🏭",
  "Estelí": "🏔️",
  "Matagalpa": "☕",
  "Jinotega": "🌲",
  "Nueva Segovia": "⛏️",
  "Madriz": "🏺",
  "Boaco": "🐄",
  "Chontales": "🤠",
  "Río San Juan": "🐊",
  "Región Autónoma Caribe Norte": "🌴",
  "Región Autónoma Caribe Sur": "🏝️",
}

// ─── Animated Counter Component ──────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])

  return (
    <span suppressHydrationWarning>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

// ─── Product Card Skeleton (Facebook-style) ──────────────────────────────────
function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border/50 shadow-sm">
      <Skeleton className="h-52 w-full rounded-none" />
      <CardContent className="p-3 space-y-2.5">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 flex-1 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Featured Carousel Skeleton ──────────────────────────────────────────────
function FeaturedSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="min-w-[260px] max-w-[260px]">
          <Card className="overflow-hidden border border-border/50 shadow-sm">
            <Skeleton className="h-36 w-full rounded-none" />
            <CardContent className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-20" />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

// ─── Rating Stars Component ──────────────────────────────────────────────────
function RatingStars({ likeCount }: { likeCount: number }) {
  const stars = Math.min(5, Math.max(1, Math.ceil(likeCount / 3)))
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN HOME FEED COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export function HomeFeed() {
  const { navigate, selectedCategory, setSelectedCategory, setSearchQuery, selectedLocation, setSelectedLocation } = useAppStore()
  const { user, isAuthenticated } = useAuthStore()

  // ─── State ──────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set())
  const [messagingProductId, setMessagingProductId] = useState<string | null>(null)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // ─── Load Products ──────────────────────────────────────────────────────
  const loadProducts = useCallback(async (reset = false) => {
    if (!reset && !hasMore) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (!reset && cursor) params.set("cursor", cursor)
      if (selectedCategory) params.set("category", selectedCategory)
      params.set("limit", "20")

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()

      if (data.success) {
        const newProducts = data.data
        if (reset) {
          setProducts(newProducts)
        } else {
          setProducts(prev => [...prev, ...newProducts])
        }
        setCursor(data.nextCursor ?? null)
        setHasMore(!!data.nextCursor && newProducts.length > 0)
      }
    } catch (error) {
      console.error("Load products error:", error)
    } finally {
      setLoading(false)
    }
  }, [cursor, selectedCategory, hasMore])

  useEffect(() => {
    setProducts([])
    setCursor(null)
    setHasMore(true)
    loadProducts(true)
  }, [selectedCategory])

  // ─── Infinite Scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadProducts()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasMore, loading, loadProducts])

  // ─── Scroll to top visibility ────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // ─── Toggle Like (uses authFetch) ───────────────────────────────────────
  const toggleLike = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error("Inicia sesión para dar like")
      navigate("login")
      return
    }
    try {
      const res = await authFetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (data.success) {
        const isLiked = data.data.liked
        setLikedProducts(prev => {
          const next = new Set(prev)
          if (isLiked) next.add(productId)
          else next.delete(productId)
          return next
        })
        setProducts(prev =>
          prev.map(p =>
            p.id === productId
              ? { ...p, likeCount: isLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1) }
              : p
          )
        )
      }
    } catch {
      toast.error("Error al dar like")
    }
  }

  // ─── Toggle Save (uses authFetch) ───────────────────────────────────────
  const toggleSave = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error("Inicia sesión para guardar")
      navigate("login")
      return
    }
    try {
      const res = await authFetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (data.success) {
        setSavedProducts(prev => {
          const next = new Set(prev)
          if (next.has(productId)) {
            next.delete(productId)
            toast.success("Eliminado de guardados")
          } else {
            next.add(productId)
            toast.success("Guardado exitosamente")
          }
          return next
        })
      }
    } catch {
      toast.error("Error al guardar")
    }
  }

  // ─── Share Product ──────────────────────────────────────────────────────
  const handleShare = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    const url = `${window.location.origin}/product/${product.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Enlace copiado al portapapeles")
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      toast.success("Enlace copiado al portapapeles")
    }
  }

  // ─── Send Message (creates chat room) ──────────────────────────────────
  const handleSendMessage = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error("Inicia sesión para enviar mensajes")
      navigate("login")
      return
    }
    if (user?.id === product.seller.id) {
      toast.error("No puedes enviarte un mensaje a ti mismo")
      return
    }
    setMessagingProductId(product.id)
    try {
      const res = await authFetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: product.seller.id,
          productId: product.id,
          message: `Hola, estoy interesado en "${product.title}"`,
        }),
      })
      const data = await res.json()
      if (data.success && data.data?.id) {
        toast.success("Chat creado, redirigiendo...")
        navigate("chat", { roomId: data.data.id })
      } else {
        toast.error("No se pudo crear el chat")
      }
    } catch {
      toast.error("Error al crear el chat")
    } finally {
      setMessagingProductId(null)
    }
  }

  // ─── Format Price ───────────────────────────────────────────────────────
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(price)
  }

  // ─── Search Submit ──────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim())
      navigate("search")
    }
  }

  // ─── Featured products (trending/discounted) ────────────────────────────
  const featuredProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        if (a.discountPercent && !b.discountPercent) return -1
        if (!a.discountPercent && b.discountPercent) return 1
        return b.likeCount - a.likeCount
      })
      .slice(0, 10)
  }, [products])

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-10">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION - Clean Facebook Marketplace style
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative rounded-2xl overflow-hidden" suppressHydrationWarning>
        {/* Background gradient - Nicaragua colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A5276] via-[#2E86C1] to-[#154360]" />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-dots)" />
          </svg>
        </div>

        {/* Gold accent orbs */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#F4D03F]/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-[#F4D03F]/8 blur-2xl" />

        {/* Content */}
        <div className="relative z-10 p-6 md:p-10 lg:p-14">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm border border-white/10">
                <span className="text-base">🇳🇮</span> Hecho en Nicaragua
                <Sparkles className="h-3.5 w-3.5 text-[#F4D03F]" />
              </div>
              <div className="inline-flex items-center gap-2 bg-[#F4D03F]/15 rounded-full px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm border border-[#F4D03F]/20">
                🏆 Hackathon Nicaragua 2026 – 10ª Edición – Siempre más allá
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight text-white" suppressHydrationWarning>
              Proveedor<span className="text-white">Conecta</span>
              <br />
              <span className="text-[#F4D03F] drop-shadow-lg">Nicaragua</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-white/90 mb-6 max-w-lg leading-relaxed">
              Conectamos emprendedores y MIPYMES con proveedores de insumos, materia prima y servicios en toda Nicaragua.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar productos, proveedores..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 h-11 rounded-xl text-base shadow-lg"
                />
              </div>
              <Button
                type="submit"
                size="default"
                className="h-11 px-5 bg-[#2E86C1] hover:bg-[#2471A3] text-white font-semibold rounded-xl shadow-lg"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                size="default"
                className="bg-white text-[#1A5276] hover:bg-white/90 font-semibold rounded-xl h-11 shadow-lg"
                onClick={() => navigate(isAuthenticated ? "sell-product" : "register")}
              >
                <Store className="h-4 w-4 mr-2" /> Vender
              </Button>
              <Button
                size="default"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm rounded-xl h-11"
                onClick={() => navigate("map")}
              >
                <MapPin className="h-4 w-4 mr-2" /> Explorar Mapa
              </Button>
            </div>
          </div>

          {/* Animated Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/15">
            {[
              { icon: <Users className="h-4 w-4" />, value: 500, suffix: "+", label: "Proveedores" },
              { icon: <Package className="h-4 w-4" />, value: 2000, suffix: "+", label: "Productos" },
              { icon: <MapPin className="h-4 w-4" />, value: 17, suffix: "", label: "Departamentos" },
              { icon: <CreditCard className="h-4 w-4" />, value: 5, suffix: "", label: "Métodos de Pago" },
            ].map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-white/70 mb-0.5">
                  {stat.icon}
                  <span className="text-xl md:text-2xl font-bold text-white" suppressHydrationWarning>
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </span>
                </div>
                <p className="text-xs text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0067B8] via-white to-[#0067B8]" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WEATHER WIDGET - Inline card below hero
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-md">
        <WeatherWidget />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CATEGORY FILTER BAR - Horizontal scrollable chips
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Categorías
          </h2>
          {selectedCategory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory("")}
              className="h-7 text-xs gap-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Limpiar
            </Button>
          )}
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {/* "All" chip */}
            <button
              onClick={() => setSelectedCategory("")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span>🏷️</span> Todos
            </button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span>{CATEGORY_ICONS[cat] || "📦"}</span>
                <span className="max-w-[140px] truncate">{cat}</span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Active filter indicator */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2"
            >
              <Badge variant="default" className="bg-primary rounded-lg text-xs">
                {CATEGORY_ICONS[selectedCategory] || "📦"} {selectedCategory}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          DEPARTMENT FILTER - Horizontal scrollable location chips
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            📍 Departamentos
          </h2>
          {selectedLocation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLocation("")}
              className="h-7 text-xs gap-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Limpiar
            </Button>
          )}
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {NICARAGUA_DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                onClick={() => {
                  if (selectedLocation === dept) {
                    setSelectedLocation("")
                  } else {
                    setSelectedLocation(dept)
                    setSearchQuery(dept)
                    navigate("search")
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all shrink-0 ${
                  selectedLocation === dept
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span>{DEPARTMENT_EMOJIS[dept] || "📍"}</span>
                <span className="max-w-[120px] truncate">{dept}</span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          "FOR YOU" TRENDING SECTION - Featured carousel
          ═══════════════════════════════════════════════════════════════════ */}
      {featuredProducts.length > 0 && !selectedCategory && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#F4D03F]" /> Para Ti
            </h2>
            <Badge variant="secondary" className="rounded-lg bg-[#F4D03F]/10 text-[#D4AC0D] border border-[#F4D03F]/20 text-xs">
              <Sparkles className="h-3 w-3 mr-1" /> Trending
            </Badge>
          </div>

          {loading && products.length === 0 ? (
            <FeaturedSkeleton />
          ) : (
            <Carousel
              opts={{ align: "start", loop: true }}
              className="w-full"
            >
              <CarouselContent className="-ml-3">
                {featuredProducts.map((product) => (
                  <CarouselItem key={product.id} className="pl-3 basis-[260px]">
                    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                      <Card
                        className="overflow-hidden border border-border/50 shadow-sm cursor-pointer group"
                        onClick={() => navigate("product-detail", { productId: product.id })}
                      >
                        <div className="relative h-36 bg-muted overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-primary/10 to-primary/5">
                              {CATEGORY_ICONS[product.category] || "📦"}
                            </div>
                          )}
                          {product.discountPercent && (
                            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-md shadow-sm font-bold">
                              -{product.discountPercent}%
                            </Badge>
                          )}
                          <Badge className="absolute top-2 right-2 bg-[#F4D03F] text-[#1C2833] text-[10px] px-1.5 py-0.5 rounded-md shadow-sm">
                            <Star className="h-2.5 w-2.5 mr-0.5" fill="currentColor" /> TOP
                          </Badge>
                        </div>
                        <CardContent className="p-3 space-y-1.5">
                          <h3 className="font-medium text-sm line-clamp-1">{product.title}</h3>
                          <div className="flex items-baseline gap-1.5">
                            {product.discountPrice ? (
                              <>
                                <span className="text-sm font-bold text-red-500">
                                  {formatPrice(product.discountPrice)}
                                </span>
                                <span className="text-xs line-through text-muted-foreground">
                                  {formatPrice(product.price)}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-foreground">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={product.seller.businessProfile?.logo || product.seller.avatar || undefined} />
                              <AvatarFallback className="text-[6px] bg-primary text-primary-foreground">
                                {(product.seller.businessProfile?.businessName || product.seller.name)?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {product.seller.businessProfile?.businessName || product.seller.name}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 -translate-x-1/2 shadow-lg bg-background border-0" />
              <CarouselNext className="right-0 translate-x-1/2 shadow-lg bg-background border-0" />
            </Carousel>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PRODUCT GRID - Facebook Marketplace Style Cards
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedCategory ? `Productos en ${selectedCategory}` : "Productos Recientes"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </span>
        </div>

        {/* Loading Skeletons */}
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">No se encontraron productos</p>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
              Intenta con otra categoría o explora todos los productos disponibles.
            </p>
            <Button
              variant="default"
              className="bg-primary rounded-xl"
              onClick={() => setSelectedCategory("")}
            >
              Ver todos los productos
            </Button>
          </motion.div>
        ) : (
          /* Product Grid - Facebook Marketplace Style */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isLiked={likedProducts.has(product.id)}
                isSaved={savedProducts.has(product.id)}
                isMessaging={messagingProductId === product.id}
                onLike={toggleLike}
                onSave={toggleSave}
                onShare={handleShare}
                onMessage={handleSendMessage}
                onNavigate={navigate}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        )}

        {/* Load more trigger */}
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          <AnimatePresence>
            {loading && products.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-muted-foreground text-sm"
              >
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                Cargando más productos...
              </motion.div>
            )}
          </AnimatePresence>
          {!hasMore && products.length > 0 && (
            <p className="text-sm text-muted-foreground">No hay más productos</p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SCROLL TO TOP BUTTON
          ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 transition-colors"
            aria-label="Volver arriba"
          >
            <ChevronUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCT CARD - Facebook Marketplace Style
// ═════════════════════════════════════════════════════════════════════════════
function ProductCard({
  product,
  isLiked,
  isSaved,
  isMessaging,
  onLike,
  onSave,
  onShare,
  onMessage,
  onNavigate,
  formatPrice,
}: {
  product: Product
  isLiked: boolean
  isSaved: boolean
  isMessaging: boolean
  onLike: (e: React.MouseEvent, productId: string) => void
  onSave: (e: React.MouseEvent, productId: string) => void
  onShare: (e: React.MouseEvent, product: Product) => void
  onMessage: (e: React.MouseEvent, product: Product) => void
  onNavigate: (view: AppView, params?: Record<string, string>) => void
  formatPrice: (price: number) => string
}) {
  const [imgError, setImgError] = useState(false)
  const hasImage = product.images && product.images.length > 0 && !imgError

  const sellerName = product.seller.businessProfile?.businessName || product.seller.name
  const sellerInitial = sellerName?.charAt(0)?.toUpperCase() || "?"
  const sellerAvatar = product.seller.businessProfile?.logo || product.seller.avatar
  const locationText = product.seller.address?.split(",").slice(-1)[0]?.trim()

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Card
        className="overflow-hidden cursor-pointer border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200 bg-card"
        onClick={() => onNavigate("product-detail", { productId: product.id })}
      >
        {/* ─── Image Area ─────────────────────────────────────────────── */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {hasImage ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-primary/10 to-primary/5">
              {CATEGORY_ICONS[product.category] || "📦"}
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {/* Discount Badge */}
          {product.discountPercent && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-md shadow-sm font-bold hover:bg-red-500">
              -{product.discountPercent}%
            </Badge>
          )}

          {/* Like Button (Heart) - Top Right */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            className={`absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
              isLiked
                ? "bg-red-50 text-red-500"
                : "bg-white/90 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100"
            }`}
            onClick={(e) => onLike(e, product.id)}
            aria-label={isLiked ? "Quitar like" : "Dar like"}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500" : ""}`} />
          </motion.button>

          {/* Save Button (Bookmark) - Below Like */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            className={`absolute top-11 right-2 h-8 w-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
              isSaved
                ? "bg-[#F4D03F]/10 text-[#D4AC0D]"
                : "bg-white/90 text-gray-500 hover:text-[#D4AC0D] opacity-0 group-hover:opacity-100"
            }`}
            onClick={(e) => onSave(e, product.id)}
            aria-label={isSaved ? "Quitar de guardados" : "Guardar"}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-[#D4AC0D]" : ""}`} />
          </motion.button>

          {/* Share Button */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            className="absolute top-[4.75rem] right-2 h-8 w-8 rounded-full bg-white/90 text-gray-500 hover:text-primary flex items-center justify-center shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
            onClick={(e) => onShare(e, product)}
            aria-label="Compartir"
          >
            <Share2 className="h-4 w-4" />
          </motion.button>
        </div>

        {/* ─── Content Area ────────────────────────────────────────────── */}
        <CardContent className="p-3 space-y-1.5">
          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            {product.discountPrice ? (
              <>
                <span className="text-base font-bold text-foreground">
                  {formatPrice(product.discountPrice)}
                </span>
                <span className="text-xs line-through text-muted-foreground">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-foreground">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-medium text-sm line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* Rating Stars */}
          <div className="flex items-center gap-1.5">
            <RatingStars likeCount={product.likeCount} />
            <span className="text-[11px] text-muted-foreground">({product.likeCount})</span>
          </div>

          {/* Seller & Location */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <Avatar className="h-5 w-5 ring-1 ring-border/50">
              {sellerAvatar ? (
                <AvatarImage src={sellerAvatar} />
              ) : null}
              <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                {sellerInitial}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate flex-1">
              {sellerName}
            </span>
            {locationText && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                <MapPin className="h-3 w-3" />
                {locationText}
              </span>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-1.5 pt-1">
            {/* Like */}
            <button
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                isLiked
                  ? "bg-red-50 text-red-500"
                  : "bg-muted text-muted-foreground hover:text-red-500 hover:bg-red-50/50"
              }`}
              onClick={(e) => onLike(e, product.id)}
              aria-label="Like"
            >
              <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-red-500" : ""}`} />
            </button>

            {/* Save */}
            <button
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                isSaved
                  ? "bg-[#F4D03F]/10 text-[#D4AC0D]"
                  : "bg-muted text-muted-foreground hover:text-[#D4AC0D] hover:bg-[#F4D03F]/10"
              }`}
              onClick={(e) => onSave(e, product.id)}
              aria-label="Guardar"
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "fill-[#D4AC0D]" : ""}`} />
            </button>

            {/* Share */}
            <button
              className="h-7 w-7 rounded-full bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
              onClick={(e) => onShare(e, product)}
              aria-label="Compartir"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>

            {/* Send Message - Main CTA */}
            <button
              className="flex-1 h-7 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => onMessage(e, product)}
              disabled={isMessaging}
              aria-label="Enviar mensaje"
            >
              {isMessaging ? (
                <div className="animate-spin h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <>
                  <MessageCircle className="h-3 w-3" />
                  <span className="hidden sm:inline">Mensaje</span>
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
