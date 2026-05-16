"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { MapPin, Phone, Clock, Heart, MessageCircle, ChevronLeft, Calendar } from "lucide-react"

export function VendorProfile() {
  const { selectedVendorId, navigate } = useAppStore()
  const { user, isAuthenticated } = useAuthStore()
  const [vendor, setVendor] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [wallPosts, setWallPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (!selectedVendorId) return
    let cancelled = false
    Promise.all([
      fetch(`/api/users/${selectedVendorId}`).then(r => r.json()),
      fetch(`/api/products?sellerId=${selectedVendorId}&limit=50`).then(r => r.json()),
    ]).then(([userData, productsData]) => {
      if (!cancelled) {
        if (userData.success) setVendor(userData.data)
        if (productsData.success) setProducts(productsData.data)
      }
    }).catch(() => { if (!cancelled) toast.error("Error al cargar perfil") })
    .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedVendorId])

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)
  const businessProfile = vendor?.businessProfile
  const businessName = businessProfile?.businessName || vendor?.name || "Vendedor"
  const coverImage = businessProfile?.coverImage

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-8 w-1/3" /></div>
  if (!vendor) return <div className="text-center py-16"><p>Vendedor no encontrado</p><Button onClick={() => navigate("home")} className="mt-4">Volver</Button></div>

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("home")}><ChevronLeft className="h-4 w-4 mr-1" /> Volver</Button>

      {/* Cover + Avatar */}
      <div className="relative">
        <div className="h-48 md:h-64 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          {coverImage ? <img src={coverImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-6xl">🏪</div>}
        </div>
        <div className="absolute -bottom-8 left-6">
          <Avatar className="h-20 w-20 border-4 border-background">
            <AvatarImage src={businessProfile?.logo || vendor.avatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{businessName.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          {isAuthenticated && vendor.id !== user?.id && (
            <Button variant={isFollowing ? "outline" : "default"} size="sm" onClick={async () => {
              const res = await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followingId: vendor.id }) })
              const d = await res.json()
              if (d.success) setIsFollowing(d.data.following)
            }}>{isFollowing ? "Siguiendo" : "Seguir"}</Button>
          )}
          {isAuthenticated && vendor.id !== user?.id && (
            <Button variant="outline" size="sm" onClick={async () => {
              await fetch("/api/chat/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sellerId: vendor.id, message: "Hola, me interesa tu negocio" }) })
              navigate("chat-list")
            }}><MessageCircle className="h-4 w-4 mr-1" /> Chat</Button>
          )}
        </div>
      </div>

      {/* Business Name & Info */}
      <div className="mt-10 space-y-1">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">{businessName}</h1>
        {businessProfile?.category && <Badge variant="secondary">{businessProfile.category}</Badge>}
        {businessProfile?.description && <p className="text-muted-foreground mt-2">{businessProfile.description}</p>}
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {vendor.address && <Card><CardContent className="p-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span className="text-sm">{vendor.address}</span></CardContent></Card>}
        {vendor.phone && <Card><CardContent className="p-3 flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><span className="text-sm">{vendor.phone}</span></CardContent></Card>}
        {businessProfile?.hours && <Card><CardContent className="p-3 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span className="text-sm">{businessProfile.hours}</span></CardContent></Card>}
      </div>

      {/* Tabs: Products, Posts, Info */}
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Productos ({products.length})</TabsTrigger>
          <TabsTrigger value="posts">Publicaciones</TabsTrigger>
          <TabsTrigger value="info">Información</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-4">
          {products.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Sin productos publicados</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.filter(p => p.status === "ACTIVE").map(p => (
                <Card key={p.id} className="product-card cursor-pointer" onClick={() => navigate("product-detail", { productId: p.id })}>
                  <div className="h-40 bg-muted overflow-hidden">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">{p.title}</h3>
                    <p className="font-bold text-primary mt-1">{formatPrice(p.discountPrice || p.price)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="posts" className="mt-4">
          <p className="text-center py-8 text-muted-foreground">Publicaciones del muro aparecerán aquí</p>
        </TabsContent>
        <TabsContent value="info" className="mt-4">
          <Card><CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Información del negocio</h3>
            {businessProfile?.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{businessProfile.address}</div>}
            {businessProfile?.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />{businessProfile.phone}</div>}
            {businessProfile?.hours && <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{businessProfile.hours}</div>}
            {businessProfile?.paymentMethods && (
              <div><p className="text-sm font-medium mt-2">Métodos de pago aceptados:</p>
              <div className="flex flex-wrap gap-1 mt-1">{JSON.parse(businessProfile.paymentMethods || "[]").map((m: string) => <Badge key={m} variant="secondary">{m}</Badge>)}</div></div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
