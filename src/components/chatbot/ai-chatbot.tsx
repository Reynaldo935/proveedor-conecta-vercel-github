"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  model?: string
}

export function AIChatbot({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "¡Hola! 👋 Soy el asistente virtual de ProveedorConecta Nicaragua. ¿En qué puedo ayudarte? Puedo ayudarte a encontrar proveedores, conocer métodos de pago, publicar productos y más.", model: "Sistema" },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [...prev, { role: "assistant", content: data.data.message, model: data.data.model }])
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, hubo un error. Intenta de nuevo.", model: "Error Recovery" }])
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Por favor intenta más tarde.", model: "Fallback" }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-105"
        aria-label="Abrir asistente"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]">
      <Card className="shadow-2xl border-2">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <div>
              <p className="font-semibold text-sm">Asistente ProveedorConecta</p>
              <p className="text-[10px] opacity-80">En línea · IA Multi-agente</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground chat-bubble-sent" : "bg-muted chat-bubble-received"}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.model && msg.role === "assistant" && (
                  <p className="text-[9px] mt-1 opacity-60">🤖 {msg.model}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-3 rounded-xl flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Pensando...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Escribe tu consulta..."
            className="flex-1 text-sm"
          />
          <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()} className="bg-primary hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
