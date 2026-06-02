"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Edit2, Trash2, Pause, Play, ChevronLeft, Plus, Search, Filter, Package, Loader2, ToggleLeft, ToggleRight } from "lucide-react"
import { PRODUCT_CATEGORIES } from "@/lib/validators"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { motion, AnimatePresence } from "framer-motion"

export function MyProducts() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL")
  const [filterCategory, setFilterCategory] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`/api/products?sellerId=${user?.id}&limit=100`)
        const d = await res.json()
        if (d.success) setProducts(d.data)
      } catch {
        toast.error("Error al cargar productos")
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) loadProducts()
  }, [user?.id])

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"
    setTogglingId(id)
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const d = await res.json()
      if (d.success) {
        setProducts(ps => ps.map(p => p.id === id ? { ...p, status: newStatus } : p))
        toast.success(newStatus === "ACTIVE" ? "Producto activado" : "Producto pausado")
      } else {
        toast.error("Error al cambiar estado")
      }
    } catch {
      toast.error("No se pudo conectar. Intenta de nuevo.")
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      const d = await res.json()
      if (d.success) {
        setProducts(ps => ps.filter(p => p.id !== id))
        toast.success("Producto eliminado")
      } else {
        toast.error("Error al eliminar")
      }
    } catch {
      toast.error("No se pudo conectar. Intenta de nuevo.")
    } finally {
      setDeletingId(null)
    }
  }

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)

  // Filter products
  const activeProducts = products.filter(p => p.status !== "DELETED")
  const filteredProducts = activeProducts.filter(p => {
    if (filterStatus !== "ALL" && p.status !== filterStatus) return false
    if (filterCategory && p.category !== filterCategory) return false
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const stats = {
    total: activeProducts.length,
    active: activeProducts.filter(p => p.status === "ACTIVE").length,
    paused: activeProducts.filter(p => p.status === "PAUSED").length,
  }

  const sellerCategories = [...new Set(activeProducts.map(p => p.category).filter(Boolean))]

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("vendor-dashboard")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">Mis Productos</h1>
        </div>
        <Button className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white shadow-md" onClick={() => navigate("sell-product")}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo Producto
        </Button>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: stats.total, color: "bg-primary/10 text-primary" },
          { label: "Activos", value: stats.active, color: "bg-green-100 dark:bg-green-900/20 text-green-600" },
          { label: "Pausados", value: stats.paused, color: "bg-amber-100 dark:bg-amber-900/20 text-amber-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className={`text-xs font-medium ${s.color}`}>{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      {activeProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              {(["ALL", "ACTIVE", "PAUSED"] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    filterStatus === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-muted"
                  }`}
                >
                  {status === "ALL" ? "Todos" : status === "ACTIVE" ? "Activos" : "Pausados"}
                </button>
              ))}
            </div>
            {sellerCategories.length > 1 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 text-xs border rounded-lg bg-white text-black"
              >
                <option value="">Todas las categorías</option>
                {sellerCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Products List */}
      {activeProducts.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Sin productos aún</h3>
              <p className="text-sm text-muted-foreground mb-4">Publicá tu primer producto para empezar a vender</p>
              <Button className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white" onClick={() => navigate("sell-product")}>
                <Plus className="h-4 w-4 mr-1" /> Publicar Producto
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No se encontraron productos con esos filtros</p>
            <Button variant="link" className="mt-2" onClick={() => { setSearchQuery(""); setFilterStatus("ALL"); setFilterCategory(""); }}>
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`overflow-hidden transition-all hover:shadow-md ${product.status === "PAUSED" ? "opacity-60" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div
                        className="w-24 h-24 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => navigate("product-detail", { productId: product.id })}
                      >
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-muted to-muted/50">📦</div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3
                              className="font-medium truncate cursor-pointer hover:text-primary transition-colors"
                              onClick={() => navigate("product-detail", { productId: product.id })}
                            >
                              {product.title}
                            </h3>
                            <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                              {product.discountPrice ? (
                                <>
                                  <span className="font-bold text-volcan">{formatPrice(product.discountPrice)}</span>
                                  <span className="text-sm line-through text-muted-foreground">{formatPrice(product.price)}</span>
                                  <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    -{product.discountPercent}%
                                  </Badge>
                                </>
                              ) : (
                                <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <Badge
                                variant={product.status === "ACTIVE" ? "default" : "secondary"}
                                className={`text-[10px] ${product.status === "ACTIVE" ? "bg-green-600" : "bg-amber-500"}`}
                              >
                                {product.status === "ACTIVE" ? "● Activo" : "● Pausado"}
                              </Badge>
                              {product.category && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{product.category}</span>
                              )}
                              {product.likeCount > 0 && (
                                <span className="text-xs text-muted-foreground">❤️ {product.likeCount}</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 hover:bg-primary/10"
                              onClick={() => navigate("edit-product", { editProductId: product.id })}
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                              onClick={() => handleStatusToggle(product.id, product.status)}
                              disabled={togglingId === product.id}
                              title={product.status === "ACTIVE" ? "Pausar" : "Activar"}
                            >
                              {togglingId === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : product.status === "ACTIVE" ? (
                                <Pause className="h-4 w-4 text-amber-600" />
                              ) : (
                                <Play className="h-4 w-4 text-green-600" />
                              )}
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 hover:bg-red-100 dark:hover:bg-red-900/20"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El producto &quot;{product.title}&quot; será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(product.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deletingId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
