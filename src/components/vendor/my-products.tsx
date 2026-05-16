"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Heart, MapPin, Edit2, Trash2, Pause, Play, ChevronLeft } from "lucide-react"
import { PRODUCT_CATEGORIES } from "@/lib/validators"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export function MyProducts() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/products?sellerId=${user?.id}&limit=100`)
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data) })
      .catch(() => toast.error("Error al cargar productos"))
      .finally(() => setLoading(false))
  }, [user?.id])

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"
    const res = await fetch(`/api/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) })
    if ((await res.json()).success) {
      setProducts(ps => ps.map(p => p.id === id ? { ...p, status: newStatus } : p))
      toast.success(newStatus === "ACTIVE" ? "Producto activado" : "Producto pausado")
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
    if ((await res.json()).success) {
      setProducts(ps => ps.map(p => p.id === id ? { ...p, status: "DELETED" } : p))
      toast.success("Producto eliminado")
    }
  }

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>

  const activeProducts = products.filter(p => p.status !== "DELETED")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("vendor-dashboard")}><ChevronLeft className="h-4 w-4 mr-1" /> Dashboard</Button>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">Mis Productos</h1>
        </div>
        <Button className="bg-primary" onClick={() => navigate("sell-product")}>+ Nuevo Producto</Button>
      </div>

      {activeProducts.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><p className="text-2xl mb-2">📦</p><p>No tienes productos</p><Button className="mt-4 bg-primary" onClick={() => navigate("sell-product")}>Publicar Producto</Button></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {activeProducts.map(product => (
            <Card key={product.id} className={`overflow-hidden ${product.status === "PAUSED" ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium truncate">{product.title}</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                          {product.discountPrice ? (
                            <>
                              <span className="font-bold text-volcan">{formatPrice(product.discountPrice)}</span>
                              <span className="text-sm line-through text-muted-foreground">{formatPrice(product.price)}</span>
                              <Badge variant="secondary" className="text-[10px]">-{product.discountPercent}%</Badge>
                            </>
                          ) : (
                            <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"} className={product.status === "ACTIVE" ? "bg-green-600" : ""}>{product.status === "ACTIVE" ? "Activo" : "Pausado"}</Badge>
                          {product.category && <span className="text-xs text-muted-foreground">{product.category}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("edit-product", { editProductId: product.id })}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStatusToggle(product.id, product.status)}>
                          {product.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. El producto dejará de mostrarse.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-destructive">Eliminar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
