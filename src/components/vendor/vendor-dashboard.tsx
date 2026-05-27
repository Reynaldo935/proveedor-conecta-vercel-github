"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { authFetch } from "@/lib/client-auth"
import {
  Package, Heart, DollarSign, FileText, TrendingUp, Plus,
  BarChart3, ShoppingCart, MessageCircle, Users, Loader2, ArrowUpRight
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from "recharts"
import { motion } from "framer-motion"

const COLORS = ["#1A5276", "#F4D03F", "#C0392B", "#2E7D32", "#F57F17"]

// Generate monthly revenue data from transactions
function generateRevenueData(transactions: any[]) {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
  const completed = transactions.filter((t: any) => t.status === "COMPLETED")

  // If we have real data, aggregate by month
  if (completed.length > 0) {
    const monthMap: Record<string, number> = {}
    completed.forEach((t: any) => {
      const date = new Date(t.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthMap[key] = (monthMap[key] || 0) + (t.amount || 0)
    })
    const sorted = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
    if (sorted.length > 0) {
      return sorted.map(([key, val]) => ({
        name: key.split('-')[1] + '/' + key.slice(2, 4),
        revenue: val,
      }))
    }
  }

  // Fallback demo data
  return months.map(m => ({
    name: m,
    revenue: Math.floor(Math.random() * 15000) + 3000,
  }))
}

// Generate category distribution from products
function generateCategoryData(products: any[]) {
  if (products && products.length > 0) {
    const catMap: Record<string, number> = {}
    products.forEach((p: any) => {
      const cat = p.category || "Otros"
      catMap[cat] = (catMap[cat] || 0) + 1
    })
    return Object.entries(catMap).map(([name, value]) => ({ name, value }))
  }
  return [
    { name: "Alimentos", value: 35 },
    { name: "Construcción", value: 25 },
    { name: "Tecnología", value: 20 },
    { name: "Otros", value: 20 },
  ]
}

interface Stats {
  totalProducts: number
  activeProducts: number
  totalLikes: number
  totalTransactions: number
  totalRevenue: number
  pendingCotizaciones: number
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

export function VendorDashboard() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      authFetch("/api/stats").then(r => r.json()).catch(() => ({ success: false })),
      authFetch("/api/transactions?role=seller").then(r => r.json()).catch(() => ({ success: false })),
      authFetch(`/api/products?sellerId=${user?.id}&limit=100`).then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([statsData, transData, productsData]) => {
      if (statsData.success) setStats(statsData.data)
      if (transData.success) setRecentTransactions(transData.data)
      if (productsData.success) setProducts(productsData.data)
    }).catch(() => toast.error("Error al cargar estadísticas"))
    .finally(() => setLoading(false))
  }, [user?.id])

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)

  const revenueData = generateRevenueData(recentTransactions)
  const categoryData = generateCategoryData(products)

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const statCards = [
    { title: "Productos", value: stats?.totalProducts || 0, icon: Package, color: "bg-primary/10 text-primary", onClick: () => navigate("my-products") },
    { title: "Activos", value: stats?.activeProducts || 0, icon: ShoppingCart, color: "bg-green-100 dark:bg-green-900/20 text-green-600", onClick: () => navigate("my-products") },
    { title: "Likes", value: stats?.totalLikes || 0, icon: Heart, color: "bg-dorado/10 text-dorado", onClick: undefined },
    { title: "Ingresos", value: formatPrice(stats?.totalRevenue || 0), icon: DollarSign, color: "bg-volcan/10 text-volcan", onClick: undefined, isText: true },
  ]

  const quickActions = [
    { label: "Mis Productos", icon: Package, view: "my-products" as const },
    { label: "Cotizaciones", icon: FileText, view: "cotizaciones" as const },
    { label: "Chats", icon: MessageCircle, view: "chat-list" as const },
    { label: "Mi Perfil", icon: Users, view: "profile" as const },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Bienvenido, {user?.name}</p>
        </div>
        <Button className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white shadow-md" onClick={() => navigate("sell-product")}>
          <Plus className="h-4 w-4 mr-1" /> Vender
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            className={stat.onClick ? "cursor-pointer" : ""}
            onClick={stat.onClick}
          >
            <Card className="hover:shadow-lg transition-all duration-300 h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className={`font-bold ${stat.isText ? "text-lg" : "text-xl"}`}>{stat.value}</p>
                </div>
                {stat.onClick && <ArrowUpRight className="h-4 w-4 text-muted-foreground ml-auto" />}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart + Category Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A5276" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1A5276" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                    }}
                    formatter={(value: unknown) => [formatPrice(Number(value)), "Ingresos"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#1A5276" strokeWidth={2} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Categorías
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "var(--muted-foreground)" }}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
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

      {/* Recent Transactions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Transacciones Recientes</CardTitle>
              {recentTransactions.length > 5 && (
                <Button variant="ghost" size="sm" className="text-primary">
                  Ver todas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Sin transacciones aún</p>
                <p className="text-xs text-muted-foreground mt-1">Las transacciones aparecerán cuando los clientes compren tus productos</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentTransactions.slice(0, 8).map((t: any) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {t.product?.images?.[0] ? (
                          <img src={t.product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.product?.title || "Producto"}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.buyer?.name} · {new Date(t.createdAt).toLocaleDateString("es-NI")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatPrice(t.amount)}</p>
                      <Badge
                        variant={t.status === "COMPLETED" ? "default" : "secondary"}
                        className={`text-[10px] ${t.status === "COMPLETED" ? "bg-green-600" : ""}`}
                      >
                        {t.status === "COMPLETED" ? "Completado" : t.status === "PENDING" ? "Pendiente" : t.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
