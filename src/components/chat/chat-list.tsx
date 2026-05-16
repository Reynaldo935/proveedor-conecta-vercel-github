"use client"

import { useState, useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { MessageCircle, ChevronLeft } from "lucide-react"

interface ChatRoom {
  id: string
  buyerId: string
  sellerId: string
  productId: string | null
  lastMessage: string
  lastMessageAt: string
  buyer: { id: string; name: string; avatar: string }
  seller: {
    id: string
    name: string
    avatar: string
    businessProfile?: { businessName: string; logo: string }
  }
  product?: { id: string; title: string; images: string[]; price: number } | null
  messages?: { id: string; content: string; createdAt: string }[]
}

export function ChatList() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [typingRooms, setTypingRooms] = useState<Map<string, string[]>>(new Map())
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const socketRef = useRef<Socket | null>(null)

  // Connect to Socket.IO for real-time updates
  useEffect(() => {
    const socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      console.log("[ChatList] Socket connected")
    })

    socket.on("disconnect", () => {
      console.log("[ChatList] Socket disconnected")
    })

    // Listen for room updates (new messages in any room)
    socket.on("room-updated", (data: { roomId: string; lastMessage: string; lastMessageAt: string; senderId: string; otherUserId: string }) => {
      setRooms((prev) =>
        prev.map((room) =>
          room.id === data.roomId
            ? { ...room, lastMessage: data.lastMessage, lastMessageAt: data.lastMessageAt }
            : room
        )
      )
      // Re-sort rooms by lastMessageAt
      setRooms((prev) =>
        [...prev].sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        )
      )
    })

    // Listen for typing indicators across all rooms
    socket.on("typing", (data: { roomId: string; users: string[] }) => {
      // Filter out current user
      const otherTyping = data.users.filter((u) => u !== user?.id)
      setTypingRooms((prev) => {
        const next = new Map(prev)
        if (otherTyping.length > 0) {
          next.set(data.roomId, otherTyping)
        } else {
          next.delete(data.roomId)
        }
        return next
      })
    })

    // Listen for user online/offline
    socket.on("user-online", (data: { roomId: string; userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.add(data.userId)
        return next
      })
    })

    socket.on("user-offline", (data: { roomId: string; userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(data.userId)
        return next
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  // Load rooms via REST API
  useEffect(() => {
    fetch("/api/chat/rooms")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRooms(d.data)
      })
      .catch(() => toast.error("Error al cargar chats"))
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate("home")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <h1 className="text-xl font-bold font-[family-name:var(--font-poppins)]">
          Chats
        </h1>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p>No tienes conversaciones</p>
            <p className="text-sm text-muted-foreground mt-1">
              Contacta a un vendedor desde un producto
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => {
            const other =
              room.seller?.id === user?.id ? room.buyer : room.seller
            const isTyping = typingRooms.has(room.id)
            const isOnline = onlineUsers.has(other?.id)

            return (
              <Card
                key={room.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate("chat")}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={other?.avatar || undefined} />
                      <AvatarFallback>
                        {other?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {other?.businessProfile?.businessName || other?.name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(room.lastMessageAt).toLocaleDateString(
                          "es-NI"
                        )}
                      </span>
                    </div>
                    {isTyping ? (
                      <p className="text-sm text-primary font-medium truncate">
                        Escribiendo...
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground truncate">
                        {room.lastMessage}
                      </p>
                    )}
                  </div>
                  {isTyping && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      <span className="flex items-center gap-0.5">
                        <span className="inline-block w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="inline-block w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="inline-block w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                      </span>
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
