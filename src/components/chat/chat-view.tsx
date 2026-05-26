"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Send, ChevronLeft, ImagePlus, Package, Wifi, WifiOff,
  Paperclip, MapPin, Mic, Video, X, Loader2, Volume2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ChatMessage {
  id: string
  chatRoomId: string
  senderId: string
  content: string
  imageUrl: string
  isRead: boolean
  createdAt: string
  sender?: { id: string; name: string; avatar: string }
  messageType?: "text" | "image" | "video" | "audio" | "location"
  mediaUrl?: string
  locationLat?: number
  locationLng?: number
  locationName?: string
}

interface ChatRoomData {
  id: string
  buyerId: string
  sellerId: string
  productId: string | null
  lastMessage: string
  lastMessageAt: string
  buyer: { id: string; name: string; avatar: string; businessProfile?: { businessName: string; logo: string } }
  seller: {
    id: string
    name: string
    avatar: string
    businessProfile?: { businessName: string; logo: string }
  }
  product?: { id: string; title: string; images: string[]; price: number } | null
}

export function ChatView() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const selectedRoomId = useAppStore((s) => s.selectedRoomId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMsg, setNewMsg] = useState("")
  const [chatRoom, setChatRoom] = useState<ChatRoomData | null>(null)
  const [isOtherOnline, setIsOtherOnline] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeRoomIdRef = useRef<string | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId
  }, [activeRoomId])

  // Connect to Socket.IO once on mount
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
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    // Listen for new messages
    socket.on("new-message", (message: ChatMessage) => {
      // Only add if it belongs to the currently active room
      if (message.chatRoomId === activeRoomIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev
          return [...prev, message]
        })
      }
    })

    // Listen for typing indicators
    socket.on("typing", (data: { roomId: string; users: string[] }) => {
      if (data.roomId === activeRoomIdRef.current) {
        const userId = useAuthStore.getState().user?.id
        const otherTyping = data.users.filter((u) => u !== userId)
        setTypingUsers(otherTyping)
      }
    })

    // Listen for user online/offline
    socket.on("user-online", (data: { roomId: string; userId: string }) => {
      if (data.roomId === activeRoomIdRef.current) {
        const userId = useAuthStore.getState().user?.id
        if (data.userId !== userId) {
          setIsOtherOnline(true)
        }
      }
    })

    socket.on("user-offline", (data: { roomId: string; userId: string }) => {
      if (data.roomId === activeRoomIdRef.current) {
        const userId = useAuthStore.getState().user?.id
        if (data.userId !== userId) {
          setIsOtherOnline(false)
        }
      }
    })

    // Listen for read receipts
    socket.on("messages-read", (data: { roomId: string; userId: string }) => {
      if (data.roomId === activeRoomIdRef.current) {
        const userId = useAuthStore.getState().user?.id
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === userId ? { ...m, isRead: true } : m
          )
        )
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  // Join/leave room via socket when activeRoomId changes
  useEffect(() => {
    const socket = socketRef.current
    const prevRoomId = activeRoomIdRef.current

    if (socket && user && activeRoomId) {
      // Leave previous room if different
      if (prevRoomId && prevRoomId !== activeRoomId) {
        socket.emit("leave-room", {
          roomId: prevRoomId,
          userId: user.id,
        })
      }

      // Join the new room
      socket.emit("join-room", {
        roomId: activeRoomId,
        userId: user.id,
      })
    }

    // Reset online/typing state when switching rooms
    setIsOtherOnline(false)
    setTypingUsers([])

    return () => {
      // Cleanup: leave room when effect re-runs or unmounts
      if (socket && user && activeRoomId) {
        socket.emit("leave-room", {
          roomId: activeRoomId,
          userId: user.id,
        })
      }
    }
  }, [activeRoomId, user])

  // Load room and messages when selectedRoomId changes or on mount
  useEffect(() => {
    if (!user) return

    const targetRoomId = selectedRoomId

    const loadRoom = async (roomId: string) => {
      setLoading(true)
      setMessages([])
      setChatRoom(null)
      try {
        // Load all rooms to find the target
        const roomsRes = await fetch("/api/chat/rooms")
        const roomsData = await roomsRes.json()

        if (roomsData.success) {
          const room = roomsData.data.find((r: ChatRoomData) => r.id === roomId)
          if (room) {
            setChatRoom(room)
            setActiveRoomId(room.id)

            // Load messages for this room
            const msgRes = await fetch(`/api/chat/rooms/${room.id}/messages`)
            const msgData = await msgRes.json()
            if (msgData.success) {
              setMessages(msgData.data)
            }
          } else {
            // Room not found in user's rooms, try loading directly
            try {
              const msgRes = await fetch(`/api/chat/rooms/${roomId}/messages`)
              const msgData = await msgRes.json()
              if (msgData.success) {
                setMessages(msgData.data)
                setActiveRoomId(roomId)
              }
            } catch {
              // Room doesn't exist or not authorized
            }
          }
        }
      } catch {
        toast.error("Error al cargar chat")
      } finally {
        setLoading(false)
      }
    }

    const loadFirstRoom = async () => {
      setLoading(true)
      setMessages([])
      setChatRoom(null)
      try {
        const res = await fetch("/api/chat/rooms")
        const d = await res.json()
        if (d.success && d.data.length > 0) {
          const room = d.data[0]
          setChatRoom(room)
          setActiveRoomId(room.id)

          const msgRes = await fetch(`/api/chat/rooms/${room.id}/messages`)
          const msgData = await msgRes.json()
          if (msgData.success) {
            setMessages(msgData.data)
          }
        }
      } catch {
        toast.error("Error al cargar chat")
      } finally {
        setLoading(false)
      }
    }

    if (targetRoomId) {
      loadRoom(targetRoomId)
    } else {
      loadFirstRoom()
    }
  }, [selectedRoomId, user])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typingUsers])

  // Handle typing indicator
  const handleTyping = useCallback(
    (value: string) => {
      setNewMsg(value)
      if (!socketRef.current || !chatRoom || !user) return

      socketRef.current.emit("typing", {
        roomId: chatRoom.id,
        userId: user.id,
        isTyping: value.length > 0,
      })

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("typing", {
          roomId: chatRoom?.id,
          userId: user?.id,
          isTyping: false,
        })
      }, 3000)
    },
    [chatRoom, user]
  )

  // Send text message via Socket.IO
  const sendMessage = async () => {
    if (!newMsg.trim() || !chatRoom || !user) return

    const content = newMsg.trim()
    setNewMsg("")
    setShowAttachMenu(false)

    // Stop typing indicator
    if (socketRef.current) {
      socketRef.current.emit("typing", {
        roomId: chatRoom.id,
        userId: user.id,
        isTyping: false,
      })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (isConnected && socketRef.current) {
      socketRef.current.emit("send-message", {
        roomId: chatRoom.id,
        senderId: user.id,
        content,
      })
    } else {
      try {
        const res = await fetch(`/api/chat/rooms/${chatRoom.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        })
        const d = await res.json()
        if (d.success) {
          setMessages((prev) => [...prev, d.data])
        }
      } catch {
        toast.error("Error al enviar mensaje")
      }
    }
  }

  // Upload media file (image, video, audio)
  const handleMediaUpload = async (files: FileList, type: "image" | "video" | "audio") => {
    if (!chatRoom || !user) return
    setUploading(true)
    setShowAttachMenu(false)

    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append("files", f))
    fd.append("subfolder", "chat")

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (d.success && d.data.length > 0) {
        for (const url of d.data) {
          if (isConnected && socketRef.current) {
            socketRef.current.emit("send-message", {
              roomId: chatRoom.id,
              senderId: user.id,
              content: type === "image" ? "📷 Imagen" : type === "video" ? "🎥 Video" : "🎵 Audio",
              imageUrl: url,
              messageType: type,
              mediaUrl: url,
            })
          } else {
            const msgRes = await fetch(`/api/chat/rooms/${chatRoom.id}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: type === "image" ? "📷 Imagen" : type === "video" ? "🎥 Video" : "🎵 Audio",
                imageUrl: url,
                messageType: type,
                mediaUrl: url,
              }),
            })
            const md = await msgRes.json()
            if (md.success) setMessages((prev) => [...prev, md.data])
          }
        }
        toast.success(`${type === "image" ? "Imagen" : type === "video" ? "Video" : "Audio"} enviado`)
      } else {
        toast.error(d.error || "Error al subir archivo")
      }
    } catch {
      toast.error("Error al subir archivo")
    } finally {
      setUploading(false)
    }
  }

  // Send location
  const sendLocation = async () => {
    if (!chatRoom || !user) return
    setLocationLoading(true)
    setShowAttachMenu(false)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      })

      const { latitude, longitude } = position.coords
      const locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

      if (isConnected && socketRef.current) {
        socketRef.current.emit("send-message", {
          roomId: chatRoom.id,
          senderId: user.id,
          content: `📍 Ubicación: ${locationName}`,
          messageType: "location",
          locationLat: latitude,
          locationLng: longitude,
          locationName,
        })
      } else {
        const res = await fetch(`/api/chat/rooms/${chatRoom.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `📍 Ubicación: ${locationName}`,
            messageType: "location",
            locationLat: latitude,
            locationLng: longitude,
            locationName,
          }),
        })
        const d = await res.json()
        if (d.success) setMessages((prev) => [...prev, d.data])
      }
      toast.success("Ubicación enviada")
    } catch {
      toast.error("No se pudo obtener tu ubicación. Activa el GPS.")
    } finally {
      setLocationLoading(false)
    }
  }

  const otherUser =
    chatRoom?.seller?.id === user?.id ? chatRoom?.buyer : chatRoom?.seller
  const otherName =
    otherUser?.businessProfile?.businessName || otherUser?.name || "Chat"

  // Format time
  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("es-NI", {
      hour: "2-digit",
      minute: "2-digit",
    })

  // Group messages by date
  const getMessageDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / 86400000
    )
    if (diffDays === 0) return "Hoy"
    if (diffDays === 1) return "Ayer"
    return date.toLocaleDateString("es-NI", {
      day: "numeric",
      month: "short",
    })
  }

  // Grouped messages
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = []
  messages.forEach((m) => {
    const date = getMessageDate(m.createdAt)
    const lastGroup = groupedMessages[groupedMessages.length - 1]
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(m)
    } else {
      groupedMessages.push({ date, messages: [m] })
    }
  })

  // Render message content based on type
  const renderMessageContent = (m: ChatMessage) => {
    const msgType = m.messageType || (m.imageUrl ? "image" : "text")

    switch (msgType) {
      case "image":
        return (
          <div>
            {m.imageUrl && (
              <img
                src={m.imageUrl}
                alt="Imagen compartida"
                className="rounded-lg mb-2 max-h-64 max-w-full object-cover cursor-pointer"
                onClick={() => window.open(m.imageUrl, "_blank")}
              />
            )}
            {m.content && m.content !== "📷 Imagen" && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
            )}
          </div>
        )
      case "video":
        return (
          <div>
            {m.mediaUrl ? (
              <video
                src={m.mediaUrl}
                controls
                className="rounded-lg mb-2 max-h-64 max-w-full"
                preload="metadata"
              >
                Tu navegador no soporta video.
              </video>
            ) : m.imageUrl ? (
              <video
                src={m.imageUrl}
                controls
                className="rounded-lg mb-2 max-h-64 max-w-full"
                preload="metadata"
              >
                Tu navegador no soporta video.
              </video>
            ) : null}
            {m.content && m.content !== "🎥 Video" && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
            )}
          </div>
        )
      case "audio":
        return (
          <div>
            {m.mediaUrl ? (
              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-lg p-2">
                <Volume2 className="h-4 w-4 flex-shrink-0" />
                <audio src={m.mediaUrl} controls className="h-8 max-w-[200px]" preload="metadata">
                  Tu navegador no soporta audio.
                </audio>
              </div>
            ) : m.imageUrl ? (
              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-lg p-2">
                <Volume2 className="h-4 w-4 flex-shrink-0" />
                <audio src={m.imageUrl} controls className="h-8 max-w-[200px]" preload="metadata">
                  Tu navegador no soporta audio.
                </audio>
              </div>
            ) : null}
            {m.content && m.content !== "🎵 Audio" && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1">{m.content}</p>
            )}
          </div>
        )
      case "location":
        return (
          <div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${m.locationLat || ""}&mlon=${m.locationLng || ""}#map=15/${m.locationLat || ""}/${m.locationLng || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary/10 rounded-lg p-3 hover:bg-primary/20 transition-colors"
            >
              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary">📍 Compartió ubicación</p>
                <p className="text-xs text-muted-foreground">{m.locationName || m.content}</p>
              </div>
            </a>
          </div>
        )
      default:
        return (
          <div>
            {m.imageUrl && (
              <img
                src={m.imageUrl}
                alt=""
                className="rounded-lg mb-2 max-h-48 max-w-full"
              />
            )}
            {m.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
            )}
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("chat-list")}>
            <ChevronLeft />
          </Button>
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="flex-1 rounded-lg border p-4 bg-muted/30 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
            >
              <div className="h-10 w-48 bg-muted animate-pulse rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!chatRoom) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <Button variant="ghost" onClick={() => navigate("chat-list")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver a chats
        </Button>
        <p className="mt-8 text-muted-foreground">Selecciona una conversación</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-3"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (socketRef.current && chatRoom && user) {
              socketRef.current.emit("leave-room", {
                roomId: chatRoom.id,
                userId: user.id,
              })
            }
            navigate("chat-list")
          }}
        >
          <ChevronLeft />
        </Button>

        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {otherName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {isOtherOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{otherName}</p>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isOtherOnline ? "bg-green-500" : "bg-muted-foreground/40"
              }`}
            />
            <p className="text-xs text-muted-foreground">
              {typingUsers.length > 0
                ? "Escribiendo..."
                : isOtherOnline
                  ? "En línea"
                  : "Desconectado"}
            </p>
          </div>
        </div>

        <Badge
          variant={isConnected ? "default" : "secondary"}
          className="text-[10px] gap-1"
        >
          {isConnected ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          {isConnected ? "En vivo" : "Sin conexión"}
        </Badge>
      </motion.div>

      {/* Product context banner */}
      <AnimatePresence>
        {chatRoom.product && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <Card
              className="bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() =>
                navigate("product-detail", {
                  productId: chatRoom.product!.id,
                })
              }
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {chatRoom.product.images?.[0] ? (
                    <img
                      src={chatRoom.product.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {chatRoom.product.title}
                  </p>
                  <p className="text-xs text-primary font-semibold">
                    C${chatRoom.product.price.toLocaleString("es-NI")}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] flex-shrink-0">
                  Ver producto
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div className="flex-1 rounded-xl border bg-muted/20 overflow-hidden flex flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-1"
        >
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Inicia la conversación con {otherName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Envía texto, imágenes, videos, audio o tu ubicación
              </p>
            </motion.div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground font-medium bg-background px-2 py-0.5 rounded-full">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Messages */}
                {group.messages.map((m, idx) => {
                  const isMine = m.senderId === user?.id
                  const prevMsg = idx > 0 ? group.messages[idx - 1] : null
                  const sameSender = prevMsg?.senderId === m.senderId

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${isMine ? "justify-end" : "justify-start"} ${
                        sameSender ? "mt-0.5" : "mt-3"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 ${
                          isMine
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border shadow-sm"
                        } ${sameSender ? (isMine ? "rounded-br-sm" : "rounded-bl-sm") : ""}`}
                      >
                        {renderMessageContent(m)}
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <p
                            className={`text-[10px] ${
                              isMine
                                ? "text-primary-foreground/60"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(m.createdAt)}
                          </p>
                          {isMine && (
                            <span
                              className={`text-[10px] ${
                                m.isRead
                                  ? "text-primary-foreground/80"
                                  : "text-primary-foreground/40"
                              }`}
                            >
                              {m.isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ))
          )}

          {/* Typing indicator */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex justify-start mt-3"
              >
                <div className="bg-card border rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full typing-dot" />
                    <span className="inline-block w-2 h-2 bg-primary rounded-full typing-dot" />
                    <span className="inline-block w-2 h-2 bg-primary rounded-full typing-dot" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3"
      >
        {/* Attachment menu */}
        <AnimatePresence>
          {showAttachMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 overflow-hidden"
            >
              <div className="flex gap-2 p-2 bg-card border rounded-xl">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*"
                      fileInputRef.current.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        if (target.files?.length) handleMediaUpload(target.files, "image")
                      }
                      fileInputRef.current.click()
                    }
                  }}
                >
                  <ImagePlus className="h-5 w-5 text-green-600" />
                  <span className="text-[10px]">Foto</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "video/*"
                      fileInputRef.current.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        if (target.files?.length) handleMediaUpload(target.files, "video")
                      }
                      fileInputRef.current.click()
                    }
                  }}
                >
                  <Video className="h-5 w-5 text-blue-600" />
                  <span className="text-[10px]">Video</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "audio/*"
                      fileInputRef.current.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        if (target.files?.length) handleMediaUpload(target.files, "audio")
                      }
                      fileInputRef.current.click()
                    }
                  }}
                >
                  <Mic className="h-5 w-5 text-purple-600" />
                  <span className="text-[10px]">Audio</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
                  onClick={sendLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <Loader2 className="h-5 w-5 text-red-600 animate-spin" />
                  ) : (
                    <MapPin className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-[10px]">Ubicación</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
          >
            {showAttachMenu ? <X className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
          </Button>
          <Input
            placeholder="Escribe un mensaje..."
            value={newMsg}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!newMsg.trim() || uploading}
            className="bg-primary hover:bg-primary/90 flex-shrink-0"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
