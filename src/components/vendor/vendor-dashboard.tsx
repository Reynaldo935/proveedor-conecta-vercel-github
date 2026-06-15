"use client"

import { useState, useEffect, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { authFetch } from "@/lib/client-auth"
import {
  Package, Heart, DollarSign, FileText, TrendingUp, Plus,
  BarChart3, ShoppingCart, MessageCircle, Users, ArrowUpRight,
  TrendingDown, AlertCircle,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
} from "recharts"
import { motion } from "framer-motion"

const COLORS = ["#1A5276", "#F4D03F", "#C0392B", "#2E7D32", "#F57F17"]

// Cost estimation constants
const COMMISSION_RATE = 0.03
const ESTIMATED_PRODUCT_COST_RATIO = 0.60 // 60% of price is estimated product cost

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

// Build monthly profit/loss data from completed transactions
function buildMonthlyPLData(transactions: any[]) {
  const completed = transactions.filter((t: any) => t.status === "COMPLETED")
  if (completed.length === 0) return []

  const monthMap: Record<string, { revenue: number; commission: number; productCost: number }> = {}
  completed.forEach((t: any) => {
    const date = new Date(t.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const amount = t.amount || 0
    const commission = t.commission || (amount * COMMISSION_RATE)
    const productCost = amount * ESTIMATED_PRODUCT_COST_RATIO

    if (!monthMap[key]) {
      monthMap[key] = { revenue: 0, commission: 0, productCost: 0 }
    }
    monthMap[key].revenue += amount
    monthMap[key].commission += commission
    monthMap[key].productCost += productCost
  })

  const sorted = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
  return sorted.map(([key, val]) => {
    const totalCosts = val.commission + val.productCost
    const netProfit = val.revenue - totalCosts
    const monthLabel = key.split('-')
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const name = `${monthNames[parseInt(monthLabel[1]) - 1]}/${monthLabel[0].slice(2)}`
    return {
      name,
      revenue: Math.round(val.revenue),
      costs: Math.round(totalCosts),
      netProfit: Math.round(netProfit),
    }
  })
}

// Build per-product profitability data
function buildProductProfitability(transactions: any[]) {
  const completed = transactions.filter((t: any) => t.status === "COMPLETED")
  if (completed.length === 0) return []

  const productMap: Record<string, {
    name: string
    revenue: number
    commission: number
    productCost: number
    sales: number
  }> = {}

  completed.forEach((t: any) => {
    const productId = t.productId || t.product?.id || "unknown"
    const productName = t.product?.title || "Producto sin nombre"
    const amount = t.amount || 0
    const commission = t.commission || (amount * COMMISSION_RATE)
    const productCost = amount * ESTIMATED_PRODUCT_COST_RATIO

    if (!productMap[productId]) {
      productMap[productId] = { name: productName, revenue: 0, commission: 0, productCost: 0, sales: 0 }
    }
    productMap[productId].revenue += amount
    productMap[productId].commission += commission
    productMap[productId].productCost += productCost
    productMap[productId].sales += 1
  })

  return Object.values(productMap)
    .map(p => {
      const totalCosts = p.commission + p.productCost
      const netProfit = p.revenue - totalCosts
      const margin = p.revenue > 0 ? (netProfit / p.revenue) * 100 : 0
      return {
        name: p.name,
        revenue: Math.round(p.revenue),
        estimatedCost: Math.round(totalCosts),
        netProfit: Math.round(netProfit),
        margin: Math.round(margin * 10) / 10,
        sales: p.sales,
      }
    })
    .sort((a, b) => b.netProfit - a.netProfit)
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
  const [error, setError] = useState<string | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      authFetch("/api/stats").then(r => r.json()).catch(() => ({ success: false })),
      authFetch("/api/transactions?role=seller").then(r => r.json()).catch(() => ({ success: false })),
      authFetch(`/api/products?sellerId=${user?.id}&limit=100`).then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([statsData, transData, productsData]) => {
      if (cancelled) return
      if (statsData.success) setStats(statsData.data)
      if (transData.success) setRecentTransactions(transData.data)
      if (productsData.success) setProducts(productsData.data)
      if (!statsData.success && !transData.success && !productsData.success) {
        setError("Error al cargar los datos. Intenta de nuevo.")
      }
    }).catch(() => {
      if (!cancelled) {
        setError("Error de conexión al cargar estadísticas")
        toast.error("Error al cargar estadísticas")
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [user?.id])

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)

  const hasCompletedTransactions = recentTransactions.some((t: any) => t.status === "COMPLETED")

  const monthlyPLData = useMemo(() => buildMonthlyPLData(recentTransactions), [recentTransactions])
  const productProfitability = useMemo(() => buildProductProfitability(recentTransactions), [recentTransactions])

  // Revenue data for the existing chart
  const revenueData = useMemo(() => {
    if (!hasCompletedTransactions) return []
    const completed = recentTransactions.filter((t: any) => t.status === "COMPLETED")
    const monthMap: Record<string, number> = {}
    completed.forEach((t: any) => {
      const date = new Date(t.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthMap[key] = (monthMap[key] || 0) + (t.amount || 0)
    })
    const sorted = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
    if (sorted.length > 0) {
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      return sorted.map(([key, val]) => {
        const parts = key.split('-')
        const name = `${monthNames[parseInt(parts[1]) - 1]}/${parts[0].slice(2)}`
        return { name, revenue: Math.round(val) }
      })
    }
    return []
  }, [recentTransactions, hasCompletedTransactions])

  const categoryData = useMemo(() => generateCategoryData(products), [products])

  // Summary stats for profit/loss
  const plSummary = useMemo(() => {
    if (!hasCompletedTransactions) return null
    const completed = recentTransactions.filter((t: any) => t.status === "COMPLETED")
    const totalRevenue = completed.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
    const totalCommission = completed.reduce((sum: number, t: any) => sum + (t.commission || (t.amount || 0) * COMMISSION_RATE), 0)
    const totalProductCost = totalRevenue * ESTIMATED_PRODUCT_COST_RATIO
    const totalCosts = totalCommission + totalProductCost
    const netProfit = totalRevenue - totalCosts
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    return {
      totalRevenue: Math.round(totalRevenue),
      totalCommission: Math.round(totalCommission),
      totalProductCost: Math.round(totalProductCost),
      totalCosts: Math.round(totalCosts),
      netProfit: Math.round(netProfit),
      margin: Math.round(margin * 10) / 10,
    }
  }, [recentTransactions, hasCompletedTransactions])

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" className="mt-3" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
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
              {revenueData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-3 opacity-40" />
                  <p className="font-medium">No hay datos de ventas aún</p>
                  <p className="text-xs mt-1">Los ingresos aparecerán cuando los clientes compren tus productos</p>
                </div>
              ) : (
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
              )}
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

      {/* Profit/Loss Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {plSummary && plSummary.netProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              Ganancias y Pérdidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasCompletedTransactions ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mb-3 opacity-40" />
                <p className="font-medium">No hay datos de ventas aún</p>
                <p className="text-xs mt-1">El análisis de ganancias aparecerá cuando tengas ventas completadas</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profit/Loss Summary Cards */}
                {plSummary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-xl border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Ingresos Totales</p>
                      <p className="font-bold text-sm mt-1">{formatPrice(plSummary.totalRevenue)}</p>
                    </div>
                    <div className="rounded-xl border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Costos Estimados</p>
                      <p className="font-bold text-sm mt-1 text-red-600">{formatPrice(plSummary.totalCosts)}</p>
                    </div>
                    <div className={`rounded-xl border p-3 text-center ${plSummary.netProfit >= 0 ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
                      <p className="text-xs text-muted-foreground">Ganancia Neta</p>
                      <p className={`font-bold text-sm mt-1 ${plSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {plSummary.netProfit >= 0 ? '+' : ''}{formatPrice(plSummary.netProfit)}
                      </p>
                    </div>
                    <div className={`rounded-xl border p-3 text-center ${plSummary.margin >= 0 ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
                      <p className="text-xs text-muted-foreground">Margen</p>
                      <p className={`font-bold text-sm mt-1 ${plSummary.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {plSummary.margin >= 0 ? '+' : ''}{plSummary.margin}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Monthly P/L Chart */}
                {monthlyPLData.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Ganancias/Pérdidas Mensuales</h4>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={monthlyPLData} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            color: "var(--foreground)",
                            fontSize: "12px",
                          }}
                          formatter={(value: any, name: any) => {
                            const labels: Record<string, string> = {
                              revenue: "Ingresos",
                              costs: "Costos",
                              netProfit: "Ganancia Neta",
                            }
                            return [formatPrice(Number(value)), labels[String(name)] || String(name)]
                          }}
                        />
                        <Legend
                          formatter={(value: string) => {
                            const labels: Record<string, string> = {
                              revenue: "Ingresos",
                              costs: "Costos",
                              netProfit: "Ganancia Neta",
                            }
                            return labels[value] || value
                          }}
                        />
                        <Bar dataKey="revenue" fill="#1A5276" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="costs" fill="#C0392B" radius={[4, 4, 0, 0]} opacity={0.7} />
                        <Bar dataKey="netProfit" radius={[4, 4, 0, 0]}>
                          {monthlyPLData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.netProfit >= 0 ? "#2E7D32" : "#E53935"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      * Costos estimados: 3% comisión + 60% costo de producto sobre el precio de venta
                    </p>
                  </div>
                )}

                {/* Per-Product Profitability Table */}
                {productProfitability.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Rentabilidad por Producto</h4>
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Producto</TableHead>
                            <TableHead className="text-xs text-right">Ingresos</TableHead>
                            <TableHead className="text-xs text-right">Costo Est.</TableHead>
                            <TableHead className="text-xs text-right">Ganancia</TableHead>
                            <TableHead className="text-xs text-right">Margen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productProfitability.slice(0, 10).map((p, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-medium max-w-[160px] truncate">{p.name}</TableCell>
                              <TableCell className="text-xs text-right">{formatPrice(p.revenue)}</TableCell>
                              <TableCell className="text-xs text-right text-red-600">{formatPrice(p.estimatedCost)}</TableCell>
                              <TableCell className={`text-xs text-right font-medium ${p.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {p.netProfit >= 0 ? '+' : ''}{formatPrice(p.netProfit)}
                              </TableCell>
                              <TableCell className="text-xs text-right">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${
                                    p.margin >= 30
                                      ? 'border-green-300 text-green-700 dark:text-green-400 dark:border-green-700'
                                      : p.margin >= 0
                                        ? 'border-yellow-300 text-yellow-700 dark:text-yellow-400 dark:border-yellow-700'
                                        : 'border-red-300 text-red-700 dark:text-red-400 dark:border-red-700'
                                  }`}
                                >
                                  {p.margin >= 0 ? '+' : ''}{p.margin}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {productProfitability.length > 10 && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Mostrando 10 de {productProfitability.length} productos
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

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
