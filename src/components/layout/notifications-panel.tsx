"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Bell,
  Check,
  ChevronLeft,
  MessageCircle,
  ShoppingCart,
  Heart,
  Users,
  FileText,
  Trash2,
  CheckCheck,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  link: string
  createdAt: string
}

const NOTIFICATION_CONFIG: Record<
  string,
  { icon: typeof Bell; color: string; bg: string }
> = {
  MESSAGE: {
    icon: MessageCircle,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  COTIZACION: {
    icon: FileText,
    color: "text-dorado",
    bg: "bg-dorado/10",
  },
  PAYMENT: {
    icon: ShoppingCart,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  FOLLOW: {
    icon: Users,
    color: "text-dorado",
    bg: "bg-dorado/10",
  },
  LIKE: {
    icon: Heart,
    color: "text-volcan",
    bg: "bg-volcan/10",
  },
}

export function NotificationsPanel() {
  const { navigate } = useAppStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNotifications(d.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch {
      toast.error("Error al marcar notificación")
    }
  }

  const markAllRead = async () => {
    setClearing(true)
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast.success("Todas las notificaciones marcadas como leídas")
    } catch {
      toast.error("Error al marcar notificaciones")
    } finally {
      setClearing(false)
    }
  }

  const clearAll = async () => {
    try {
      // Mark all as read first (API doesn't have DELETE)
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      })
      setNotifications([])
      toast.success("Notificaciones limpiadas")
    } catch {
      toast.error("Error al limpiar notificaciones")
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications

  const getIcon = (type: string) => {
    const config = NOTIFICATION_CONFIG[type] || {
      icon: Bell,
      color: "text-muted-foreground",
      bg: "bg-muted",
    }
    const IconComponent = config.icon
    return (
      <div className={`h-9 w-9 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <IconComponent className={`h-4 w-4 ${config.color}`} />
      </div>
    )
  }

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString("es-NI", {
      day: "numeric",
      month: "short",
    })
  }

  const typeLabels: Record<string, string> = {
    MESSAGE: "Mensaje",
    COTIZACION: "Cotización",
    PAYMENT: "Pago",
    FOLLOW: "Seguidor",
    LIKE: "Me gusta",
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("home")}>
            <ChevronLeft className="h-4 w-4 mr-1" />
          </Button>
          <h1 className="text-xl font-bold font-[family-name:var(--font-poppins)]">
            Notificaciones
          </h1>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs">
              {unreadCount} sin leer
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              disabled={clearing}
              className="text-xs gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Leer todo
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs text-muted-foreground gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      {notifications.length > 0 && (
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              filter === "all"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              filter === "unread"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sin leer ({unreadCount})
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardContent className="p-8 text-center">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Bell className="h-16 w-16 mx-auto text-primary/20 mb-4" />
              </motion.div>
              <p className="font-medium text-lg">
                {filter === "unread"
                  ? "No hay notificaciones sin leer"
                  : "Sin notificaciones"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Te notificaremos sobre mensajes, pagos y más
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((n, index) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: index * 0.04, duration: 0.2 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-sm ${
                    !n.isRead
                      ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/30"
                  }`}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id)
                    if (n.link) {
                      // Navigate based on link
                      const linkMap: Record<string, string> = {
                        chat: "chat-list",
                        cotizacion: "cotizaciones",
                        product: "home",
                      }
                      const view = linkMap[n.link] || "home"
                      navigate(view as any)
                    }
                  }}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    {getIcon(n.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm ${
                            !n.isRead ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {n.title}
                        </p>
                        {NOTIFICATION_CONFIG[n.type] && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 flex-shrink-0"
                          >
                            {typeLabels[n.type] || n.type}
                          </Badge>
                        )}
                      </div>
                      {n.message && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>

                    {!n.isRead && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                        className="mt-1.5"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
