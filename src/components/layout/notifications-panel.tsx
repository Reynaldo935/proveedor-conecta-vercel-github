"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Bell, Check, ChevronLeft, MessageCircle, ShoppingCart, Heart, Users } from "lucide-react"

export function NotificationsPanel() {
  const { navigate } = useAppStore()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/notifications").then(r => r.json()).then(d => { if (d.success) setNotifications(d.data) }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "MESSAGE": return <MessageCircle className="h-4 w-4 text-primary" />
      case "PAYMENT": return <ShoppingCart className="h-4 w-4 text-green-600" />
      case "FOLLOW": return <Users className="h-4 w-4 text-dorado" />
      case "LIKE": return <Heart className="h-4 w-4 text-volcan" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("home")}><ChevronLeft className="h-4 w-4 mr-1" /></Button>
          <h1 className="text-xl font-bold font-[family-name:var(--font-poppins)]">Notificaciones</h1>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}><Check className="h-4 w-4 mr-1" /> Marcar todo leído</Button>
      </div>

      {notifications.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p>Sin notificaciones</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card key={n.id} className={`${!n.isRead ? "border-primary/50 bg-primary/5" : ""}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{n.title}</p>
                  {n.message && <p className="text-sm text-muted-foreground">{n.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString("es-NI")}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-2" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
