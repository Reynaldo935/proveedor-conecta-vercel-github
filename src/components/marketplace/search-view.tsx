"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAppStore } from "@/store/app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Heart, MapPin, Search as SearchIcon } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"

interface Product {
  id: string; title: string; description: string; price: number
  discountPrice: number | null; discountPercent: number | null
  category: string; images: string[]; likeCount: number
  seller: { id: string; name: string; avatar: string; address: string; businessProfile?: { businessName: string } | null }
}

export function SearchView() {
  const { searchQuery, navigate } = useAppStore()
  const { isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!searchQuery) return
    let cancelled = false
    fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      .then(r => r.json())
      .then(d => { if (d.success && !cancelled) setProducts(d.data) })
      .catch(() => { if (!cancelled) toast.error("Error en búsqueda") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [searchQuery])

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)

  const toggleLike = async (productId: string) => {
    if (!isAuthenticated) { navigate("login"); return }
    await fetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SearchIcon className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Resultados para: &quot;{searchQuery}&quot;</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : products.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><p className="text-2xl mb-2">🔍</p><p>No se encontraron resultados para &quot;{searchQuery}&quot;</p><p className="text-sm text-muted-foreground mt-1">Intenta con otros términos</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <Card key={product.id} className="product-card overflow-hidden cursor-pointer" onClick={() => navigate("product-detail", { productId: product.id })}>
              <div className="relative h-48 bg-muted overflow-hidden">
                {product.images?.[0] ? <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>}
                {product.discountPercent && <Badge className="absolute top-2 left-2 bg-volcan text-volcan-foreground discount-badge">-{product.discountPercent}%</Badge>}
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-background/80 h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleLike(product.id) }}><Heart className="h-4 w-4" /></Button>
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-baseline gap-2">
                  {product.discountPrice ? (
                    <><span className="text-lg font-bold text-volcan">{formatPrice(product.discountPrice)}</span><span className="text-sm line-through text-muted-foreground">{formatPrice(product.price)}</span></>
                  ) : <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>}
                </div>
                <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
                {product.category && <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>}
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5"><AvatarFallback className="text-[8px] bg-primary text-primary-foreground">{(product.seller.businessProfile?.businessName || product.seller.name)?.charAt(0)}</AvatarFallback></Avatar>
                  <span className="text-xs text-muted-foreground truncate">{product.seller.businessProfile?.businessName || product.seller.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
