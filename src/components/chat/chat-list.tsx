"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { MessageCircle, ChevronLeft } from "lucide-react"

export function ChatList() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/chat/rooms").then(r => r.json()).then(d => {
      if (d.success) setRooms(d.data)
    }).catch(() => toast.error("Error al cargar chats"))
    .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate("home")}><ChevronLeft className="h-4 w-4 mr-1" /> Volver</Button>
        <h1 className="text-xl font-bold font-[family-name:var(--font-poppins)]">Chats</h1>
      </div>

      {rooms.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p>No tienes conversaciones</p><p className="text-sm text-muted-foreground mt-1">Contacta a un vendedor desde un producto</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {rooms.map(room => {
            const other = room.seller?.id === user?.id ? room.buyer : room.seller
            return (
              <Card key={room.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("chat")}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar><AvatarImage src={other?.avatar || undefined} /><AvatarFallback>{other?.name?.charAt(0) || "?"}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{other?.businessProfile?.businessName || other?.name}</p>
                      <span className="text-xs text-muted-foreground">{new Date(room.lastMessageAt).toLocaleDateString("es-NI")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{room.lastMessage}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
