"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Package, Heart, DollarSign, FileText, TrendingUp, Plus, BarChart3, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

export function VendorDashboard() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then(r => r.json()),
      fetch("/api/transactions?role=seller").then(r => r.json()),
    ]).then(([statsData, transData]) => {
      if (statsData.success) setStats(statsData.data)
      if (transData.success) setRecentTransactions(transData.data.slice(0, 5))
    }).catch(() => toast.error("Error al cargar estadísticas"))
    .finally(() => setLoading(false))
  }, [])

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)

  const categoryData = [
    { name: "Alimentos", value: 35 },
    { name: "Construcción", value: 25 },
    { name: "Tecnología", value: 20 },
    { name: "Otros", value: 20 },
  ]
  const COLORS = ["#00695C", "#D4A017", "#C0392B", "#2E7D32"]

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">Dashboard del Vendedor</h1>
        <Button className="bg-primary" onClick={() => navigate("sell-product")}><Plus className="h-4 w-4 mr-1" /> Vender</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("my-products")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Productos</p><p className="text-xl font-bold">{stats?.totalProducts || 0}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20"><ShoppingCart className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-xs text-muted-foreground">Activos</p><p className="text-xl font-bold">{stats?.activeProducts || 0}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dorado/10"><Heart className="h-5 w-5 text-dorado" /></div>
            <div><p className="text-xs text-muted-foreground">Likes</p><p className="text-xl font-bold">{stats?.totalLikes || 0}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-volcan/10"><DollarSign className="h-5 w-5 text-volcan" /></div>
            <div><p className="text-xs text-muted-foreground">Ingresos</p><p className="text-xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Ventas por Categoría</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#00695C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Distribución</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name }) => name}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => navigate("my-products")}><Package className="h-6 w-6" /><span className="text-xs">Mis Productos</span></Button>
        <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => navigate("cotizaciones")}><FileText className="h-6 w-6" /><span className="text-xs">Cotizaciones</span></Button>
        <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => navigate("chat-list")}><Heart className="h-6 w-6" /><span className="text-xs">Chats</span></Button>
        <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => navigate("profile")}><DollarSign className="h-6 w-6" /><span className="text-xs">Mi Perfil</span></Button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Transacciones Recientes</CardTitle></CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Sin transacciones aún</p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{t.product?.title || "Producto"}</p>
                    <p className="text-xs text-muted-foreground">{t.buyer?.name} · {new Date(t.createdAt).toLocaleDateString("es-NI")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(t.amount)}</p>
                    <Badge variant={t.status === "COMPLETED" ? "default" : "secondary"} className={t.status === "COMPLETED" ? "bg-green-600" : ""}>{t.status === "COMPLETED" ? "Completado" : "Pendiente"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
