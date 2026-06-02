"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { authFetch } from "@/lib/client-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  RefreshCw,
  Shield,
  Activity,
  Clock,
  CalendarIcon,
  Filter,
  X,
  Eye,
  Globe,
  Monitor,
  FileText,
  AlertTriangle,
  BarChart3,
  TrendingUp,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLogUser {
  id: string
  name: string
  email: string
  avatar: string
  role: string
}

interface AuditLog {
  id: string
  userId: string | null
  action: string
  entity: string
  entityId: string
  details: string
  ip: string
  userAgent: string
  createdAt: string
  user: AuditLogUser | null
}

interface AuditStats {
  logsToday: number
  logsThisWeek: number
}

interface AuditData {
  logs: AuditLog[]
  total: number
  page: number
  totalPages: number
  stats: AuditStats
}

// ─── Action Color Mapping ─────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  CREATE:       { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  CREATE_PRODUCT: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  UPDATE:       { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800", dot: "bg-sky-500" },
  UPDATE_USER:  { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800", dot: "bg-sky-500" },
  UPDATE_PRODUCT: { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800", dot: "bg-sky-500" },
  DELETE:       { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800", dot: "bg-red-500" },
  DELETE_PRODUCT: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800", dot: "bg-red-500" },
  LOGIN:        { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
  LOGOUT:       { bg: "bg-gray-50 dark:bg-gray-950/40", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-800", dot: "bg-gray-500" },
  PAYMENT:      { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
  COMMISSION:   { bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-200 dark:border-fuchsia-800", dot: "bg-fuchsia-500" },
  REGISTER:     { bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800", dot: "bg-teal-500" },
  CHAT:         { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800", dot: "bg-indigo-500" },
  REVIEW:       { bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800", dot: "bg-orange-500" },
}

const DEFAULT_ACTION_COLOR = { bg: "bg-slate-50 dark:bg-slate-950/40", text: "text-slate-700 dark:text-slate-300", border: "border-slate-200 dark:border-slate-800", dot: "bg-slate-500" }

function getActionColor(action: string) {
  // Exact match
  if (ACTION_COLORS[action]) return ACTION_COLORS[action]
  // Prefix match: e.g., "CREATE_PRODUCT" matches "CREATE"
  const prefix = action.split("_")[0]
  if (ACTION_COLORS[prefix]) return ACTION_COLORS[prefix]
  return DEFAULT_ACTION_COLOR
}

// ─── Action Label Mapping ─────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Inicio de Sesión",
  LOGOUT: "Cierre de Sesión",
  REGISTER: "Registro",
  CREATE: "Creación",
  CREATE_PRODUCT: "Producto Creado",
  UPDATE: "Actualización",
  UPDATE_USER: "Usuario Actualizado",
  UPDATE_PRODUCT: "Producto Actualizado",
  DELETE: "Eliminación",
  DELETE_PRODUCT: "Producto Eliminado",
  PAYMENT: "Pago",
  COMMISSION: "Comisión",
  CHAT: "Chat",
  REVIEW: "Reseña",
}

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] || action.replace(/_/g, " ")
}

// ─── Entity Icons ─────────────────────────────────────────────────────────────

const ENTITY_ICONS: Record<string, string> = {
  User: "👤",
  Product: "📦",
  Transaction: "💰",
  ChatRoom: "💬",
  Review: "⭐",
  Notification: "🔔",
  Commission: "🏦",
  Advertisement: "📢",
  Cotizacion: "📋",
}

function getEntityIcon(entity: string): string {
  return ENTITY_ICONS[entity] || "📄"
}

// ─── Action Type Options ──────────────────────────────────────────────────────

const ACTION_OPTIONS = [
  { value: "", label: "Todas las Acciones" },
  { value: "LOGIN", label: "Inicio de Sesión" },
  { value: "LOGOUT", label: "Cierre de Sesión" },
  { value: "REGISTER", label: "Registro" },
  { value: "CREATE", label: "Creación" },
  { value: "UPDATE", label: "Actualización" },
  { value: "DELETE", label: "Eliminación" },
  { value: "PAYMENT", label: "Pago" },
  { value: "COMMISSION", label: "Comisión" },
  { value: "CHAT", label: "Chat" },
  { value: "REVIEW", label: "Reseña" },
]

const ENTITY_OPTIONS = [
  { value: "", label: "Todas las Entidades" },
  { value: "User", label: "Usuario" },
  { value: "Product", label: "Producto" },
  { value: "Transaction", label: "Transacción" },
  { value: "ChatRoom", label: "Sala de Chat" },
  { value: "Review", label: "Reseña" },
  { value: "Notification", label: "Notificación" },
  { value: "Commission", label: "Comisión" },
  { value: "Advertisement", label: "Anuncio" },
  { value: "Cotizacion", label: "Cotización" },
]

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function LogDetailDialog({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const colors = getActionColor(log.action)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-card rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${colors.bg} border ${colors.border}`}>
                <Shield className={`h-5 w-5 ${colors.text}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Detalle del Log</h3>
                <p className="text-xs text-muted-foreground font-mono">{log.id}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Badge */}
          <div className="mb-5">
            <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-sm px-3 py-1`}>
              <span className={`w-2 h-2 rounded-full ${colors.dot} mr-2`} />
              {getActionLabel(log.action)}
            </Badge>
          </div>

          {/* User Section */}
          <div className="mb-5 p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Usuario</p>
            {log.user ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {log.user.avatar && <AvatarImage src={log.user.avatar} alt={log.user.name} />}
                  <AvatarFallback className="text-xs" style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)", color: "white" }}>
                    {log.user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{log.user.name}</p>
                  <p className="text-xs text-muted-foreground">{log.user.email}</p>
                  <Badge variant="outline" className="mt-1 text-[10px] h-5">{log.user.role}</Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sistema (sin usuario)</p>
            )}
          </div>

          {/* Entity Section */}
          <div className="mb-5 p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Entidad</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getEntityIcon(log.entity)}</span>
              <div>
                <p className="font-semibold text-sm">{log.entity}</p>
                <p className="text-xs text-muted-foreground font-mono">{log.entityId}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          {log.details && (
            <div className="mb-5 p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Detalles</p>
              <p className="text-sm whitespace-pre-wrap">{log.details}</p>
            </div>
          )}

          {/* Technical Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Globe className="h-3 w-3" /> IP
              </p>
              <p className="text-sm font-mono">{log.ip || "N/A"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Fecha/Hora
              </p>
              <p className="text-sm">{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: es })}</p>
            </div>
          </div>

          {/* User Agent */}
          {log.userAgent && (
            <div className="mt-3 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Monitor className="h-3 w-3" /> User Agent
              </p>
              <p className="text-xs font-mono break-all text-muted-foreground">{log.userAgent}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AuditPanel() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()

  // Data state
  const [data, setData] = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filter state
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [entityFilter, setEntityFilter] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  // Detail dialog
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const PAGE_SIZE = 50

  // ─── Fetch Data ─────────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(PAGE_SIZE))
      if (search) params.set("search", search)
      if (actionFilter) params.set("action", actionFilter)
      if (entityFilter) params.set("entity", entityFilter)
      if (startDate) params.set("startDate", startDate.toISOString())
      if (endDate) params.set("endDate", endDate.toISOString())

      const res = await authFetch(`/api/audit?${params.toString()}`)
      const result = await res.json()

      if (result.success) {
        setData(result.data)
      } else {
        toast.error(result.error || "Error al cargar logs")
      }
    } catch {
      toast.error("Error de conexión al servidor")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, search, actionFilter, entityFilter, startDate, endDate])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // ─── Search Handler with debounce ───────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput)
        setPage(1)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, search])

  // ─── Reset filters when changing filter type ────────────────────────────────

  const handleActionFilter = (value: string) => {
    setActionFilter(value === "_all" ? "" : value)
    setPage(1)
  }

  const handleEntityFilter = (value: string) => {
    setEntityFilter(value === "_all" ? "" : value)
    setPage(1)
  }

  const handleStartDate = (date: Date | undefined) => {
    setStartDate(date)
    setPage(1)
  }

  const handleEndDate = (date: Date | undefined) => {
    setEndDate(date)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch("")
    setSearchInput("")
    setActionFilter("")
    setEntityFilter("")
    setStartDate(undefined)
    setEndDate(undefined)
    setPage(1)
  }

  const hasActiveFilters = search || actionFilter || entityFilter || startDate || endDate

  // ─── Export CSV ─────────────────────────────────────────────────────────────

  const exportCSV = useCallback(async () => {
    try {
      toast.info("Preparando exportación CSV...")
      const params = new URLSearchParams()
      params.set("page", "1")
      params.set("limit", "10000")
      if (search) params.set("search", search)
      if (actionFilter) params.set("action", actionFilter)
      if (entityFilter) params.set("entity", entityFilter)
      if (startDate) params.set("startDate", startDate.toISOString())
      if (endDate) params.set("endDate", endDate.toISOString())

      const res = await authFetch(`/api/audit?${params.toString()}`)
      const result = await res.json()

      if (!result.success) {
        toast.error("Error al exportar datos")
        return
      }

      const logs: AuditLog[] = result.data.logs

      const headers = ["ID", "Fecha/Hora", "Usuario", "Email", "Rol", "Acción", "Entidad", "ID Entidad", "Detalles", "IP", "User Agent"]
      const rows = logs.map((log) => [
        log.id,
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        log.user?.name || "Sistema",
        log.user?.email || "",
        log.user?.role || "",
        log.action,
        log.entity,
        log.entityId,
        `"${(log.details || "").replace(/"/g, '""')}"`,
        log.ip,
        `"${(log.userAgent || "").replace(/"/g, '""')}"`,
      ])

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
      const BOM = "\uFEFF"
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(`Exportados ${logs.length} registros`)
    } catch {
      toast.error("Error al exportar CSV")
    }
  }, [search, actionFilter, entityFilter, startDate, endDate])

  // ─── Stats computation ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (!data) return null
    return {
      total: data.total,
      today: data.stats.logsToday,
      thisWeek: data.stats.logsThisWeek,
    }
  }, [data])

  // ─── Verify Admin Access ────────────────────────────────────────────────────

  if (user?.role !== "ADMIN" && user?.email !== "rey7214935@gmail.com") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <Shield className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Solo los administradores pueden acceder al registro de auditoría del sistema.
        </p>
        <Button variant="outline" onClick={() => navigate("home")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver al Inicio
        </Button>
      </motion.div>
    )
  }

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Format helpers ─────────────────────────────────────────────────────────

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr)
    const relative = formatDistanceToNow(date, { addSuffix: true, locale: es })
    const absolute = format(date, "dd/MM/yyyy HH:mm:ss", { locale: es })
    return { relative, absolute }
  }

  const truncateText = (text: string, maxLen: number) => {
    if (!text) return ""
    return text.length > maxLen ? text.slice(0, maxLen) + "..." : text
  }

  const totalPages = data?.totalPages || 1

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("admin")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Admin
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] flex items-center gap-2">
              <Shield className="h-6 w-6" style={{ color: "#1A5276" }} />
              Registro de Auditoría
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitoreo completo de actividad del sistema
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Exportar CSV
          </Button>
        </div>
      </motion.div>

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total de Registros",
            value: stats?.total ?? 0,
            icon: FileText,
            color: "#1A5276",
            bgColor: "rgba(26, 82, 118, 0.08)",
            sub: "Todos los tiempos",
          },
          {
            label: "Registros Hoy",
            value: stats?.today ?? 0,
            icon: Activity,
            color: "#1E8449",
            bgColor: "rgba(30, 132, 73, 0.08)",
            sub: "Desde las 12:00 AM",
          },
          {
            label: "Esta Semana",
            value: stats?.thisWeek ?? 0,
            icon: TrendingUp,
            color: "#2E86C1",
            bgColor: "rgba(46, 134, 193, 0.08)",
            sub: "Últimos 7 días",
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: card.color }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      {card.label}
                    </p>
                    <p className="text-3xl font-bold mt-1" style={{ color: card.color }}>
                      {card.value.toLocaleString("es-NI")}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: card.bgColor }}
                  >
                    <card.icon className="h-6 w-6" style={{ color: card.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Search & Filters ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardContent className="p-4">
            {/* Search Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por detalles, acción, entidad, IP..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 h-10"
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(""); setSearch(""); setPage(1) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-10 gap-1.5"
                style={showFilters ? { background: "linear-gradient(135deg, #1A5276, #2E86C1)", color: "white" } : {}}
              >
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-white text-primary">
                    !
                  </Badge>
                )}
              </Button>
            </div>

            {/* Expandable Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t">
                    {/* Action Filter */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Tipo de Acción
                      </label>
                      <Select value={actionFilter || "_all"} onValueChange={handleActionFilter}>
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="Todas las Acciones" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value || "_all"} value={opt.value || "_all"}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Entity Filter */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Tipo de Entidad
                      </label>
                      <Select value={entityFilter || "_all"} onValueChange={handleEntityFilter}>
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="Todas las Entidades" />
                        </SelectTrigger>
                        <SelectContent>
                          {ENTITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value || "_all"} value={opt.value || "_all"}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Fecha Desde
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-9 justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                            {startDate ? format(startDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={handleStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Fecha Hasta
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-9 justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                            {endDate ? format(endDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={handleEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Filtros activos: {[
                          search && "Búsqueda",
                          actionFilter && "Acción",
                          entityFilter && "Entidad",
                          startDate && "Fecha desde",
                          endDate && "Fecha hasta",
                        ].filter(Boolean).join(", ")}
                      </p>
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-destructive hover:text-destructive">
                        <X className="h-3 w-3 mr-1" /> Limpiar Filtros
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Results Count ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? (
            <>
              Mostrando <span className="font-semibold text-foreground">{((page - 1) * PAGE_SIZE) + 1}</span>
              {" - "}
              <span className="font-semibold text-foreground">{Math.min(page * PAGE_SIZE, data.total)}</span>
              {" de "}
              <span className="font-semibold text-foreground">{data.total.toLocaleString("es-NI")}</span> registros
            </>
          ) : (
            "Cargando..."
          )}
        </p>
        {hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">
            Filtrado
          </Badge>
        )}
      </div>

      {/* ── Desktop Table View ──────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <Card className="overflow-hidden">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[170px]">Fecha/Hora</TableHead>
                  <TableHead className="w-[200px]">Usuario</TableHead>
                  <TableHead className="w-[150px]">Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead className="w-[200px]">Detalles</TableHead>
                  <TableHead className="w-[120px]">IP</TableHead>
                  <TableHead className="w-[60px] text-center">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full max-w-[120px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="h-10 w-10 text-muted-foreground/30" />
                        <p className="text-muted-foreground font-medium">No se encontraron registros</p>
                        <p className="text-xs text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {data?.logs.map((log, i) => {
                      const colors = getActionColor(log.action)
                      const time = formatTimestamp(log.createdAt)
                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: i * 0.02, duration: 0.2 }}
                          className="hover:bg-muted/30 transition-colors cursor-pointer border-b"
                          onClick={() => setSelectedLog(log)}
                        >
                          <TableCell>
                            <div>
                              <p className="text-xs font-medium">{time.absolute}</p>
                              <p className="text-[11px] text-muted-foreground">{time.relative}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  {log.user.avatar && <AvatarImage src={log.user.avatar} alt={log.user.name} />}
                                  <AvatarFallback className="text-[10px]" style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)", color: "white" }}>
                                    {log.user.name?.charAt(0)?.toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate max-w-[130px]">{log.user.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{log.user.email}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Sistema</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${colors.bg} ${colors.text} border ${colors.border} text-[11px] font-medium`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} mr-1.5`} />
                              {getActionLabel(log.action)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{getEntityIcon(log.entity)}</span>
                              <span className="text-xs font-medium">{log.entity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {truncateText(log.details, 60) || "—"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs font-mono text-muted-foreground">{log.ip || "—"}</p>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLog(log)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      </div>

      {/* ── Mobile Card View ────────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : data?.logs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No se encontraron registros</p>
              <p className="text-xs text-muted-foreground mt-1">Intenta ajustar los filtros</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {data?.logs.map((log, i) => {
              const colors = getActionColor(log.action)
              const time = formatTimestamp(log.createdAt)
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedLog(log)}
                  className="cursor-pointer"
                >
                  <Card className="hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: colors.dot.replace("bg-", "") }}>
                    <div style={{ borderLeftColor: "transparent" }}>
                      <CardContent className="p-4">
                        {/* Top Row: Action Badge + Time */}
                        <div className="flex items-start justify-between mb-3">
                          <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-[11px] font-medium`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} mr-1.5`} />
                            {getActionLabel(log.action)}
                          </Badge>
                          <p className="text-[11px] text-muted-foreground">{time.relative}</p>
                        </div>

                        {/* User Row */}
                        <div className="flex items-center gap-2 mb-2">
                          {log.user ? (
                            <>
                              <Avatar className="h-7 w-7">
                                {log.user.avatar && <AvatarImage src={log.user.avatar} alt={log.user.name} />}
                                <AvatarFallback className="text-[10px]" style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)", color: "white" }}>
                                  {log.user.name?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{log.user.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{log.user.email}</p>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Sistema</span>
                          )}
                        </div>

                        {/* Entity + Details */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-sm">{getEntityIcon(log.entity)}</span>
                          <span className="text-xs font-medium">{log.entity}</span>
                          {log.entityId && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              #{truncateText(log.entityId, 8)}
                            </span>
                          )}
                        </div>

                        {log.details && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {log.details}
                          </p>
                        )}

                        {/* Bottom: IP + Time */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            <span className="text-[10px] font-mono">{log.ip || "N/A"}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{time.absolute}</span>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Page Info */}
                <p className="text-sm text-muted-foreground">
                  Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span>
                </p>

                {/* Page Navigation */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <span className="text-xs">⟨⟨</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="h-8 gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Anterior</span>
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages: (number | string)[] = []
                      const start = Math.max(1, page - 2)
                      const end = Math.min(totalPages, page + 2)

                      if (start > 1) {
                        pages.push(1)
                        if (start > 2) pages.push("...")
                      }

                      for (let i = start; i <= end; i++) {
                        pages.push(i)
                      }

                      if (end < totalPages) {
                        if (end < totalPages - 1) pages.push("...")
                        pages.push(totalPages)
                      }

                      return pages.map((p, idx) =>
                        typeof p === "string" ? (
                          <span key={`dots-${idx}`} className="px-1 text-xs text-muted-foreground">...</span>
                        ) : (
                          <Button
                            key={p}
                            variant={p === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(p)}
                            className="h-8 w-8 p-0 text-xs"
                            style={p === page ? { background: "linear-gradient(135deg, #1A5276, #2E86C1)", color: "white" } : {}}
                          >
                            {p}
                          </Button>
                        )
                      )
                    })()}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="h-8 gap-1"
                  >
                    <span className="hidden sm:inline text-xs">Siguiente</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <span className="text-xs">⟩⟩</span>
                  </Button>
                </div>

                {/* Jump to Page */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Ir a:</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    className="w-16 h-8 text-xs text-center"
                    placeholder={String(page)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = parseInt((e.target as HTMLInputElement).value)
                        if (val >= 1 && val <= totalPages) {
                          setPage(val)
                          ;(e.target as HTMLInputElement).value = ""
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Action Distribution Mini-Stats ──────────────────────────────────── */}
      {data && data.logs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" style={{ color: "#1A5276" }} />
                Distribución de Acciones (Página Actual)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const actionCounts: Record<string, number> = {}
                  data.logs.forEach((log) => {
                    const prefix = log.action.split("_")[0]
                    actionCounts[prefix] = (actionCounts[prefix] || 0) + 1
                  })
                  return Object.entries(actionCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([action, count]) => {
                      const colors = getActionColor(action)
                      return (
                        <div
                          key={action}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${colors.bg} border ${colors.border}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                          <span className={`text-xs font-medium ${colors.text}`}>
                            {getActionLabel(action)}
                          </span>
                          <Badge variant="secondary" className="h-5 text-[10px] ml-1">
                            {count}
                          </Badge>
                        </div>
                      )
                    })
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Log Detail Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLog && (
          <LogDetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
