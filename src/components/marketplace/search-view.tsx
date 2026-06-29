"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAppStore } from "@/store/app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Heart,
  MapPin,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  TrendingUp,
  Package,
} from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { PRODUCT_CATEGORIES, NICARAGUA_DEPARTMENTS } from "@/lib/validators"
import { motion, AnimatePresence } from "framer-motion"

interface Product {
  id: string
  title: string
  description: string
  price: number
  discountPrice: number | null
  discountPercent: number | null
  category: string
  images: string[]
  likeCount: number
  seller: {
    id: string
    name: string
    avatar: string
    address: string
    businessProfile?: { businessName: string } | null
  }
}

// Popular search suggestions
const SEARCH_SUGGESTIONS = [
  "Cemento",
  "Fertilizante",
  "Laptop",
  "Pintura",
  "Arroz",
  "Madera",
  "Herramientas",
  "Ropa",
]

export function SearchView() {
  const { searchQuery, navigate, setSearchQuery, setSelectedCategory } = useAppStore()
  const { isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [category, setCategory] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [location, setLocation] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Search with debounce
  const performSearch = useCallback(
    async (q: string, cat: string) => {
      setLoading(true)
      try {
        const productParams = new URLSearchParams()
        if (q) productParams.set("search", q)
        if (cat) productParams.set("category", cat)
        if (minPrice) productParams.set("minPrice", minPrice)
        if (maxPrice) productParams.set("maxPrice", maxPrice)
        productParams.set("limit", "200")

        const res = await fetch(`/api/products?${productParams.toString()}`)
        const d = await res.json()
        if (d.success) setProducts(d.data || [])
        else setProducts([])
      } catch {
        toast.error("Error en búsqueda")
      } finally {
        setLoading(false)
      }
    },
    [minPrice, maxPrice, location]
  )

  // Load products: if no filters, show all. If filters active, search with debounce.
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    // If no search query and no category, load ALL products
    if (!localQuery && !category && !minPrice && !maxPrice && !location) {
      setLoading(true)
      fetch("/api/products?limit=200")
        .then(r => r.json())
        .then(d => { if (d.success) setProducts(d.data || []) })
        .catch(() => {})
        .finally(() => setLoading(false))
      return
    }

    if (!localQuery && !category) {
      setLoading(false)
      return
    }

    setLoading(true)
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(localQuery, category)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [localQuery, category, performSearch, minPrice, maxPrice, location])

  // Sync with global search query
  useEffect(() => {
    if (searchQuery && searchQuery !== localQuery) {
      setLocalQuery(searchQuery)
    }
  }, [searchQuery])

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(p)

  const toggleLike = async (productId: string) => {
    if (!isAuthenticated) {
      navigate("login")
      return
    }
    await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    })
  }

  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion)
    setSearchQuery(suggestion)
    setShowSuggestions(false)
  }

  const clearFilters = () => {
    setCategory("")
    setMinPrice("")
    setMaxPrice("")
    setLocation("")
    setSelectedCategory("")
  }

  const activeFilterCount = [category, minPrice, maxPrice, location].filter(
    Boolean
  ).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <SearchIcon className="h-5 w-5 text-primary flex-shrink-0" />
          <h1 className="text-xl font-bold font-[family-name:var(--font-poppins)]">
            Buscar Productos
          </h1>
        </div>

        {/* Search input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos, categorías..."
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value)
              setShowSuggestions(e.target.value.length === 0)
            }}
            onFocus={() => {
              if (!localQuery) setShowSuggestions(true)
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchQuery(localQuery)
                setShowSuggestions(false)
              }
            }}
            className="pl-9 pr-10"
          />
          {localQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => {
                setLocalQuery("")
                setSearchQuery("")
                setProducts([])
              }}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}

          {/* Search suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && !localQuery && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full mt-1 w-full bg-card border rounded-lg shadow-lg z-20 p-3"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Búsquedas populares
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SEARCH_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestionClick(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-muted-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category filter */}
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Categoría</p>
                    <Select
                      value={category}
                      onValueChange={(v) => {
                        setCategory(v === "_all" ? "" : v)
                        setSelectedCategory(v === "_all" ? "" : v)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">
                          Todas las categorías
                        </SelectItem>
                        {PRODUCT_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location filter */}
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Ubicación</p>
                    <Select
                      value={location}
                      onValueChange={(v) => setLocation(v === "_all" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todo Nicaragua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Todo Nicaragua</SelectItem>
                        {NICARAGUA_DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price range */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <p className="text-sm font-medium">Rango de precio (C$)</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Mínimo"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="Máximo"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => {
                    performSearch(localQuery, category)
                    setShowFilters(false)
                  }}
                >
                  <SearchIcon className="h-4 w-4 mr-1.5" />
                  Aplicar filtros
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      {!loading && (localQuery || category) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {products.length} resultado{products.length !== 1 ? "s" : ""}
            {localQuery && (
              <span>
                {" "}
                para &quot;<span className="text-foreground font-medium">{localQuery}</span>&quot;
              </span>
            )}
          </p>
          {category && (
            <Badge variant="secondary" className="text-xs gap-1">
              {category}
              <button onClick={() => { setCategory(""); setSelectedCategory("") }}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Skeleton className="h-64 w-full rounded-lg" />
            </motion.div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardContent className="p-8 text-center">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Package className="h-16 w-16 mx-auto text-primary/20 mb-4" />
              </motion.div>
              <p className="text-lg font-medium">No se encontraron resultados</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                {localQuery
                  ? `Intenta con otros términos o ajusta los filtros de búsqueda`
                  : "Escribe algo en la barra de búsqueda para encontrar productos"}
              </p>
              {SEARCH_SUGGESTIONS.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {SEARCH_SUGGESTIONS.slice(0, 4).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestionClick(s)}
                      className="text-xs px-3 py-1.5 rounded-full border hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
              >
                <Card
                  className="product-card overflow-hidden cursor-pointer h-full"
                  onClick={() =>
                    navigate("product-detail", { productId: product.id })
                  }
                >
                  <div className="relative h-48 bg-muted overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                    {product.discountPercent && (
                      <Badge className="absolute top-2 left-2 bg-volcan text-volcan-foreground discount-badge">
                        -{product.discountPercent}%
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLike(product.id)
                      }}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4 space-y-2">
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
                    <h3 className="font-medium text-sm line-clamp-2">
                      {product.title}
                    </h3>
                    {product.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {product.category}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={product.seller.avatar || undefined} />
                        <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                          {(product.seller.businessProfile?.businessName ||
                            product.seller.name)?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate">
                        {product.seller.businessProfile?.businessName ||
                          product.seller.name}
                      </span>
                    </div>
                    {product.seller.address && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{product.seller.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
