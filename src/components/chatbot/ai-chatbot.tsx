"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Loader2,
  Search,
  CreditCard,
  HeadphonesIcon,
  ShoppingCart,
  Package,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  model?: string
}

const QUICK_ACTIONS = [
  {
    label: "Buscar productos",
    icon: Search,
    prompt: "¿Cómo puedo buscar productos en ProveedorConecta?",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Ayuda con pagos",
    icon: CreditCard,
    prompt: "¿Qué métodos de pago están disponibles?",
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  {
    label: "Soporte",
    icon: HeadphonesIcon,
    prompt: "Necesito contactar con soporte al cliente",
    color: "text-dorado",
    bg: "bg-dorado/10",
  },
]

const SUGGESTED_QUESTIONS = [
  "¿Cómo publico un producto?",
  "¿Qué es una cotización?",
  "¿Cómo contacto a un vendedor?",
  "¿Es seguro comprar aquí?",
]

export function AIChatbot({
  isOpen,
  onToggle,
}: {
  isOpen: boolean
  onToggle: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "¡Hola! 👋 Soy el asistente virtual de ProveedorConecta Nicaragua. ¿En qué puedo ayudarte?",
      model: "Sistema",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [typingText, setTypingText] = useState("")
  const [isTypingResponse, setIsTypingResponse] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typingText])

  // Typing animation effect
  useEffect(() => {
    if (!isTypingResponse || !typingText) return

    let index = 0
    const interval = setInterval(() => {
      if (index < typingText.length) {
        index++
        // We don't need to update state here since we handle it differently
      } else {
        clearInterval(interval)
        setIsTypingResponse(false)
        setTypingText("")
      }
    }, 15)

    return () => clearInterval(interval)
  }, [isTypingResponse, typingText])

  const sendMessage = async (messageText?: string) => {
    const msg = messageText || input.trim()
    if (!msg || loading) return
    setInput("")
    setShowSuggestions(false)
    setMessages((prev) => [...prev, { role: "user", content: msg }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      if (data.success) {
        const responseText = data.data.message
        // Start typing animation
        setIsTypingResponse(true)
        setTypingText(responseText)

        // Add the message after a brief delay for the typing effect
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: responseText,
              model: data.data.model,
            },
          ])
          setIsTypingResponse(false)
          setTypingText("")
        }, Math.min(responseText.length * 10, 800))
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Lo siento, hubo un error. Intenta de nuevo.",
            model: "Error Recovery",
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error de conexión. Por favor intenta más tarde.",
          model: "Fallback",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <motion.button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Abrir asistente"
      >
        <MessageCircle className="h-6 w-6" />
        <motion.span
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-volcan"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]"
    >
      <Card className="shadow-2xl border-2 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Asistente ProveedorConecta</p>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[10px] opacity-80">
                  En línea · IA Multi-agente
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onToggle}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick action buttons */}
        {messages.length <= 1 && (
          <div className="p-3 border-b bg-muted/30">
            <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">
              Acciones rápidas
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <motion.button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg ${action.bg} hover:opacity-80 transition-opacity`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                  <span className="text-[10px] font-medium text-center leading-tight">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="h-72 overflow-y-auto p-4 space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2.5 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground chat-bubble-sent"
                      : "bg-muted chat-bubble-received"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.model && msg.role === "assistant" && (
                    <p className="text-[9px] mt-1 opacity-50">🤖 {msg.model}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && !isTypingResponse && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-muted px-4 py-3 rounded-xl flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-primary rounded-full typing-dot" />
                  <span className="inline-block w-2 h-2 bg-primary rounded-full typing-dot" />
                  <span className="inline-block w-2 h-2 bg-primary rounded-full typing-dot" />
                </div>
                <span className="text-xs text-muted-foreground ml-1">
                  Pensando...
                </span>
              </div>
            </motion.div>
          )}

          {/* Response typing animation */}
          {isTypingResponse && typingText && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[85%] px-3 py-2.5 rounded-xl text-sm bg-muted chat-bubble-received">
                <p className="whitespace-pre-wrap">{typingText}</p>
              </div>
            </motion.div>
          )}

          {/* Suggested questions (show on first load) */}
          {showSuggestions && messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-1.5"
            >
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Preguntas sugeridas
              </p>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <motion.button
                  key={q}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border hover:bg-primary/5 hover:border-primary/30 transition-colors"
                >
                  {q}
                </motion.button>
              ))}
            </motion.div>
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
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="bg-primary hover:bg-primary/90 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
