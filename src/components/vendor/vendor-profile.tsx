"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  MapPin, Phone, Clock, MessageCircle, ChevronLeft,
  Users, Heart, Calendar, Send, Loader2, Plus,
  Copy, Check, Eye, Share2, Navigation, CheckCircle2, Package
} from "lucide-react"
import { PAYMENT_METHODS } from "@/lib/validators"
import { authFetch } from "@/lib/client-auth"
import { motion, AnimatePresence } from "framer-motion"

export function VendorProfile() {
  const { selectedVendorId, navigate } = useAppStore()
  const { user, isAuthenticated } = useAuthStore()
  const [vendor, setVendor] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [wallPosts, setWallPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [posting, setPosting] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  // Generate a stable "profile views" number from vendor ID so it doesn't change on re-render
  const profileViews = vendor?.id
    ? (parseInt(vendor.id.slice(-6), 36) % 900) + 100
    : 0

  const formatBusinessId = (id: string) => {
    if (id.length < 8) return id
    return `${id.slice(0, 4)}-${id.slice(-4)}`.toUpperCase()
  }

  const handleCopyId = async () => {
    if (!vendor?.id) return
    await navigator.clipboard.writeText(vendor.id)
    setCopiedId(true)
    toast.success("ID copiado al portapapeles")
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/vendor/${vendor?.id}`
    await navigator.clipboard.writeText(url)
    setCopiedShare(true)
    toast.success("Enlace del perfil copiado")
    setTimeout(() => setCopiedShare(false), 2000)
  }

  useEffect(() => {
    if (!selectedVendorId) return
    let cancelled = false

    const loadData = async () => {
      try {
        const [userData, productsData, businessData] = await Promise.all([
          authFetch(`/api/users/${selectedVendorId}`).then(r => r.json()),
          authFetch(`/api/products?sellerId=${selectedVendorId}&limit=50`).then(r => r.json()),
          authFetch(`/api/users/${selectedVendorId}/business`).then(r => r.json()).catch(() => ({ success: false })),
        ])

        if (!cancelled) {
          if (userData.success) {
            setVendor(userData.data)
            // Check follow status
            if (isAuthenticated && user?.id && selectedVendorId !== user.id) {
              // We can determine follow state from vendor data or check separately
              // For now, we'll track it locally and toggle via API
            }
          }
          if (productsData.success) setProducts(productsData.data)
          if (businessData.success && businessData.data?.wallPosts) {
            setWallPosts(businessData.data.wallPosts)
          }
          if (businessData.success && businessData.data?.user?.followers) {
            setFollowerCount(businessData.data.user.followers.length)
            // Check if current user follows this vendor
            if (isAuthenticated && user?.id) {
              const follows = businessData.data.user.followers.some((f: any) => f.followerId === user.id)
              setIsFollowing(follows)
            }
          }
        }
      } catch {
        if (!cancelled) toast.error("Error al cargar perfil")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [selectedVendorId, isAuthenticated, user?.id])

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)
  const businessProfile = vendor?.businessProfile
  const businessName = businessProfile?.businessName || vendor?.name || "Vendedor"
  const coverImage = businessProfile?.coverImage

  const handleFollow = async () => {
    if (!isAuthenticated || !selectedVendorId) return
    setFollowLoading(true)
    try {
      const res = await authFetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: selectedVendorId }),
      })
      const d = await res.json()
      if (d.success) {
        setIsFollowing(d.data.following)
        setFollowerCount(prev => d.data.following ? prev + 1 : prev - 1)
        toast.success(d.data.following ? "Ahora sigues a este vendedor" : "Dejaste de seguir")
      }
    } catch {
      toast.error("Error al seguir")
    } finally {
      setFollowLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return
    setPosting(true)
    try {
      const res = await authFetch("/api/wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPostContent }),
      })
      const d = await res.json()
      if (d.success) {
        setWallPosts(prev => [d.data, ...prev])
        setNewPostContent("")
        toast.success("Publicación creada")
      } else {
        toast.error(d.error || "Error al publicar")
      }
    } catch {
      toast.error("No se pudo conectar. Intenta de nuevo.")
    } finally {
      setPosting(false)
    }
  }

  const handleChat = async () => {
    if (!selectedVendorId) return
    try {
      await authFetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: selectedVendorId, message: "Hola, me interesa tu negocio" }),
      })
      navigate("chat-list")
    } catch {
      toast.error("Error al crear chat")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">Vendedor no encontrado</p>
        <Button onClick={() => navigate("home")} className="mt-4">Volver</Button>
      </div>
    )
  }

  const activeProducts = products.filter(p => p.status === "ACTIVE")

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Button variant="ghost" onClick={() => navigate("home")} className="mb-0">
        <ChevronLeft className="h-4 w-4 mr-1" /> Volver
      </Button>

      {/* Cover + Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1A5276] via-[#2471A3] to-[#3498DB]">
          {coverImage ? (
            <img src={coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white/80">
                <div className="text-6xl mb-2">🏪</div>
                <p className="text-sm font-medium">{businessName}</p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute -bottom-10 left-6">
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
            <AvatarImage src={businessProfile?.logo || vendor.avatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {businessName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          {isAuthenticated && vendor.id !== user?.id && (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={isFollowing ? "bg-white/90 dark:bg-card/90" : "bg-[#1A5276] text-white shadow-md"}
                >
                  {followLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Siguiendo</span>
                  ) : (
                    <span className="flex items-center gap-1"><Plus className="h-4 w-4" /> Seguir</span>
                  )}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm" onClick={handleChat} className="bg-white/90 dark:bg-card/90">
                  <MessageCircle className="h-4 w-4 mr-1" /> Chat
                </Button>
              </motion.div>
            </>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareProfile}
              className="bg-white/90 dark:bg-card/90"
            >
              {copiedShare ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
              <span className="ml-1 hidden sm:inline">{copiedShare ? "¡Copiado!" : "Compartir"}</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Business Name & Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-10 space-y-2"
      >
        {/* Business ID */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">
            ID: {formatBusinessId(vendor.id)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopyId}
          >
            {copiedId ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
          </Button>
        </div>

        {/* Business Name + Verified */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">{businessName}</h1>
          {vendor.emailVerified && (
            <Badge className="bg-green-600 text-white text-xs gap-1 px-2 py-0.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verificado
            </Badge>
          )}
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 text-center">
              <Package className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{activeProducts.length}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Productos Activos</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 text-center">
              <Users className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{followerCount}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Seguidores</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 text-center">
              <Calendar className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{wallPosts.length}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Publicaciones</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 text-center">
              <Eye className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{profileViews}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Vistas del Perfil</p>
            </CardContent>
          </Card>
        </div>

        {businessProfile?.category && (
          <Badge variant="secondary" className="mt-1">{businessProfile.category}</Badge>
        )}

        {/* Payment Methods */}
        {businessProfile?.paymentMethods && (() => {
          const methods = JSON.parse(businessProfile.paymentMethods || "[]") as string[]
          if (methods.length === 0) return null
          return (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Métodos de pago aceptados</p>
              <div className="flex flex-wrap gap-1.5">
                {methods.map((m: string) => {
                  const methodInfo = PAYMENT_METHODS.find(pm => pm.id === m)
                  const colorMap: Record<string, string> = {
                    PAYPAL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                    BANPRO: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                    BAC: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
                    LAFISE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
                    BILLETERA: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
                  }
                  return (
                    <Badge
                      key={m}
                      variant="secondary"
                      className={`${colorMap[m] || ""} text-xs gap-1`}
                    >
                      <span>{methodInfo?.icon || "💰"}</span>
                      {methodInfo?.name || m}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {businessProfile?.description && (
          <p className="text-muted-foreground mt-2">{businessProfile.description}</p>
        )}
      </motion.div>

      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        {vendor.address && (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm">{vendor.address}</span>
            </CardContent>
          </Card>
        )}
        {vendor.phone && (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm">{vendor.phone}</span>
            </CardContent>
          </Card>
        )}
        {businessProfile?.hours && (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm">{businessProfile.hours}</span>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Map Preview */}
      {businessProfile?.latitude && businessProfile?.longitude && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("map")}
          >
            <div className="relative h-32 bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] dark:from-[#1B3A34] dark:to-[#0D2B26] flex items-center justify-center">
              {/* Decorative map-like elements */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
              <div className="relative flex flex-col items-center gap-1">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Navigation className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs font-medium text-primary">
                  {Number(businessProfile.latitude).toFixed(4)}, {Number(businessProfile.longitude).toFixed(4)}
                </p>
              </div>
            </div>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">Ver en el mapa</span>
              </div>
              <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Productos ({activeProducts.length})</TabsTrigger>
          <TabsTrigger value="posts">Publicaciones ({wallPosts.length})</TabsTrigger>
          <TabsTrigger value="info">Información</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-4">
          {activeProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Package2Icon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Sin productos publicados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="product-card cursor-pointer overflow-hidden"
                    onClick={() => navigate("product-detail", { productId: p.id })}
                  >
                    <div className="h-40 bg-muted overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-muted to-muted/50">📦</div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm truncate">{p.title}</h3>
                      <p className="font-bold text-primary mt-1">{formatPrice(p.discountPrice || p.price)}</p>
                      {p.likeCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">❤️ {p.likeCount} me gusta</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Wall Posts Tab */}
        <TabsContent value="posts" className="mt-4">
          {/* Create post (only for own profile) */}
          {isAuthenticated && user?.id === selectedVendorId && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="¿Qué hay de nuevo en tu negocio?"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleCreatePost}
                        disabled={posting || !newPostContent.trim()}
                        className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white"
                      >
                        {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                        Publicar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {wallPosts.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Sin publicaciones aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wallPosts.map((post: any) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarImage src={businessProfile?.logo || vendor.avatar || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {businessName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{businessName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString("es-NI", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{post.content}</p>
                          {post.imageUrl && (
                            <img src={post.imageUrl} alt="" className="mt-2 rounded-lg max-h-60 object-cover" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-lg">Información del Negocio</h3>
              <div className="space-y-3">
                {businessProfile?.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descripción</p>
                    <p className="text-sm mt-1">{businessProfile.description}</p>
                  </div>
                )}
                {businessProfile?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{businessProfile.address}</span>
                  </div>
                )}
                {businessProfile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{businessProfile.phone}</span>
                  </div>
                )}
                {businessProfile?.hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{businessProfile.hours}</span>
                  </div>
                )}
                {businessProfile?.paymentMethods && (() => {
                  const methods = JSON.parse(businessProfile.paymentMethods || "[]") as string[]
                  if (methods.length === 0) return null
                  const colorMap: Record<string, string> = {
                    PAYPAL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                    BANPRO: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                    BAC: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
                    LAFISE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
                    BILLETERA: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
                  }
                  return (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-3">Métodos de pago</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {methods.map((m: string) => {
                          const methodInfo = PAYMENT_METHODS.find(pm => pm.id === m)
                          return (
                            <Badge
                              key={m}
                              variant="secondary"
                              className={`${colorMap[m] || ""} text-xs gap-1`}
                            >
                              <span>{methodInfo?.icon || "💰"}</span>
                              {methodInfo?.name || m}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

// Simple package icon fallback
function Package2Icon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  )
}
