"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Heart, MapPin, Phone, Share2, MessageCircle, ShoppingCart, FileText, ChevronLeft, ChevronRight, Bookmark } from "lucide-react"

interface QuantityDiscount {
  id: string; minQty: number; discountPercent: number
}

interface Product {
  id: string; title: string; description: string; price: number
  discountPrice: number | null; discountPercent: number | null
  category: string; images: string[]; tags: string; quantity: number
  likeCount: number; videoUrl: string
  discountStart: string | null; discountEnd: string | null
  quantityDiscounts?: QuantityDiscount[]
  seller: {
    id: string; name: string; avatar: string; phone: string; address: string
    businessProfile?: { businessName: string; logo: string; category: string; description: string } | null
  }
}

export function ProductDetail() {
  const { selectedProductId, navigate } = useAppStore()
  const { user, isAuthenticated } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (!selectedProductId) return
    let cancelled = false
    fetch(`/api/products/${selectedProductId}`)
      .then(r => r.json())
      .then(d => { if (d.success && !cancelled) setProduct(d.data) })
      .catch(() => { if (!cancelled) toast.error("Error al cargar producto") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedProductId])

  const formatPrice = (price: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(price)

  const handleLike = async () => {
    if (!isAuthenticated) { navigate("login"); return }
    const res = await fetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: selectedProductId }) })
    const d = await res.json()
    if (d.success) { setIsLiked(d.data.liked); toast.success(d.data.liked ? "Te gusta" : "Ya no te gusta") }
  }

  const handleSave = async () => {
    if (!isAuthenticated) { navigate("login"); return }
    const res = await fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: selectedProductId }) })
    const d = await res.json()
    if (d.success) { setIsSaved(d.data.saved); toast.success(d.data.saved ? "Guardado" : "Eliminado de guardados") }
  }

  const handleFollow = async () => {
    if (!isAuthenticated || !product) return
    const res = await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followingId: product.seller.id }) })
    const d = await res.json()
    if (d.success) { setIsFollowing(d.data.following); toast.success(d.data.following ? "Siguiendo" : "Dejaste de seguir") }
  }

  const handleChat = async () => {
    if (!isAuthenticated || !product) { navigate("login"); return }
    const res = await fetch("/api/chat/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sellerId: product.seller.id, productId: product.id, message: `Hola, me interesa: ${product.title}` }) })
    const d = await res.json()
    if (d.success) { toast.success("Chat iniciado"); navigate("chat-list") }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-96 w-full" /><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/2" /></div>
  if (!product) return <div className="text-center py-16"><p>Producto no encontrado</p><Button onClick={() => navigate("home")} className="mt-4">Volver</Button></div>

  const images = product.images?.length > 0 ? product.images : ["/uploads/placeholder.jpg"]
  const sellerName = product.seller.businessProfile?.businessName || product.seller.name
  const effectivePrice = product.discountPrice || product.price

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("home")} className="mb-2"><ChevronLeft className="h-4 w-4 mr-1" /> Volver</Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-muted h-80 lg:h-[450px]">
            <img src={images[activeImage]} alt={product.title} className="w-full h-full object-cover" />
            {product.discountPercent && (
              <Badge className="absolute top-3 left-3 bg-volcan text-volcan-foreground text-lg px-3 py-1 discount-badge">
                -{product.discountPercent}% OFF
              </Badge>
            )}
            {images.length > 1 && (
              <>
                <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80" onClick={() => setActiveImage(i => i > 0 ? i - 1 : images.length - 1)}><ChevronLeft /></Button>
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80" onClick={() => setActiveImage(i => i < images.length - 1 ? i + 1 : 0)}><ChevronRight /></Button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${i === activeImage ? "border-primary" : "border-transparent"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          <div>
            {product.category && <Badge variant="secondary" className="mb-2">{product.category}</Badge>}
            <h1 className="text-2xl lg:text-3xl font-bold font-[family-name:var(--font-poppins)]">{product.title}</h1>
          </div>

          {/* Price */}
          <div className="space-y-1">
            {product.discountPrice ? (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-volcan">{formatPrice(product.discountPrice)}</span>
                <span className="text-lg line-through text-muted-foreground">{formatPrice(product.price)}</span>
                <Badge className="bg-volcan text-volcan-foreground">Ahorras {formatPrice(product.price - product.discountPrice)}</Badge>
              </div>
            ) : (
              <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
            )}
            <p className="text-sm text-muted-foreground">Cantidad disponible: {product.quantity}</p>
          </div>

          {/* Quantity Discounts */}
          {product.quantityDiscounts && product.quantityDiscounts.length > 0 && (
            <Card className="border-dorado/30 bg-dorado/5">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  🏷️ Descuentos por Cantidad
                </h3>
                <div className="space-y-1.5">
                  {product.quantityDiscounts
                    .sort((a, b) => a.minQty - b.minQty)
                    .map((qd) => (
                      <div key={qd.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-xs bg-dorado/10 text-dorado border-dorado/20">
                            {qd.minQty}+
                          </Badge>
                          <span>Lleva {qd.minQty} o más</span>
                        </span>
                        <span className="font-semibold text-volcan">
                          {qd.discountPercent}% off → {formatPrice(product.price * (1 - qd.discountPercent / 100))}/u
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => navigate("checkout", { productId: product.id })}>
              <ShoppingCart className="h-4 w-4 mr-2" /> Comprar / Pagar
            </Button>
            <Button variant="outline" onClick={handleChat}>
              <MessageCircle className="h-4 w-4 mr-2" /> Contactar
            </Button>
            <Button variant="outline" onClick={() => navigate("cotizaciones")}>
              <FileText className="h-4 w-4 mr-2" /> Cotizar
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleLike}><Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-volcan text-volcan" : ""}`} /> {product.likeCount}</Button>
            <Button variant="ghost" size="sm" onClick={handleSave}><Bookmark className={`h-4 w-4 mr-1 ${isSaved ? "fill-dorado text-dorado" : ""}`} /> Guardar</Button>
            <Button variant="ghost" size="sm"><Share2 className="h-4 w-4 mr-1" /> Compartir</Button>
          </div>

          {/* Description */}
          <Card><CardContent className="p-4"><h3 className="font-semibold mb-2">Descripción</h3><p className="text-muted-foreground whitespace-pre-wrap">{product.description || "Sin descripción"}</p></CardContent></Card>

          {/* Seller Info */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("vendor-profile", { vendorId: product.seller.id })}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={product.seller.businessProfile?.logo || product.seller.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">{sellerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{sellerName}</h3>
                  {product.seller.businessProfile?.category && <p className="text-sm text-muted-foreground">{product.seller.businessProfile.category}</p>}
                </div>
                <Button variant={isFollowing ? "outline" : "default"} size="sm" onClick={(e) => { e.stopPropagation(); handleFollow() }}>
                  {isFollowing ? "Siguiendo" : "Seguir"}
                </Button>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {product.seller.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{product.seller.address}</div>}
                {product.seller.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{product.seller.phone}</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
