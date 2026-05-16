"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MapPin, Filter, Bookmark, TrendingUp, Store, ShoppingBag, ArrowRight } from "lucide-react"
import { PRODUCT_CATEGORIES } from "@/lib/validators"
import { toast } from "sonner"

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

const CATEGORY_ICONS: Record<string, string> = {
  "Construcción y Ferretería": "🏗️",
  "Agricultura y Ganadería": "🌾",
  "Tecnología y Electrónica": "💻",
  "Alimentos y Bebidas": "🍽️",
  "Textil y Calzado": "👕",
  "Salud y Farmacia": "💊",
  "Hogar y Muebles": "🏠",
  "Transporte y Logística": "🚛",
}

export function HomeFeed() {
  const { navigate, selectedCategory, setSelectedCategory } = useAppStore()
  const { user, isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

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

  // Infinite scroll
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(price)
  }

  // Featured categories with icons
  const mainCategories = PRODUCT_CATEGORIES.slice(0, 6)

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 opacity-[0.07]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="nic-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
                <path d="M15 30 L30 15 L45 30 L30 45Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#nic-pattern)" />
          </svg>
        </div>
        <div className="relative z-10 p-8 md:p-12 lg:p-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/15 rounded-full px-4 py-1.5 text-sm font-medium mb-4 backdrop-blur-sm">
              <span className="text-base">🇳🇮</span> Hecho en Nicaragua
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-poppins)] mb-4 leading-tight">
              ProveedorConecta<br />
              <span className="text-dorado">Nicaragua</span>
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-lg leading-relaxed">
              Conectamos emprendedores y MIPYMES con proveedores de insumos, materia prima y servicios en toda Nicaragua.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-dorado hover:bg-dorado/90 text-dorado-foreground font-semibold shadow-lg"
                onClick={() => navigate(isAuthenticated ? "sell-product" : "register")}
              >
                <Store className="h-5 w-5 mr-2" /> Vender en la Plataforma
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm"
                onClick={() => navigate("map")}
              >
                <MapPin className="h-5 w-5 mr-2" /> Explorar Mapa
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-10 pt-6 border-t border-primary-foreground/15">
            <div>
              <p className="text-2xl md:text-3xl font-bold">500+</p>
              <p className="text-sm opacity-75">Proveedores</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold">2,000+</p>
              <p className="text-sm opacity-75">Productos</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold">17</p>
              <p className="text-sm opacity-75">Departamentos</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold">5</p>
              <p className="text-sm opacity-75">Métodos de Pago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Quick Access */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Categorías
          </h2>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-1" /> {showFilters ? "Ocultar" : "Ver Todas"}
          </Button>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {mainCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                selectedCategory === cat
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-transparent bg-card hover:border-primary/30"
              }`}
            >
              <span className="text-2xl">{CATEGORY_ICONS[cat] || "📦"}</span>
              <span className="text-xs font-medium text-center leading-tight line-clamp-2">{cat}</span>
            </button>
          ))}
        </div>

        {/* Active filter indicator */}
        {selectedCategory && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary">
              {selectedCategory}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategory("")}>
              Limpiar filtro
            </Button>
          </div>
        )}

        {/* Extended filters */}
        {showFilters && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {PRODUCT_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? "bg-primary" : ""}
                >
                  {CATEGORY_ICONS[cat] || "📦"} {cat}
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)]">
          {selectedCategory ? `Productos en ${selectedCategory}` : "Productos Recientes"}
        </h2>
        {!isAuthenticated && (
          <Button variant="outline" size="sm" onClick={() => navigate("register")} className="gap-1">
            <ShoppingBag className="h-4 w-4" /> Únete <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Product Grid */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-52 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-lg font-medium text-muted-foreground">No se encontraron productos</p>
          <p className="text-sm text-muted-foreground mt-1">Intenta con otra categoría</p>
          <Button variant="outline" className="mt-4" onClick={() => setSelectedCategory("")}>
            Ver todos los productos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="product-card overflow-hidden cursor-pointer group"
              onClick={() => navigate("product-detail", { productId: product.id })}
            >
              {/* Image */}
              <div className="relative h-52 bg-muted overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-muted to-muted/50">📦</div>
                )}

                {/* Discount Badge */}
                {product.discountPercent && (
                  <Badge className="absolute top-2 left-2 bg-volcan text-volcan-foreground discount-badge text-xs px-2 py-0.5">
                    -{product.discountPercent}%
                  </Badge>
                )}

                {/* Like Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background/95 h-8 w-8 rounded-full shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLike(product.id)
                  }}
                >
                  <Heart className="h-4 w-4" />
                </Button>

                {/* Save Button */}
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 right-2 bg-background/80 hover:bg-background/95 h-7 w-7 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={async (e) => {
                      e.stopPropagation()
                      await fetch("/api/saved", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productId: product.id }),
                      })
                      toast.success("Guardado")
                    }}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <CardContent className="p-4 space-y-2">
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
                <h3 className="font-medium text-sm line-clamp-2 leading-tight min-h-[2.5rem]">
                  {product.title}
                </h3>

                {/* Category */}
                {product.category && (
                  <Badge variant="secondary" className="text-[10px]">
                    {CATEGORY_ICONS[product.category] || ""} {product.category}
                  </Badge>
                )}

                {/* Seller */}
                <div className="flex items-center gap-2 pt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={product.seller.businessProfile?.logo || product.seller.avatar || undefined} />
                    <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                      {(product.seller.businessProfile?.businessName || product.seller.name)?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    {product.seller.businessProfile?.businessName || product.seller.name}
                  </span>
                  {product.seller.address && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5 ml-auto">
                      <MapPin className="h-3 w-3" />
                      {product.seller.address.split(",").slice(-1)[0]?.trim()}
                    </span>
                  )}
                </div>

                {/* Likes */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3" /> {product.likeCount}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {loading && products.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            Cargando más...
          </div>
        )}
      </div>
    </div>
  )
}
