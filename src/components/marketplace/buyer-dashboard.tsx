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
import { authFetch } from "@/lib/client-auth"
import {
  ShoppingCart, Heart, FileText, ChevronLeft, Bookmark,
  Users, Package, Clock, CheckCircle2, AlertCircle, Loader2,
  Store, ArrowRight, TrendingUp
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface FollowingVendor {
  id: string
  name: string
  avatar: string
  businessProfile?: {
    businessName: string
    logo: string
    category: string
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function BuyerDashboard() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState<any[]>([])
  const [savedProducts, setSavedProducts] = useState<any[]>([])
  const [followingVendors, setFollowingVendors] = useState<FollowingVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("purchases")

  useEffect(() => {
    const loadData = async () => {
      try {
        const [transRes, savedRes] = await Promise.all([
          authFetch("/api/transactions?role=buyer").then(r => r.json()).catch(() => ({ success: false })),
          authFetch("/api/saved").then(r => r.json()).catch(() => ({ success: false })),
        ])

        if (transRes.success) setTransactions(transRes.data)
        if (savedRes.success) setSavedProducts(savedRes.data)

        // Load following vendors - fetch the user's following list
        if (user?.id) {
          try {
            const meRes = await authFetch("/api/auth/me")
            const meData = await meRes.json()
            if (meData.success && meData.data?.following) {
              // The user object might have a following relation
              const followingData = meData.data.following.map((f: any) => ({
                id: f.followingId || f.following?.id,
                name: f.following?.name || "",
                avatar: f.following?.avatar || "",
                businessProfile: f.following?.businessProfile || null,
              }))
              setFollowingVendors(followingData)
            }
          } catch {
            // Silently fail - following data is optional
          }
        }
      } catch {
        toast.error("Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user?.id])

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED": return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "PENDING": return <Clock className="h-4 w-4 text-amber-600" />
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      COMPLETED: { label: "Completado", className: "bg-green-600" },
      PENDING: { label: "Pendiente", className: "bg-amber-500" },
      CANCELLED: { label: "Cancelado", className: "bg-red-500" },
    }
    const c = config[status] || { label: status, className: "bg-muted" }
    return <Badge className={`text-[10px] ${c.className}`}>{c.label}</Badge>
  }

  const totalSpent = transactions
    .filter(t => t.status === "COMPLETED")
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const stats = {
    purchases: transactions.length,
    completed: transactions.filter(t => t.status === "COMPLETED").length,
    saved: savedProducts.length,
    following: followingVendors.length,
    totalSpent,
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">Mi Panel</h1>
        <p className="text-sm text-muted-foreground">Bienvenido, {user?.name}</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Compras", value: stats.purchases, icon: ShoppingCart, color: "bg-primary/10 text-primary", onClick: () => setActiveTab("purchases") },
          { title: "Guardados", value: stats.saved, icon: Bookmark, color: "bg-dorado/10 text-dorado", onClick: () => setActiveTab("saved") },
          { title: "Siguiendo", value: stats.following, icon: Users, color: "bg-green-100 dark:bg-green-900/20 text-green-600", onClick: () => setActiveTab("following") },
          { title: "Gastado", value: formatPrice(stats.totalSpent), icon: TrendingUp, color: "bg-volcan/10 text-volcan", onClick: undefined, isText: true },
        ].map(stat => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card
              className={`hover:shadow-lg transition-all ${stat.onClick ? "cursor-pointer" : ""}`}
              onClick={stat.onClick}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className={`font-bold ${stat.isText ? "text-lg" : "text-xl"}`}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="purchases" className="text-xs sm:text-sm">
              <ShoppingCart className="h-4 w-4 mr-1 sm:mr-2" /> Compras
            </TabsTrigger>
            <TabsTrigger value="saved" className="text-xs sm:text-sm">
              <Bookmark className="h-4 w-4 mr-1 sm:mr-2" /> Guardados
            </TabsTrigger>
            <TabsTrigger value="following" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1 sm:mr-2" /> Siguiendo
            </TabsTrigger>
          </TabsList>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="mt-4">
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Sin compras aún</h3>
                  <p className="text-sm text-muted-foreground mb-4">Explora productos y realiza tu primera compra</p>
                  <Button className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white" onClick={() => navigate("home")}>
                    Explorar Productos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {transactions.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-card border hover:shadow-md transition-shadow"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {t.product?.images?.[0] ? (
                          <img src={t.product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{t.product?.title || "Producto"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.seller && (
                            <span className="text-xs text-muted-foreground">
                              {t.seller.businessProfile?.businessName || t.seller.name}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(t.createdAt).toLocaleDateString("es-NI")}
                          </span>
                        </div>
                        {t.paymentMethod && (
                          <span className="text-xs text-muted-foreground mt-0.5 block">{t.paymentMethod}</span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm">{formatPrice(t.amount)}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {getStatusIcon(t.status)}
                          {getStatusBadge(t.status)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Saved Products Tab */}
          <TabsContent value="saved" className="mt-4">
            {savedProducts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Sin productos guardados</h3>
                  <p className="text-sm text-muted-foreground mb-4">Guarda productos que te interesen para encontrarlos fácilmente</p>
                  <Button className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white" onClick={() => navigate("home")}>
                    Explorar Productos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {savedProducts.slice(0, 12).map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className="product-card cursor-pointer"
                        onClick={() => navigate("product-detail", { productId: s.product.id })}
                      >
                        <CardContent className="p-3 flex gap-3">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {s.product?.images?.[0] ? (
                              <img src={s.product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">📦</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{s.product.title}</h4>
                            <p className="font-bold text-primary text-sm mt-1">
                              {formatPrice(s.product.discountPrice || s.product.price)}
                            </p>
                            {s.product.seller && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {s.product.seller.businessProfile?.businessName || s.product.seller.name}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Guardado {new Date(s.createdAt).toLocaleDateString("es-NI")}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                const res = await fetch("/api/saved", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ productId: s.product.id }),
                                })
                                const d = await res.json()
                                if (d.success) {
                                  setSavedProducts(prev => prev.filter(sp => sp.id !== s.id))
                                  toast.success("Producto eliminado de guardados")
                                }
                              } catch {
                                toast.error("Error al eliminar")
                              }
                            }}
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="mt-4">
            {followingVendors.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Store className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">No sigues a ningún vendedor</h3>
                  <p className="text-sm text-muted-foreground mb-4">Sigue a vendedores para recibir novedades de sus productos</p>
                  <Button className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white" onClick={() => navigate("home")}>
                    Explorar Vendedores
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {followingVendors.map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate("vendor-profile", { vendorId: v.id })}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={v.businessProfile?.logo || v.avatar || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {(v.businessProfile?.businessName || v.name).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">
                            {v.businessProfile?.businessName || v.name}
                          </h4>
                          {v.businessProfile?.category && (
                            <Badge variant="secondary" className="text-[10px] mt-1">{v.businessProfile.category}</Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const res = await fetch("/api/follow", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ followingId: v.id }),
                              })
                              const d = await res.json()
                              if (d.success) {
                                setFollowingVendors(prev => prev.filter(fv => fv.id !== v.id))
                                toast.success("Dejaste de seguir")
                              }
                            } catch {
                              toast.error("Error al dejar de seguir")
                            }
                          }}
                        >
                          Siguiendo
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Explorar", icon: Package, view: "home" as const },
            { label: "Cotizaciones", icon: FileText, view: "cotizaciones" as const },
            { label: "Chats", icon: Users, view: "chat-list" as const },
            { label: "Mi Perfil", icon: Users, view: "profile" as const },
          ].map(action => (
            <motion.div key={action.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="h-20 w-full flex-col gap-1.5 hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={() => navigate(action.view)}
              >
                <action.icon className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
