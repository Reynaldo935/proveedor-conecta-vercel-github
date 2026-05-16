"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Send, ChevronLeft, ImagePlus } from "lucide-react"

export function ChatView() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState("")
  const [chatRoom, setChatRoom] = useState<any>(null)

  // For demo, load most recent chat room
  useEffect(() => {
    fetch("/api/chat/rooms").then(r => r.json()).then(d => {
      if (d.success && d.data.length > 0) {
        const room = d.data[0]
        setChatRoom(room)
        fetch(`/api/chat/rooms/${room.id}/messages`).then(r => r.json()).then(md => {
          if (md.success) setMessages(md.data)
        })
      }
    })
  }, [])

  const sendMessage = async () => {
    if (!newMsg.trim() || !chatRoom) return
    try {
      const res = await fetch(`/api/chat/rooms/${chatRoom.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMsg }),
      })
      const d = await res.json()
      if (d.success) {
        setMessages(prev => [...prev, d.data])
        setNewMsg("")
      }
    } catch { toast.error("Error al enviar mensaje") }
  }

  const otherUser = chatRoom?.seller?.id === user?.id ? chatRoom.buyer : chatRoom?.seller

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("chat-list")}><ChevronLeft /></Button>
        <Avatar><AvatarImage src={otherUser?.avatar || undefined} /><AvatarFallback>{otherUser?.name?.charAt(0) || "?"}</AvatarFallback></Avatar>
        <div><p className="font-medium">{otherUser?.businessProfile?.businessName || otherUser?.name || "Chat"}</p><p className="text-xs text-muted-foreground">En línea</p></div>
      </div>

      <ScrollArea className="flex-1 rounded-lg border p-4 bg-muted/30">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Inicia la conversación</p>
        ) : (
          <div className="space-y-3">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${m.senderId === user?.id ? "bg-primary text-primary-foreground chat-bubble-sent" : "bg-card border chat-bubble-received"}`}>
                  {m.imageUrl && <img src={m.imageUrl} alt="" className="rounded-lg mb-2 max-h-48" />}
                  {m.content && <p>{m.content}</p>}
                  <p className={`text-[10px] mt-1 ${m.senderId === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(m.createdAt).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="mt-3 flex gap-2">
        <Input placeholder="Escribe un mensaje..." value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} className="flex-1" />
        <Button size="icon" onClick={sendMessage} disabled={!newMsg.trim()}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}
