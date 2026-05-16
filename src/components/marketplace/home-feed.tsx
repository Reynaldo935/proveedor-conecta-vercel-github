"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MapPin, Star, ChevronDown, Filter, X } from "lucide-react"
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

export function HomeFeed() {
  const { navigate, selectedCategory, setSelectedCategory, priceRange, setPriceRange } = useAppStore()
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

  // Infinite scroll with IntersectionObserver
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

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 md:p-12 text-primary-foreground">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-poppins)] mb-3">
            🇳🇮 ProveedorConecta Nicaragua
          </h1>
          <p className="text-lg opacity-90 mb-6 max-w-xl">
            Conectamos emprendedores y MIPYMES con proveedores de insumos, materia prima y servicios en toda Nicaragua.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              className="bg-dorado hover:bg-dorado/90 text-dorado-foreground font-semibold"
              onClick={() => navigate(isAuthenticated ? "sell-product" : "register")}
            >
              🏪 Vender en la Plataforma
            </Button>
            <Button
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("map")}
            >
              🗺️ Explorar Mapa
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" fill="currentColor">
            <circle cx="100" cy="100" r="80" />
          </svg>
        </div>
      </div>

      {/* Category Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-poppins)]">Explorar Productos</h2>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-1" /> Filtros
          </Button>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("")}
            className={selectedCategory === "" ? "bg-primary" : ""}
          >
            Todos
          </Button>
          {PRODUCT_CATEGORIES.slice(0, 8).map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? "bg-primary" : ""}
            >
              {cat}
            </Button>
          ))}
        </div>

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
                  {cat}
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Product Grid */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
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
          <p className="text-2xl mb-2">📦</p>
          <p className="text-muted-foreground">No se encontraron productos</p>
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
              <div className="relative h-48 bg-muted overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                )}

                {/* Discount Badge */}
                {product.discountPercent && (
                  <Badge className="absolute top-2 left-2 bg-volcan text-volcan-foreground discount-badge">
                    -{product.discountPercent}%
                  </Badge>
                )}

                {/* Like Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLike(product.id)
                  }}
                >
                  <Heart className="h-4 w-4" />
                </Button>
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
                <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                  {product.title}
                </h3>

                {/* Category */}
                {product.category && (
                  <Badge variant="secondary" className="text-[10px]">
                    {product.category}
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
