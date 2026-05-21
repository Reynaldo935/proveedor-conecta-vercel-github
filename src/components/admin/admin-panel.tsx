"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts"
import { toast } from "sonner"
import {
  ChevronLeft,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Shield,
  Activity,
  ShoppingBag,
  Heart,
  MessageSquare,
  RefreshCw,
  Download,
} from "lucide-react"
import { motion } from "framer-motion"

interface AdminStats {
  totalUsers: number
  totalSellers: number
  totalBuyers: number
  totalProducts: number
  activeProducts: number
  totalTransactions: number
  completedTransactions: number
  totalRevenue: number
  commission: number
  totalLikes: number
  totalMessages: number
  recentSignups: number
  recentTransactions: {
    id: string
    amount: number
    status: string
    paymentMethod: string
    createdAt: string
    buyer: { name: string; email: string }
    product: { title: string; price: number }
  }[]
}

const COLORS = ["#1A5276", "#2E86C1", "#1E8449", "#F4D03F", "#C0392B", "#8E44AD"]

export function AdminPanel() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/stats")
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      } else {
        toast.error(data.error || "Error al cargar estadísticas")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  // Verify admin access (after hooks)
  if (user?.email !== "rey7214935@gmail.com") {
    return (
      <div className="text-center py-16">
        <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Acceso Denegado</h2>
        <p className="text-muted-foreground mt-2">Solo el administrador puede acceder a este panel.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("home")}>
          Volver al Inicio
        </Button>
      </div>
    )
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadStats()
    toast.success("Estadísticas actualizadas")
  }

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(amount)

  // Chart data
  const userTypeData = stats ? [
    { name: "Vendedores", value: stats.totalSellers, color: "#1A5276" },
    { name: "Compradores", value: stats.totalBuyers, color: "#2E86C1" },
  ] : []

  const transactionData = stats ? [
    { name: "Completadas", value: stats.completedTransactions, color: "#1E8449" },
    { name: "Pendientes", value: stats.totalTransactions - stats.completedTransactions, color: "#F4D03F" },
  ] : []

  const revenueData = stats?.recentTransactions.slice(0, 7).map((t, i) => ({
    name: `T${i + 1}`,
    monto: t.amount,
  })) || []

  const statCards = stats ? [
    { label: "Usuarios", value: stats.totalUsers, icon: Users, color: "#1A5276", sub: `+${stats.recentSignups} esta semana` },
    { label: "Productos", value: stats.totalProducts, icon: Package, color: "#2E86C1", sub: `${stats.activeProducts} activos` },
    { label: "Ingresos", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "#1E8449", sub: `Comisión: ${formatPrice(stats.commission)}` },
    { label: "Transacciones", value: stats.totalTransactions, icon: ShoppingBag, color: "#F4D03F", sub: `${stats.completedTransactions} completadas` },
    { label: "Likes", value: stats.totalLikes, icon: Heart, color: "#C0392B", sub: "Interacciones" },
    { label: "Mensajes", value: stats.totalMessages, icon: MessageSquare, color: "#8E44AD", sub: "Chat total" },
  ] : []

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("home")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Panel de Administración
            </h1>
            <p className="text-sm text-muted-foreground">
              Bienvenido, {user?.name} · Super Admin
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${card.color}15` }}>
                    <card.icon className="h-4 w-4" style={{ color: card.color }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <p className="text-xl font-bold">{card.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Commission Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white border-0">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Comisión 3% Automática
              </h3>
              <p className="text-sm text-white/80 mt-1">
                Cada transacción genera un 3% de comisión que se transfiere automáticamente a la cuenta LAFISE.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{formatPrice(stats?.commission || 0)}</p>
              <p className="text-xs text-white/60">Comisión acumulada</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Ingresos Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value: number) => formatPrice(value)} />
                    <Bar dataKey="monto" fill="#1A5276" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Transaction Status Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" /> Estado de Transacciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={transactionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {transactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transacciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.recentTransactions.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {t.buyer?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.product?.title || "Producto"}</p>
                        <p className="text-xs text-muted-foreground">{t.buyer?.name || "Comprador"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatPrice(t.amount)}</p>
                        <Badge variant={t.status === "COMPLETED" ? "default" : "secondary"} className="text-[10px]">
                          {t.status === "COMPLETED" ? "Completada" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay transacciones recientes</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Type Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Distribución de Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estadísticas de Usuarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm">Total de usuarios</span>
                  </div>
                  <span className="font-bold">{stats?.totalUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#1A5276]" />
                    <span className="text-sm">Vendedores</span>
                  </div>
                  <span className="font-bold">{stats?.totalSellers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#2E86C1]" />
                    <span className="text-sm">Compradores</span>
                  </div>
                  <span className="font-bold">{stats?.totalBuyers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Nuevos registros (7 días)</span>
                  </div>
                  <span className="font-bold text-green-600">+{stats?.recentSignups || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
