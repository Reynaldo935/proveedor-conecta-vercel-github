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
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { MessageCircle, ChevronLeft, Search, Package } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ChatRoom {
  id: string
  buyerId: string
  sellerId: string
  productId: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  buyer: { id: string; name: string; avatar: string; businessProfile?: { businessName: string; logo: string } }
  seller: {
    id: string
    name: string
    avatar: string
    businessProfile?: { businessName: string; logo: string }
  }
  product?: { id: string; title: string; images: string[]; price: number } | null
  messages?: { id: string; content: string; senderId: string; isRead: boolean; createdAt: string }[]
}

export function ChatList() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [typingRooms, setTypingRooms] = useState<Map<string, string[]>>(new Map())
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
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
      setRooms((prev) => {
        const updated = prev.map((room) => {
          if (room.id === data.roomId) {
            const isFromOther = data.senderId !== user?.id
            return {
              ...room,
              lastMessage: data.lastMessage,
              lastMessageAt: data.lastMessageAt,
              unreadCount: isFromOther ? (room.unreadCount || 0) + 1 : room.unreadCount,
            }
          }
          return room
        })
        // Re-sort rooms by lastMessageAt
        return [...updated].sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        )
      })
    })

    // Listen for typing indicators across all rooms
    socket.on("typing", (data: { roomId: string; users: string[] }) => {
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

  // Get unread count for a room (provided by API)
  const getUnreadCount = (room: ChatRoom) => {
    return room.unreadCount || 0
  }

  // Format relative time
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
    return date.toLocaleDateString("es-NI", { day: "numeric", month: "short" })
  }

  // Filter rooms by search
  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true
    const other =
      room.seller?.id === user?.id ? room.buyer : room.seller
    const name = other?.businessProfile?.businessName || other?.name || ""
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.product?.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  if (loading)
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
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    )

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate("home")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <h1 className="text-xl font-bold font-[family-name:var(--font-poppins)]">
          Chats
        </h1>
        {rooms.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {rooms.length} conversación{rooms.length !== 1 ? "es" : ""}
          </Badge>
        )}
      </div>

      {/* Search */}
      {rooms.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Empty state */}
      {rooms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-8 text-center">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <MessageCircle className="h-16 w-16 mx-auto text-primary/30 mb-4" />
              </motion.div>
              <p className="font-medium text-lg">No tienes conversaciones</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                Contacta a un vendedor desde un producto para iniciar una conversación
              </p>
              <Button
                className="mt-4 bg-primary hover:bg-primary/90"
                onClick={() => navigate("home")}
              >
                Explorar Productos
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Search className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No se encontraron conversaciones para &quot;{searchQuery}&quot;
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredRooms.map((room, index) => {
              const other =
                room.seller?.id === user?.id ? room.buyer : room.seller
              const isTyping = typingRooms.has(room.id)
              const isOnline = onlineUsers.has(other?.id)
              const unread = getUnreadCount(room)
              const otherName =
                other?.businessProfile?.businessName || other?.name || "Usuario"

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05, duration: 0.25 }}
                  layout
                >
                  <Card
                    className={`cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30 ${
                      unread > 0 ? "border-primary/40 bg-primary/5" : ""
                    }`}
                    onClick={() =>
                      navigate("chat", { roomId: room.id } as unknown as Record<string, string>)
                    }
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      {/* Avatar with online indicator */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={other?.avatar || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                            {otherName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-medium truncate ${unread > 0 ? "text-foreground" : ""}`}>
                            {otherName}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {formatRelativeTime(room.lastMessageAt)}
                          </span>
                        </div>

                        {/* Product context */}
                        {room.product && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Package className="h-3 w-3 text-primary flex-shrink-0" />
                            <p className="text-xs text-primary truncate">
                              {room.product.title}
                            </p>
                          </div>
                        )}

                        {/* Last message or typing indicator */}
                        {isTyping ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="flex items-center gap-0.5">
                              <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
                              <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
                              <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full typing-dot" />
                            </div>
                            <p className="text-xs text-primary font-medium">
                              Escribiendo...
                            </p>
                          </div>
                        ) : (
                          <p className={`text-sm truncate mt-0.5 ${unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {room.lastMessage || "Sin mensajes aún"}
                          </p>
                        )}
                      </div>

                      {/* Unread badge */}
                      {unread > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        >
                          <Badge className="bg-primary text-primary-foreground min-w-[22px] h-[22px] flex items-center justify-center text-[11px] px-1.5">
                            {unread > 99 ? "99+" : unread}
                          </Badge>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
