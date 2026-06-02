"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts"
import { toast } from "sonner"
import { authFetch } from "@/lib/client-auth"
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
  Loader2,
  Megaphone,
  FileSpreadsheet,
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

const HELPER_ROLE_LABELS: Record<string, string> = {
  DEVELOPER: "Desarrollador",
  MARKETING: "Marketing",
  FULLSTACK: "Fullstack",
  GRAPHIC_DESIGN: "Diseño Gráfico",
  COMMUNICATOR: "Comunicador",
}

export function AdminPanel() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [helpers, setHelpers] = useState<any[]>([])
  const [helperEmail, setHelperEmail] = useState("")
  const [helperRoleSelect, setHelperRoleSelect] = useState("")
  const [assigningHelper, setAssigningHelper] = useState(false)
  const [commissions, setCommissions] = useState<any[]>([])
  const [commissionSummary, setCommissionSummary] = useState({ total: 0, paid: 0, pending: 0 })
  const [ads, setAds] = useState<any[]>([])

  const loadStats = async () => {
    try {
      const res = await authFetch("/api/admin/stats")
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      } else {
        toast.error(data.error || "Error al cargar estadísticas")
      }
    } catch {
      toast.error("No se pudo conectar. Intenta de nuevo.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadHelpers = async () => {
    try {
      const res = await authFetch("/api/admin/helpers")
      const data = await res.json()
      if (data.success) setHelpers(data.data)
    } catch {}
  }

  const loadCommissions = async () => {
    try {
      const res = await authFetch("/api/commissions")
      const data = await res.json()
      if (data.success) {
        setCommissions(data.data.commissions)
        setCommissionSummary(data.data.summary)
      }
    } catch {}
  }

  const loadAds = async () => {
    try {
      const res = await authFetch("/api/advertisements")
      const data = await res.json()
      if (data.success) setAds(data.data)
    } catch {}
  }

  const assignHelperRole = async () => {
    if (!helperEmail || !helperRoleSelect) { toast.error("Email y rol son requeridos"); return }
    setAssigningHelper(true)
    try {
      const userRes = await authFetch(`/api/users/email?email=${encodeURIComponent(helperEmail)}`)
      const userData = await userRes.json()
      if (!userData.success) { toast.error("Usuario no encontrado"); return }

      const res = await authFetch("/api/admin/helpers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userData.data.id, helperRole: helperRoleSelect }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Rol asignado exitosamente")
        setHelperEmail("")
        setHelperRoleSelect("")
        loadHelpers()
      } else {
        toast.error(data.error || "Error al asignar rol")
      }
    } catch { toast.error("No se pudo conectar. Intenta de nuevo.") }
    finally { setAssigningHelper(false) }
  }

  const updateAdStatus = async (adId: string, status: string) => {
    try {
      const res = await authFetch(`/api/advertisements/${adId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(status === "ACTIVE" ? "Anuncio aprobado" : "Anuncio rechazado")
        loadAds()
      }
    } catch { toast.error("Error al actualizar anuncio") }
  }

  useEffect(() => {
    loadStats()
    loadHelpers()
    loadCommissions()
    loadAds()
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
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="helpers">Ayudantes</TabsTrigger>
          <TabsTrigger value="commissions">Comisiones</TabsTrigger>
          <TabsTrigger value="ads">Anuncios</TabsTrigger>
          <TabsTrigger value="exports">Exportar</TabsTrigger>
          <TabsTrigger value="audit" onClick={() => navigate("audit")}>Auditoría</TabsTrigger>
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
                    <Tooltip formatter={(value: unknown) => formatPrice(Number(value))} />
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
        <TabsContent value="helpers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Gestión de Ayudantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Asignar rol a un usuario por email</p>
                <div className="flex gap-2">
                  <Input placeholder="Email del usuario" value={helperEmail} onChange={(e) => setHelperEmail(e.target.value)} className="flex-1" />
                  <Select value={helperRoleSelect} onValueChange={setHelperRoleSelect}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEVELOPER">Desarrollador</SelectItem>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="FULLSTACK">Fullstack</SelectItem>
                      <SelectItem value="GRAPHIC_DESIGN">Diseño Gráfico</SelectItem>
                      <SelectItem value="COMMUNICATOR">Comunicador</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={assignHelperRole} disabled={assigningHelper}>
                    {assigningHelper ? <Loader2 className="h-4 w-4 animate-spin" /> : "Asignar"}
                  </Button>
                </div>
              </div>

              {helpers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay ayudantes asignados</p>
              ) : (
                <div className="space-y-2">
                  {helpers.map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{h.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{h.name}</p>
                          <p className="text-xs text-muted-foreground">{h.email}</p>
                        </div>
                      </div>
                      <Badge>{HELPER_ROLE_LABELS[h.helperRole] || h.helperRole}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Comisiones</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(commissionSummary.total)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Pagadas</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(commissionSummary.paid)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{formatPrice(commissionSummary.pending)}</p>
            </CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Registro de Comisiones</CardTitle></CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay comisiones registradas</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {commissions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{c.transaction?.product?.title || "Producto"}</p>
                        <p className="text-xs text-muted-foreground">Transacción: C${c.transaction?.amount || 0} · {c.destination}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatPrice(c.amount)}</p>
                        <Badge variant={c.status === "PAID" ? "default" : "secondary"} className={`text-[10px] ${c.status === "PAID" ? "bg-green-600" : ""}`}>
                          {c.status === "PAID" ? "Pagada" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Gestión de Anuncios</CardTitle></CardHeader>
            <CardContent>
              {ads.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay anuncios</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ads.map((ad) => (
                    <div key={ad.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {ad.imageUrl ? <img src={ad.imageUrl} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><Megaphone className="h-5 w-5 text-muted-foreground" /></div>}
                        <div>
                          <p className="text-sm font-medium">{ad.title}</p>
                          <p className="text-xs text-muted-foreground">{ad.seller?.name} · {ad.type} · ${ad.amount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={ad.status === "ACTIVE" ? "default" : "secondary"} className={`text-[10px] ${ad.status === "ACTIVE" ? "bg-green-600" : ad.status === "REJECTED" ? "bg-red-600" : ""}`}>
                          {ad.status === "PENDING" ? "Pendiente" : ad.status === "ACTIVE" ? "Activo" : ad.status === "REJECTED" ? "Rechazado" : ad.status}
                        </Badge>
                        {ad.status === "PENDING" && (
                          <>
                            <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateAdStatus(ad.id, "ACTIVE")}>Aprobar</Button>
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => updateAdStatus(ad.id, "REJECTED")}>Rechazar</Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open("/api/export?format=csv&type=transactions", "_blank")}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10"><FileSpreadsheet className="h-6 w-6 text-primary" /></div>
                <div>
                  <p className="font-semibold">Transacciones</p>
                  <p className="text-xs text-muted-foreground">Exportar CSV de todas las transacciones</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open("/api/export?format=csv&type=commissions", "_blank")}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20"><DollarSign className="h-6 w-6 text-green-600" /></div>
                <div>
                  <p className="font-semibold">Comisiones</p>
                  <p className="text-xs text-muted-foreground">Exportar CSV de comisiones</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open("/api/export?format=csv&type=users", "_blank")}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20"><Users className="h-6 w-6 text-blue-600" /></div>
                <div>
                  <p className="font-semibold">Usuarios</p>
                  <p className="text-xs text-muted-foreground">Exportar CSV de todos los usuarios</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open("/api/export?format=csv&type=products", "_blank")}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/20"><Package className="h-6 w-6 text-yellow-600" /></div>
                <div>
                  <p className="font-semibold">Productos</p>
                  <p className="text-xs text-muted-foreground">Exportar CSV de productos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("audit")}>
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(26,82,118,0.1), rgba(46,134,193,0.1))" }}>
                <Shield className="h-10 w-10" style={{ color: "#1A5276" }} />
              </div>
              <div>
                <p className="text-lg font-bold">Registro de Auditoría</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Accede al registro completo de actividad del sistema. Monitorea inicios de sesión, transacciones, cambios y más.
                </p>
              </div>
              <Button className="gap-2" style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}>
                <Activity className="h-4 w-4" /> Abrir Registro de Auditoría
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
