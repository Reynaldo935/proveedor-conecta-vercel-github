"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
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
  Filter,
  Bookmark,
  TrendingUp,
  Store,
  ShoppingBag,
  ArrowRight,
  Search,
  Shield,
  CreditCard,
  Star,
  ChevronUp,
  Sparkles,
  Users,
  Package,
  CheckCircle,
  Zap,
  Quote,
  ArrowUpRight,
  UserPlus,
  MessageCircle,
  Play,
} from "lucide-react"
import { PRODUCT_CATEGORIES, PAYMENT_METHODS, NICARAGUA_DEPARTMENTS } from "@/lib/validators"
import { toast } from "sonner"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"

// ─── Product Interface (KEEP) ────────────────────────────────────────────────
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

// ─── Category Icons Map (KEEP) ───────────────────────────────────────────────
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

// ─── Testimonials Data ───────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "María Elena Gutiérrez",
    business: "Distribuidora Gutiérrez",
    location: "Managua",
    text: "ProveedorConecta transformó mi negocio. Ahora accedo a proveedores de todo el país desde mi celular. ¡Increíble!",
    avatar: "MG",
    rating: 5,
  },
  {
    name: "Carlos Roberto Blandón",
    business: "Ferretería Blandón",
    location: "León",
    text: "Los precios competitivos y la variedad de productos me ahorran tiempo y dinero. Mi ferretería nunca estuvo mejor surtida.",
    avatar: "CB",
    rating: 5,
  },
  {
    name: "Ana Lucía Torres",
    business: "Artesanías Torres",
    location: "Masaya",
    text: "Como artesana, poder comprar materia prima al por mayor cambió todo. Ahora exporto mis productos con mejores márgenes.",
    avatar: "AT",
    rating: 5,
  },
  {
    name: "José Manuel Espinoza",
    business: "AgroServicios Espinoza",
    location: "Matagalpa",
    text: "La plataforma conecta a productores del campo con compradores de la ciudad. Es justo lo que Nicaragua necesitaba.",
    avatar: "JE",
    rating: 4,
  },
  {
    name: "Patricia Ruiz Aguilar",
    business: "TechShop Nicaragua",
    location: "Granada",
    text: "Empecé vendiendo accesorios tech y ahora tengo clientes en los 17 departamentos. ProveedorConecta es mi aliado comercial.",
    avatar: "PR",
    rating: 5,
  },
]

// ─── Animated Counter Component ──────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(target)
  const ref = useRef<HTMLSpanElement>(null)
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
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

// ─── Floating Particles ──────────────────────────────────────────────────────
function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 4,
    })), []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/10"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// ─── Product Card Skeleton (IMPROVED) ────────────────────────────────────────
function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <Skeleton className="h-56 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14 ml-auto" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Featured Carousel Skeleton ──────────────────────────────────────────────
function FeaturedSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="min-w-[280px] max-w-[280px]">
          <Card className="overflow-hidden border-0 shadow-md">
            <Skeleton className="h-40 w-full rounded-none" />
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

// ═════════════════════════════════════════════════════════════════════════════
// MAIN HOME FEED COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export function HomeFeed() {
  const { navigate, selectedCategory, setSelectedCategory, setSearchQuery, selectedLocation, setSelectedLocation } = useAppStore()
  const { user, isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Parallax scroll
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 400], [0, 150])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3])

  // ─── Load Products (KEEP logic) ──────────────────────────────────────────
  const loadProducts = useCallback(async (reset = false) => {
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
        setCursor(data.nextCursor)
        setHasMore(!!data.nextCursor)
      }
    } catch (error) {
      console.error("Load products error:", error)
    } finally {
      setLoading(false)
    }
  }, [cursor, selectedCategory])

  useEffect(() => {
    setProducts([])
    setCursor(null)
    loadProducts(true)
  }, [selectedCategory])

  // ─── Infinite Scroll (KEEP logic) ────────────────────────────────────────
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

  // ─── Toggle Like (KEEP logic) ────────────────────────────────────────────
  const toggleLike = async (productId: string) => {
    if (!isAuthenticated) {
      toast.error("Inicia sesión para dar like")
      navigate("login")
      return
    }
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (data.success) {
        setLikedProducts(prev => {
          const next = new Set(prev)
          if (data.data.liked) {
            next.add(productId)
          } else {
            next.delete(productId)
          }
          return next
        })
        setProducts(prev =>
          prev.map(p =>
            p.id === productId
              ? { ...p, likeCount: data.data.liked ? p.likeCount + 1 : p.likeCount - 1 }
              : p
          )
        )
      }
    } catch (error) {
      console.error("Like error:", error)
    }
  }

  // ─── Toggle Save ─────────────────────────────────────────────────────────
  const toggleSave = async (productId: string) => {
    if (!isAuthenticated) {
      toast.error("Inicia sesión para guardar")
      navigate("login")
      return
    }
    try {
      const res = await fetch("/api/saved", {
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
    } catch (error) {
      console.error("Save error:", error)
    }
  }

  // ─── Format Price (KEEP logic) ───────────────────────────────────────────
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(price)
  }

  // ─── Search Submit ───────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim())
      navigate("search")
    }
  }

  // ─── Featured products (first 8 with highest likes or discounts) ─────────
  const featuredProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        if (a.discountPercent && !b.discountPercent) return -1
        if (!a.discountPercent && b.discountPercent) return 1
        return b.likeCount - a.likeCount
      })
      .slice(0, 8)
  }, [products])

  // ─── Main categories ─────────────────────────────────────────────────────
  const mainCategories = PRODUCT_CATEGORIES.slice(0, 8)

  // ─── Framer Motion Variants ──────────────────────────────────────────────
  const staggerContainer = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07 },
    },
  }

  const staggerItem = {
    hidden: { opacity: 1, y: 0 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  }

  const cardHover = {
    rest: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
    hover: {
      y: -8,
      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
      transition: { duration: 0.3, ease: "easeOut" },
    },
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div ref={containerRef} className="space-y-10 pb-10">

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: HERO - Full-width gradient with particles & parallax
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className="relative rounded-2xl overflow-hidden"
        style={{ y: heroY }}
      >
        {/* Background gradient - Nicaragua colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A5276] via-[#2E86C1] to-[#154360]" />

        {/* Nicaragua flag stripe accents */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0067B8] via-white to-[#0067B8]" />

        {/* SVG Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="nic-hero-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="25" fill="none" stroke="white" strokeWidth="0.8" />
                <path d="M25 40 L40 25 L55 40 L40 55Z" fill="none" stroke="white" strokeWidth="0.4" />
                <circle cx="40" cy="40" r="4" fill="white" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#nic-hero-pattern)" />
          </svg>
        </div>

        {/* Animated floating particles */}
        <FloatingParticles />

        {/* Gold accent orbs */}
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#F4D03F]/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#F4D03F]/8 blur-2xl"
          animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 p-8 md:p-12 lg:p-16"
          style={{ opacity: heroOpacity }}
        >
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-5 backdrop-blur-sm border border-white/10"
            >
              <span className="text-base">🇳🇮</span> Hecho en Nicaragua
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#F4D03F]" />
              </motion.span>
            </motion.div>

            {/* Title */}
            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-poppins)] mb-4 leading-tight text-white"
            >
              Proveedor
              <span className="text-white">Conecta</span>
              <br />
              <span className="text-[#F4D03F] drop-shadow-lg">Nicaragua</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-lg md:text-xl text-white/90 mb-8 max-w-lg leading-relaxed"
            >
              Conectamos emprendedores y MIPYMES con proveedores de insumos, materia prima y servicios en toda Nicaragua.
            </motion.p>

            {/* Search Bar in Hero */}
            <motion.form
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              onSubmit={handleSearch}
              className="flex gap-2 mb-8 max-w-lg"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar productos, proveedores..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 h-12 rounded-xl text-base shadow-lg"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 px-6 bg-[#2E86C1] hover:bg-[#2471A3] text-white font-semibold rounded-xl shadow-lg"
              >
                <Search className="h-5 w-5" />
              </Button>
            </motion.form>

            {/* CTA Buttons */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex flex-wrap gap-3"
            >
              <Button
                size="lg"
                className="bg-[#2E86C1] hover:bg-[#2471A3] text-white font-semibold shadow-lg rounded-xl h-12"
                onClick={() => navigate(isAuthenticated ? "sell-product" : "register")}
              >
                <Store className="h-5 w-5 mr-2" /> Vender en la Plataforma
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm rounded-xl h-12"
                onClick={() => navigate("map")}
              >
                <MapPin className="h-5 w-5 mr-2" /> Explorar Mapa
              </Button>
            </motion.div>
          </div>

          {/* Animated Stats */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/15"
          >
            {[
              { icon: <Users className="h-5 w-5" />, value: 500, suffix: "+", label: "Proveedores" },
              { icon: <Package className="h-5 w-5" />, value: 2000, suffix: "+", label: "Productos" },
              { icon: <MapPin className="h-5 w-5" />, value: 17, suffix: "", label: "Departamentos" },
              { icon: <CreditCard className="h-5 w-5" />, value: 5, suffix: "", label: "Métodos de Pago" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                className="text-center sm:text-left"
              >
                <div className="flex items-center justify-center sm:justify-start gap-2 text-white/70 mb-1">
                  {stat.icon}
                  <span className="text-2xl md:text-3xl font-bold text-white">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </span>
                </div>
                <p className="text-sm text-white/70">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom Nicaragua flag stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0067B8] via-white to-[#0067B8]" />
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: CATEGORIES - Animated cards with hover effects
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Categorías
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl"
          >
            <Filter className="h-4 w-4 mr-1" /> {showFilters ? "Ocultar" : "Ver Todas"}
          </Button>
        </div>

        {/* Category cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3"
        >
          {mainCategories.map((cat) => (
            <motion.button
              key={cat}
              variants={staggerItem}
              whileHover={{ y: -6, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-300 ${
                selectedCategory === cat
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                  : "border-transparent bg-card hover:border-primary/30 shadow-sm hover:shadow-md"
              }`}
            >
              <span className="text-3xl">{CATEGORY_ICONS[cat] || "📦"}</span>
              <span className="text-xs font-medium text-center leading-tight line-clamp-2">{cat}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Active filter indicator */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <Badge variant="default" className="bg-primary rounded-lg">
                {selectedCategory}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCategory("")}>
                Limpiar filtro
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extended filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 border-0 shadow-md">
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_CATEGORIES.map((cat, i) => (
                    <motion.div
                      key={cat}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Button
                        variant={selectedCategory === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-xl ${selectedCategory === cat ? "bg-primary" : ""}`}
                      >
                        {CATEGORY_ICONS[cat] || "📦"} {cat}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2.5: DEPARTAMENTOS DE NICARAGUA
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)] flex items-center gap-2">
            📍 Explora por Departamento
          </h2>
          <Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary border border-primary/20">
            <MapPin className="h-3 w-3 mr-1" /> 17 Departamentos
          </Badge>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3"
        >
          {NICARAGUA_DEPARTMENTS.map((dept) => (
            <motion.button
              key={dept}
              variants={staggerItem}
              whileHover={{ y: -6, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelectedLocation(selectedLocation === dept ? "" : dept)
                if (selectedLocation !== dept) {
                  setSearchQuery(dept)
                  navigate("search")
                }
              }}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-300 ${
                selectedLocation === dept
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                  : "border-transparent bg-card hover:border-primary/30 shadow-sm hover:shadow-md"
              }`}
            >
              <span className="text-3xl">{DEPARTMENT_EMOJIS[dept] || "📍"}</span>
              <span className="text-xs font-medium text-center leading-tight line-clamp-2">{dept}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Active location filter indicator */}
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <Badge variant="default" className="bg-primary rounded-lg">
                {DEPARTMENT_EMOJIS[selectedLocation] || "📍"} {selectedLocation}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLocation("")}>
                Limpiar ubicación
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: FEATURED/TRENDING CAROUSEL
          ═══════════════════════════════════════════════════════════════════ */}
      {featuredProducts.length > 0 && !selectedCategory && (
        <motion.section
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)] flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#F4D03F]" /> Destacados y Ofertas
            </h2>
            <Badge variant="secondary" className="rounded-lg bg-[#F4D03F]/10 text-[#F4D03F] border border-[#F4D03F]/20">
              <Sparkles className="h-3 w-3 mr-1" /> Trending
            </Badge>
          </div>

          {loading && products.length === 0 ? (
            <FeaturedSkeleton />
          ) : (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {featuredProducts.map((product) => (
                  <CarouselItem key={product.id} className="pl-4 basis-[280px]">
                    <motion.div
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Card
                        className="overflow-hidden border-0 shadow-md cursor-pointer group"
                        onClick={() => navigate("product-detail", { productId: product.id })}
                      >
                        <div className="relative h-40 bg-muted overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-primary/10 to-primary/5">
                              {CATEGORY_ICONS[product.category] || "📦"}
                            </div>
                          )}
                          {/* Discount pulse badge */}
                          {product.discountPercent && (
                            <motion.div
                              animate={{ scale: [1, 1.08, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <Badge className="absolute top-2 left-2 bg-volcan text-volcan-foreground text-xs px-2 py-0.5 rounded-lg shadow-md">
                                -{product.discountPercent}%
                              </Badge>
                            </motion.div>
                          )}
                          {/* Featured badge */}
                          <Badge className="absolute top-2 right-2 bg-[#F4D03F] text-[#1C2833] text-[10px] px-1.5 py-0.5 rounded-lg shadow-sm">
                            <Star className="h-2.5 w-2.5 mr-0.5" fill="currentColor" /> TOP
                          </Badge>
                        </div>
                        <CardContent className="p-3 space-y-1.5">
                          <h3 className="font-medium text-sm line-clamp-1">{product.title}</h3>
                          <div className="flex items-baseline gap-1.5">
                            {product.discountPrice ? (
                              <>
                                <span className="text-base font-bold text-volcan">
                                  {formatPrice(product.discountPrice)}
                                </span>
                                <span className="text-xs line-through text-muted-foreground">
                                  {formatPrice(product.price)}
                                </span>
                              </>
                            ) : (
                              <span className="text-base font-bold text-primary">
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
        </motion.section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: PRODUCT GRID - Beautiful cards with animations
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)]">
            {selectedCategory ? `Productos en ${selectedCategory}` : "Productos Recientes"}
          </h2>
          {!isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("register")}
              className="gap-1 rounded-xl"
            >
              <ShoppingBag className="h-4 w-4" /> Únete <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCardSkeleton />
              </motion.div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Better Empty State */
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
            </motion.div>
            <p className="text-lg font-semibold text-foreground mb-2">No se encontraron productos</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Intenta con otra categoría o explora todos los productos disponibles en la plataforma.
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
          /* Product Grid */
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-30px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={staggerItem}
                whileHover="hover"
                initial="rest"
              >
                <motion.div variants={cardHover}>
                  <Card
                    className="overflow-hidden cursor-pointer group border-0 shadow-md"
                    onClick={() => navigate("product-detail", { productId: product.id })}
                  >
                    {/* Image */}
                    <div className="relative h-56 bg-muted overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-primary/10 to-primary/5">
                          {CATEGORY_ICONS[product.category] || "📦"}
                        </div>
                      )}

                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Discount Badge with pulse */}
                      {product.discountPercent && (
                        <motion.div
                          animate={{ scale: [1, 1.06, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute top-3 left-3"
                        >
                          <Badge className="bg-volcan text-volcan-foreground text-xs px-2.5 py-1 rounded-lg shadow-md font-bold">
                            -{product.discountPercent}%
                          </Badge>
                        </motion.div>
                      )}

                      {/* Like Button with heart animation */}
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                        className="absolute top-3 right-3 bg-white/90 hover:bg-white h-9 w-9 rounded-full shadow-md flex items-center justify-center backdrop-blur-sm transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLike(product.id)
                        }}
                      >
                        <motion.div
                          animate={likedProducts.has(product.id) ? { scale: [1, 1.4, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${
                              likedProducts.has(product.id)
                                ? "fill-red-500 text-red-500"
                                : "text-gray-600"
                            }`}
                          />
                        </motion.div>
                      </motion.button>

                      {/* Save/Bookmark Button */}
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                        className="absolute bottom-3 right-3 bg-white/90 hover:bg-white h-8 w-8 rounded-full shadow-md flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSave(product.id)
                        }}
                      >
                        <Bookmark
                          className={`h-3.5 w-3.5 transition-colors ${
                            savedProducts.has(product.id)
                              ? "fill-[#F4D03F] text-[#F4D03F]"
                              : "text-gray-600"
                          }`}
                        />
                      </motion.button>

                      {/* Quick view overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          whileHover={{ y: 0, opacity: 1 }}
                          className="bg-white/95 rounded-xl px-4 py-2 shadow-lg flex items-center gap-1.5 text-sm font-medium text-primary backdrop-blur-sm"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" /> Ver detalle
                        </motion.div>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-2.5">
                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        {product.discountPrice ? (
                          <>
                            <span className="text-lg font-bold text-volcan">
                              {formatPrice(product.discountPrice)}
                            </span>
                            <span className="text-sm line-through text-muted-foreground">
                              {formatPrice(product.price)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-medium text-sm line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>

                      {/* Category */}
                      {product.category && (
                        <Badge variant="secondary" className="text-[10px] rounded-lg">
                          {CATEGORY_ICONS[product.category] || ""} {product.category}
                        </Badge>
                      )}

                      {/* Seller with verified badge */}
                      <div className="flex items-center gap-2 pt-1">
                        <Avatar className="h-5 w-5 ring-1 ring-primary/20">
                          <AvatarImage src={product.seller.businessProfile?.logo || product.seller.avatar || undefined} />
                          <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                            {(product.seller.businessProfile?.businessName || product.seller.name)?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {product.seller.businessProfile?.businessName || product.seller.name}
                        </span>
                        {product.seller.businessProfile && (
                          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                        {product.seller.address && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                            <MapPin className="h-3 w-3" />
                            {product.seller.address.split(",").slice(-1)[0]?.trim()}
                          </span>
                        )}
                      </div>

                      {/* Likes */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className={`h-3 w-3 ${likedProducts.has(product.id) ? "fill-red-500 text-red-500" : ""}`} />
                        {product.likeCount}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Load more trigger */}
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          <AnimatePresence>
            {loading && products.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                Cargando más productos...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5: TRUST / PAYMENT METHODS
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 md:p-8">
            <div className="text-center mb-6">
              <motion.div
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 text-sm font-medium text-primary mb-3"
              >
                <Shield className="h-4 w-4" /> Confianza y Seguridad
              </motion.div>
              <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)]">
                Compra con confianza
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Transacciones seguras y vendedores verificados
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                {
                  icon: <Shield className="h-8 w-8 text-primary" />,
                  title: "Vendedores Verificados",
                  desc: "Todos los proveedores pasan por un proceso de verificación de identidad y negocio.",
                },
                {
                  icon: <CreditCard className="h-8 w-8 text-primary" />,
                  title: "Pagos Seguros",
                  desc: "Múltiples métodos de pago con protección al comprador en cada transacción.",
                },
                {
                  icon: <CheckCircle className="h-8 w-8 text-primary" />,
                  title: "Garantía de Entrega",
                  desc: "Seguimiento en tiempo real y soporte dedicado para cada pedido realizado.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ y: -4 }}
                  className="bg-card rounded-2xl p-5 text-center shadow-sm border border-border/50"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-3">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Payment methods */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                Métodos de pago aceptados
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {PAYMENT_METHODS.map((method, i) => (
                  <motion.div
                    key={method.id}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 shadow-sm border border-border/50 cursor-default"
                  >
                    <span className="text-xl">{method.icon}</span>
                    <span className="text-xs font-medium">{method.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6: TESTIMONIALS - Auto-scrolling cards
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)] flex items-center gap-2">
            <Quote className="h-5 w-5 text-[#F4D03F]" /> Testimonios
          </h2>
          <Badge variant="secondary" className="rounded-lg">
            <Star className="h-3 w-3 mr-1 fill-[#F4D03F] text-[#F4D03F]" /> 4.9 promedio
          </Badge>
        </div>

        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <motion.div
            animate={{ x: [0, -(TESTIMONIALS.length * 340)] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: TESTIMONIALS.length * 8,
                ease: "linear",
              },
            }}
            className="flex gap-5"
          >
            {/* Double the testimonials for seamless loop */}
            {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, i) => (
              <motion.div
                key={`${testimonial.name}-${i}`}
                whileHover={{ y: -4, scale: 1.02 }}
                className="min-w-[320px] max-w-[320px]"
              >
                <Card className="h-full border-0 shadow-md bg-gradient-to-br from-card to-card/80">
                  <CardContent className="p-5">
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: testimonial.rating }).map((_, si) => (
                        <Star key={si} className="h-4 w-4 fill-[#F4D03F] text-[#F4D03F]" />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-sm text-foreground/90 leading-relaxed mb-4">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                          {testimonial.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.business}</p>
                        <p className="text-xs text-primary flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" /> {testimonial.location}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6.5: MARKETING VIDEO - Tutorial/Demo
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)] flex items-center gap-2">
            🎬 Conoce la Plataforma
          </h2>
          <Badge variant="secondary" className="rounded-lg">
            <Play className="h-3 w-3 mr-1" /> Video Tutorial
          </Badge>
        </div>

        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-gradient-to-br from-[#1A5276] to-[#0B3D6B]">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
                title="ProveedorConecta Nicaragua - Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full rounded-t-xl"
              />
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-lg font-[family-name:var(--font-poppins)]">
                Aprende a usar ProveedorConecta Nicaragua
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Descubre cómo registrar tu negocio, publicar productos, conectarte con proveedores
                de todo el país y realizar pagos seguros. En menos de 5 minutos estarás listo para
                hacer negocios en la plataforma #1 de MIPYMES en Nicaragua 🇳🇮
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="secondary" className="text-xs">🛒 Comprar</Badge>
                <Badge variant="secondary" className="text-xs">💰 Vender</Badge>
                <Badge variant="secondary" className="text-xs">🗺️ Mapa</Badge>
                <Badge variant="secondary" className="text-xs">💬 Chat</Badge>
                <Badge variant="secondary" className="text-xs">💳 Pagos</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7: CÓMO FUNCIONA - How it Works
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="space-y-5"
      >
        <div className="text-center mb-2">
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-[#F4D03F]/10 rounded-full px-4 py-1.5 text-sm font-medium text-[#D4AC0D] mb-3"
          >
            <Zap className="h-4 w-4" /> Fácil y Rápido
          </motion.div>
          <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)]">
            ¿Cómo Funciona?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tres pasos simples para empezar a hacer negocios
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              step: 1,
              icon: <UserPlus className="h-8 w-8 text-primary" />,
              title: "Regístrate Gratis",
              desc: "Crea tu cuenta en segundos y verifica tu correo",
            },
            {
              step: 2,
              icon: <Search className="h-8 w-8 text-[#F4D03F]" />,
              title: "Publica o Busca",
              desc: "Vende tus productos o encuentra lo que necesitas",
            },
            {
              step: 3,
              icon: <MessageCircle className="h-8 w-8 text-primary" />,
              title: "Conecta y Negocia",
              desc: "Chatea con vendedores y cierra tratos seguros",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
              className="relative"
            >
              <Card className="border-0 shadow-md h-full">
                <CardContent className="p-6 text-center">
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#F4D03F] text-[#1C2833] flex items-center justify-center text-sm font-bold shadow-md">
                    {item.step}
                  </div>
                  {/* Icon container */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  {/* Connector line for desktop */}
                  {item.step < 3 && (
                    <div className="hidden sm:block absolute top-1/2 -right-3 w-6 text-muted-foreground">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 8: MÉTODOS DE PAGO - Payment Methods
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.section
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="space-y-5"
      >
        <div className="text-center mb-2">
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 text-sm font-medium text-primary mb-3"
          >
            <CreditCard className="h-4 w-4" /> Pagos Seguros
          </motion.div>
          <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)]">
            Métodos de Pago
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Múltiples opciones para facilitar tus transacciones
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {PAYMENT_METHODS.map((method, i) => (
            <motion.div
              key={method.id}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <Card className="border-0 shadow-md cursor-default overflow-hidden group">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                    <span className="text-3xl">{method.icon}</span>
                  </div>
                  <h3 className="text-sm font-semibold">{method.name}</h3>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Shield className="h-3 w-3 text-primary" />
                    <span className="text-[10px] text-muted-foreground">Seguro</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA SECTION - Join the marketplace
          ═══════════════════════════════════════════════════════════════════ */}
      {!isAuthenticated && (
        <motion.section
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary via-[#2E86C1] to-[#154360] p-8 md:p-10 text-center relative">
              <FloatingParticles />
              <motion.div
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative z-10"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-white font-[family-name:var(--font-poppins)] mb-3">
                  ¿Listo para hacer negocios?
                </h2>
                <p className="text-white/80 mb-6 max-w-lg mx-auto">
                  Únete a cientos de MIPYMES nicaragüenses que ya están creciendo con ProveedorConecta.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    size="lg"
                    className="bg-[#2E86C1] hover:bg-[#2471A3] text-white font-semibold rounded-xl shadow-lg h-12"
                    onClick={() => navigate("register")}
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" /> Registrarme Gratis
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 rounded-xl h-12"
                    onClick={() => navigate("login")}
                  >
                    Ya tengo cuenta
                  </Button>
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.section>
      )}

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
            className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 transition-colors"
            aria-label="Volver arriba"
          >
            <ChevronUp className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
