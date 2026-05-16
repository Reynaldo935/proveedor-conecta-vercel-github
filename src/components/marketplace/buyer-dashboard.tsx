"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { ShoppingCart, Heart, FileText, DollarSign, ChevronLeft, Bookmark, Users } from "lucide-react"

export function BuyerDashboard() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState<any[]>([])
  const [savedProducts, setSavedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/transactions?role=buyer").then(r => r.json()),
      fetch("/api/saved").then(r => r.json()),
    ]).then(([transData, savedData]) => {
      if (transData.success) setTransactions(transData.data)
      if (savedData.success) setSavedProducts(savedData.data)
    }).catch(() => toast.error("Error al cargar datos"))
    .finally(() => setLoading(false))
  }, [])

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">Mi Panel</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><ShoppingCart className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Compras</p><p className="text-xl font-bold">{transactions.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Bookmark className="h-5 w-5 text-dorado" /><div><p className="text-xs text-muted-foreground">Guardados</p><p className="text-xl font-bold">{savedProducts.length}</p></div></CardContent></Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate("cotizaciones")}><CardContent className="p-4 flex items-center gap-3"><FileText className="h-5 w-5 text-green-600" /><div><p className="text-xs text-muted-foreground">Cotizaciones</p><p className="text-xl font-bold">0</p></div></CardContent></Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate("map")}><CardContent className="p-4 flex items-center gap-3"><Users className="h-5 w-5 text-volcan" /><div><p className="text-xs text-muted-foreground">Siguiendo</p><p className="text-xl font-bold">0</p></div></CardContent></Card>
      </div>

      {/* Recent Purchases */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Historial de Compras</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8"><p className="text-muted-foreground">Sin compras aún</p><Button className="mt-3 bg-primary" onClick={() => navigate("home")}>Explorar Productos</Button></div>
          ) : (
            <div className="space-y-2">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {t.product?.images?.[0] ? <img src={t.product.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.product?.title || "Producto"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("es-NI")} · {t.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatPrice(t.amount)}</p>
                    <Badge variant={t.status === "COMPLETED" ? "default" : "secondary"} className={t.status === "COMPLETED" ? "bg-green-600 text-xs" : "text-xs"}>
                      {t.status === "COMPLETED" ? "Completado" : t.status === "PENDING" ? "Pendiente" : t.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Products */}
      {savedProducts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Bookmark className="h-5 w-5" /> Productos Guardados</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedProducts.slice(0, 6).map(s => (
                <Card key={s.id} className="product-card cursor-pointer" onClick={() => navigate("product-detail", { productId: s.product.id })}>
                  <CardContent className="p-3 flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {s.product?.images?.[0] ? <img src={s.product.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">📦</div>}
                    </div>
                    <div><h4 className="font-medium text-sm">{s.product.title}</h4><p className="font-bold text-primary text-sm">{formatPrice(s.product.discountPrice || s.product.price)}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
