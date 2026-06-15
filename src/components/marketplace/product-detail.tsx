"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { authFetch } from "@/lib/client-auth"
import {
  Heart, MapPin, Phone, Share2, MessageCircle, ShoppingCart,
  FileText, ChevronLeft, ChevronRight, Bookmark, Star, Shield,
  Clock, Eye, Store, Zap, Package
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [imageZoomed, setImageZoomed] = useState(false)
  const [imgError, setImgError] = useState(false)

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
    try {
      const res = await authFetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: selectedProductId }) })
      const d = await res.json()
      if (d.success) {
        setIsLiked(d.data.liked)
        setProduct(p => p ? { ...p, likeCount: p.likeCount + (d.data.liked ? 1 : -1) } : p)
        toast.success(d.data.liked ? "❤️ Te gusta" : "Ya no te gusta")
      }
    } catch { toast.error("Error al dar like") }
  }

  const handleSave = async () => {
    if (!isAuthenticated) { navigate("login"); return }
    try {
      const res = await authFetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: selectedProductId }) })
      const d = await res.json()
      if (d.success) { setIsSaved(d.data.saved); toast.success(d.data.saved ? "🔖 Guardado" : "Eliminado de guardados") }
    } catch { toast.error("Error al guardar") }
  }

  const handleFollow = async () => {
    if (!isAuthenticated || !product) return
    try {
      const res = await authFetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followingId: product.seller.id }) })
      const d = await res.json()
      if (d.success) { setIsFollowing(d.data.following); toast.success(d.data.following ? "✅ Siguiendo" : "Dejaste de seguir") }
    } catch { toast.error("Error al seguir") }
  }

  const handleChat = async () => {
    if (!isAuthenticated || !product) { navigate("login"); return }
    try {
      const res = await authFetch("/api/chat/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sellerId: product.seller.id, productId: product.id, message: `Hola, me interesa: ${product.title}` }) })
      const d = await res.json()
      if (d.success) {
        toast.success("💬 Chat iniciado")
        navigate("chat", { roomId: d.data.id } as unknown as Record<string, string>)
      } else {
        toast.error(d.error || "Error al iniciar chat")
      }
    } catch {
      toast.error("Error al conectar con el vendedor")
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/?product=${product?.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.title, text: `Mira este producto: ${product?.title} - ${formatPrice(product?.discountPrice || product?.price || 0)}`, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success("🔗 Enlace copiado al portapapeles")
    }
    setShowShareMenu(false)
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-24" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-96 rounded-xl" />
        <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-20" /><Skeleton className="h-10" /></div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="text-center py-16 space-y-4">
      <Package className="h-16 w-16 mx-auto text-muted-foreground" />
      <p className="text-lg text-muted-foreground">Producto no encontrado</p>
      <Button onClick={() => navigate("home")}>Volver al Marketplace</Button>
    </div>
  )

  const images = product.images?.length > 0 ? product.images : ["/uploads/placeholder.jpg"]
  const sellerName = product.seller.businessProfile?.businessName || product.seller.name
  const effectivePrice = product.discountPrice || product.price

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("home")} className="mb-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Volver al Marketplace
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ═══ Image Gallery ═══ */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          {/* Main Image */}
          <div
            className="relative rounded-xl overflow-hidden bg-muted h-80 lg:h-[450px] cursor-zoom-in group"
            onClick={() => setImageZoomed(!imageZoomed)}
          >
            <AnimatePresence mode="wait">
              {!imgError ? (
                <motion.img
                  key={activeImage}
                  src={images[activeImage]}
                  alt={product.title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${imageZoomed ? 'scale-150' : 'scale-100 group-hover:scale-105'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <motion.div
                  key={`fallback-${activeImage}`}
                  className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Package className="h-16 w-16 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Imagen no disponible</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Discount Badge */}
            {product.discountPercent && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 left-3"
              >
                <Badge className="bg-red-500 text-white text-sm px-3 py-1 shadow-lg">
                  <Zap className="h-3.5 w-3.5 mr-1" /> -{product.discountPercent}% OFF
                </Badge>
              </motion.div>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <Badge className="absolute bottom-3 right-3 bg-black/60 text-white text-xs">
                {activeImage + 1} / {images.length}
              </Badge>
            )}

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost" size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-md"
                  onClick={(e) => { e.stopPropagation(); setImgError(false); setActiveImage(i => i > 0 ? i - 1 : images.length - 1) }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-md"
                  onClick={(e) => { e.stopPropagation(); setImgError(false); setActiveImage(i => i < images.length - 1 ? i + 1 : 0) }}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setImgError(false); setActiveImage(i) }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    i === activeImage ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Video */}
          {product.videoUrl && (
            <Card>
              <CardContent className="p-4">
                <video controls className="w-full rounded-lg" src={product.videoUrl} />
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ═══ Product Info ═══ */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-5"
        >
          {/* Category + Title */}
          <div>
            {product.category && <Badge variant="secondary" className="mb-2">{product.category}</Badge>}
            <h1 className="text-2xl lg:text-3xl font-bold font-[family-name:var(--font-poppins)]">{product.title}</h1>
          </div>

          {/* Price */}
          <div className="space-y-1">
            {product.discountPrice ? (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-red-600">{formatPrice(product.discountPrice)}</span>
                <span className="text-lg line-through text-muted-foreground">{formatPrice(product.price)}</span>
                <Badge className="bg-red-500 text-white">Ahorras {formatPrice(product.price - product.discountPrice)}</Badge>
              </div>
            ) : (
              <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
            )}
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> {product.quantity} disponibles
            </p>
          </div>

          {/* Quantity Discounts */}
          {product.quantityDiscounts && product.quantityDiscounts.length > 0 && (
            <Card className="border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20">
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
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
                            {qd.minQty}+
                          </Badge>
                          <span>Lleva {qd.minQty} o más</span>
                        </span>
                        <span className="font-semibold text-red-600">
                          {qd.discountPercent}% off → {formatPrice(product.price * (1 - qd.discountPercent / 100))}/u
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Actions - Facebook Style */}
          <div className="flex flex-wrap gap-2">
            <Button
              className="flex-1 min-w-[140px] bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white font-semibold h-12 text-base"
              onClick={() => navigate("checkout", { productId: product.id })}
            >
              <ShoppingCart className="h-5 w-5 mr-2" /> Comprar Ahora
            </Button>
            <Button variant="outline" className="flex-1 min-w-[140px] h-12" onClick={handleChat}>
              <MessageCircle className="h-5 w-5 mr-2" /> Enviar Mensaje
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button variant="ghost" size="sm" className="flex-1 gap-1" onClick={handleLike}>
              <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              <span className="text-xs">{product.likeCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-1" onClick={handleSave}>
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-amber-500 text-amber-500" : ""}`} />
              <span className="text-xs">Guardar</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-1" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Compartir</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-1" onClick={() => navigate("cotizaciones")}>
              <FileText className="h-4 w-4" />
              <span className="text-xs">Cotizar</span>
            </Button>
          </div>

          {/* Description */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Descripción</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{product.description || "Sin descripción"}</p>
              {product.tags && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {product.tags.split(',').map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag.trim()}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller Info Card - Facebook Style */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("vendor-profile", { vendorId: product.seller.id })}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={product.seller.businessProfile?.logo || product.seller.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">{sellerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{sellerName}</h3>
                  {product.seller.businessProfile?.category && <p className="text-sm text-muted-foreground">{product.seller.businessProfile.category}</p>}
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-green-600">Vendedor verificado</span>
                  </div>
                </div>
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleFollow() }}
                  className="shrink-0"
                >
                  {isFollowing ? "✅ Siguiendo" : "Seguir"}
                </Button>
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                {product.seller.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{product.seller.address}</span>
                  </div>
                )}
                {product.seller.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{product.seller.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
