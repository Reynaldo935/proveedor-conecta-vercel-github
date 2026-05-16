"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Send, ChevronLeft, ImagePlus } from "lucide-react"

interface ChatMessage {
  id: string
  chatRoomId: string
  senderId: string
  content: string
  imageUrl: string
  isRead: boolean
  createdAt: string
  sender?: { id: string; name: string; avatar: string }
}

export function ChatView() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMsg, setNewMsg] = useState("")
  const [chatRoom, setChatRoom] = useState<any>(null)
  const [isOtherOnline, setIsOtherOnline] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Connect to Socket.IO
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
      console.log("[ChatView] Socket connected")
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
      console.log("[ChatView] Socket disconnected")
    })

    // Listen for new messages
    socket.on("new-message", (message: ChatMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
    })

    // Listen for typing indicators
    socket.on("typing", (data: { roomId: string; users: string[] }) => {
      if (data.roomId === chatRoom?.id) {
        // Filter out current user from typing list
        const otherTyping = data.users.filter((u) => u !== user?.id)
        setTypingUsers(otherTyping)
      }
    })

    // Listen for user online/offline
    socket.on("user-online", (data: { roomId: string; userId: string }) => {
      if (data.roomId === chatRoom?.id && data.userId !== user?.id) {
        setIsOtherOnline(true)
      }
    })

    socket.on("user-offline", (data: { roomId: string; userId: string }) => {
      if (data.roomId === chatRoom?.id && data.userId !== user?.id) {
        setIsOtherOnline(false)
      }
    })

    // Listen for read receipts
    socket.on("messages-read", (data: { roomId: string; userId: string }) => {
      if (data.roomId === chatRoom?.id) {
        // Mark messages as read locally
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user?.id ? { ...m, isRead: true } : m
          )
        )
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  // Load initial chat room and messages via REST API
  useEffect(() => {
    fetch("/api/chat/rooms")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.length > 0) {
          const room = d.data[0]
          setChatRoom(room)
          // Join the socket room
          if (socketRef.current && user) {
            socketRef.current.emit("join-room", {
              roomId: room.id,
              userId: user.id,
            })
          }
          // Load messages via REST
          fetch(`/api/chat/rooms/${room.id}/messages`)
            .then((r) => r.json())
            .then((md) => {
              if (md.success) setMessages(md.data)
            })
        }
      })
  }, [user])

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

      // Emit typing start
      socketRef.current.emit("typing", {
        roomId: chatRoom.id,
        userId: user.id,
        isTyping: value.length > 0,
      })

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Stop typing after 3 seconds of inactivity
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

  // Send message via Socket.IO
  const sendMessage = async () => {
    if (!newMsg.trim() || !chatRoom || !user) return

    const content = newMsg.trim()
    setNewMsg("")

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
      // Send via Socket.IO for real-time delivery
      socketRef.current.emit("send-message", {
        roomId: chatRoom.id,
        senderId: user.id,
        content,
      })
    } else {
      // Fallback to REST API
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

  const otherUser =
    chatRoom?.seller?.id === user?.id ? chatRoom.buyer : chatRoom?.seller
  const otherName =
    otherUser?.businessProfile?.businessName || otherUser?.name || "Chat"

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            // Leave the room when navigating back
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
        <Avatar>
          <AvatarImage src={otherUser?.avatar || undefined} />
          <AvatarFallback>
            {otherUser?.name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium">{otherName}</p>
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
          className="text-[10px]"
        >
          {isConnected ? "En vivo" : "Sin conexión"}
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 rounded-lg border p-4 bg-muted/30">
        <div ref={scrollRef} className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Inicia la conversación
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.senderId === user?.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                    m.senderId === user?.id
                      ? "bg-primary text-primary-foreground chat-bubble-sent"
                      : "bg-card border chat-bubble-received"
                  }`}
                >
                  {m.imageUrl && (
                    <img
                      src={m.imageUrl}
                      alt=""
                      className="rounded-lg mb-2 max-h-48"
                    />
                  )}
                  {m.content && <p>{m.content}</p>}
                  <div className="flex items-center gap-1 justify-end">
                    <p
                      className={`text-[10px] mt-1 ${
                        m.senderId === user?.id
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString("es-NI", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {m.senderId === user?.id && (
                      <span className="text-[10px] text-primary-foreground/70">
                        {m.isRead ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-card border rounded-2xl px-4 py-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="inline-block w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="inline-block w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                  <span className="ml-1 text-xs">Escribiendo</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="mt-3 flex gap-2">
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
          disabled={!newMsg.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
