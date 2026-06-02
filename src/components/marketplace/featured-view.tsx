"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Star,
  Flame,
  Sparkles,
  Filter,
  ChevronLeft,
  Heart,
  Package,
  Zap,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { authFetch } from "@/lib/client-auth"

// ─── Product Interface ──────────────────────────────────────────────────────
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
  isFeatured?: boolean
  createdAt: string
  seller: {
    id: string
    name: string
    avatar: string
    address: string
    businessProfile?: { businessName: string; logo: string } | null
  }
}

// ─── Category Icons Map ─────────────────────────────────────────────────────
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

// ─── Filter Tab Type ────────────────────────────────────────────────────────
type FilterTab = "all" | "featured" | "offers" | "new"

const FILTER_TABS: { value: FilterTab; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "Todos", icon: <Filter className="h-3.5 w-3.5" /> },
  { value: "featured", label: "Destacados", icon: <Star className="h-3.5 w-3.5" /> },
  { value: "offers", label: "Ofertas", icon: <Flame className="h-3.5 w-3.5" /> },
  { value: "new", label: "Nuevos", icon: <Sparkles className="h-3.5 w-3.5" /> },
]

// ─── Product Card Skeleton ──────────────────────────────────────────────────
function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <Skeleton className="h-48 w-full rounded-none" />
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FEATURED VIEW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function FeaturedView() {
  const { navigate } = useAppStore()
  const { user, isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())

  // ─── Load Products ────────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", "20")
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch {
      // Network or parsing error — gracefully handle
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // ─── Filtered Products ────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    switch (activeTab) {
      case "featured":
        return products.filter((p) => p.isFeatured || p.likeCount > 5)
      case "offers":
        return products.filter((p) => p.discountPercent && p.discountPercent > 0)
      case "new":
        return products.filter((p) => {
          const created = new Date(p.createdAt || "")
          return created >= oneWeekAgo
        })
      default:
        return products
    }
  }, [products, activeTab])

  // ─── Toggle Like ──────────────────────────────────────────────────────────
  const toggleLike = async (productId: string, e: React.MouseEvent) => {
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
        setLikedProducts((prev) => {
          const next = new Set(prev)
          if (data.data.liked) {
            next.add(productId)
          } else {
            next.delete(productId)
          }
          return next
        })
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, likeCount: data.data.liked ? p.likeCount + 1 : p.likeCount - 1 }
              : p
          )
        )
      }
    } catch {
      // Like request failed — gracefully handle
    }
  }

  // ─── Format Price ─────────────────────────────────────────────────────────
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(price)
  }

  // ─── Stagger Animations ──────────────────────────────────────────────────
  const staggerContainer = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  }

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button variant="ghost" onClick={() => navigate("home")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] flex items-center gap-2">
            <Star className="h-6 w-6 text-[#F4D03F]" />
            Destacados y Ofertas
          </h1>
          <p className="text-sm text-muted-foreground">
            Los mejores productos y ofertas especiales
          </p>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as FilterTab)}
        >
          <TabsList className="flex-wrap gap-1 bg-muted/50 p-1 rounded-xl">
            {FILTER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg gap-1.5 data-[state=active]:bg-[#1A5276] data-[state=active]:text-white"
              >
                {tab.icon}
                {tab.label}
                {tab.value === "offers" && (
                  <Badge className="ml-1 h-4 min-w-4 px-1 text-[9px] bg-[#C0392B] text-white rounded-md">
                    {products.filter((p) => p.discountPercent && p.discountPercent > 0).length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content - same grid for all tabs */}
          {FILTER_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {loading ? (
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
              ) : filteredProducts.length === 0 ? (
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block"
                  >
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">
                    {tab.value === "featured"
                      ? "No hay productos destacados aún"
                      : tab.value === "offers"
                      ? "No hay ofertas disponibles"
                      : tab.value === "new"
                      ? "No hay productos nuevos"
                      : "No hay productos disponibles"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Vuelve más tarde para encontrar productos increíbles
                  </p>
                  {tab.value !== "all" && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("all")}
                      className="rounded-xl"
                    >
                      Ver todos los productos
                    </Button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        variants={staggerItem}
                        layout
                        whileHover={{ y: -6 }}
                        transition={{ duration: 0.25 }}
                      >
                        <Card
                          className="overflow-hidden border-0 shadow-md cursor-pointer group h-full"
                          onClick={() => navigate("product-detail", { productId: product.id })}
                        >
                          {/* Image */}
                          <div className="relative h-48 bg-muted overflow-hidden">
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
                            {/* Discount Badge */}
                            {product.discountPercent && (
                              <motion.div
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <Badge className="absolute top-2 left-2 bg-[#C0392B] text-white text-xs px-2 py-0.5 rounded-lg shadow-md">
                                  -{product.discountPercent}%
                                </Badge>
                              </motion.div>
                            )}
                            {/* Featured Badge */}
                            {(product.isFeatured || product.likeCount > 5) && (
                              <Badge className="absolute top-2 right-2 bg-[#F4D03F] text-[#1C2833] text-[10px] px-1.5 py-0.5 rounded-lg shadow-sm">
                                <Star className="h-2.5 w-2.5 mr-0.5" fill="currentColor" /> TOP
                              </Badge>
                            )}
                            {/* Like Button */}
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={(e) => toggleLike(product.id, e)}
                              className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-black/70 transition-colors"
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  likedProducts.has(product.id)
                                    ? "text-[#C0392B] fill-[#C0392B]"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </motion.button>
                          </div>

                          {/* Content */}
                          <CardContent className="p-4 flex flex-col gap-2">
                            <h3 className="font-medium text-sm line-clamp-1">{product.title}</h3>
                            <div className="flex items-baseline gap-1.5">
                              {product.discountPrice ? (
                                <>
                                  <span className="text-base font-bold text-[#C0392B]">
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
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>
                            {/* Seller Info */}
                            <div className="flex items-center gap-1.5 mt-auto">
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={
                                    product.seller.businessProfile?.logo ||
                                    product.seller.avatar ||
                                    undefined
                                  }
                                />
                                <AvatarFallback className="text-[7px] bg-primary text-primary-foreground">
                                  {(
                                    product.seller.businessProfile?.businessName ||
                                    product.seller.name
                                  )?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[11px] text-muted-foreground truncate">
                                {product.seller.businessProfile?.businessName ||
                                  product.seller.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-0.5">
                                <Heart className="h-3 w-3" />
                                {product.likeCount}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Load More / Results Count */}
      {!loading && filteredProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground mb-3">
            Mostrando {filteredProducts.length} de {products.length} productos
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("home")}
            className="rounded-xl gap-1.5"
          >
            <Zap className="h-4 w-4" />
            Explorar más en el Inicio
          </Button>
        </motion.div>
      )}
    </div>
  )
}
