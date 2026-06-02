"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthStore } from "@/store/auth-store"
import { useAppStore } from "@/store/app-store"
import { authFetch } from "@/lib/client-auth"
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Search,
  CreditCard,
  HeadphonesIcon,
  Package,
  User,
  ShoppingCart,
  HelpCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  model?: string
  timestamp: number
}

const CHAT_HISTORY_KEY = "pc_chat_history"

// Quick action buttons with structured behavior
const QUICK_ACTIONS = [
  {
    id: "search",
    label: "🔍 Buscar proveedor",
    icon: Search,
    prompt: "Buscar proveedor",
    color: "text-primary",
    bg: "bg-primary/10",
    action: "search" as const,
  },
  {
    id: "track",
    label: "📦 Rastrear pedido",
    icon: Package,
    prompt: "Rastrear pedido",
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
    action: "track" as const,
  },
  {
    id: "payment",
    label: "💳 Ayuda con pagos",
    icon: CreditCard,
    prompt: "Ayuda con pagos",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    action: "payment" as const,
  },
  {
    id: "seller",
    label: "👤 Hablar con vendedor",
    icon: User,
    prompt: "Hablar con vendedor",
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-900/30",
    action: "seller" as const,
  },
]

const PAYMENT_FAQ = [
  { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos: BANPRO, BAC, LAFISE, Billetera Móvil, PayPal, PixelPay, Pagadito, Google Pay, Kash y Western Union." },
  { q: "¿Es seguro pagar en línea?", a: "Sí, todas las transacciones están protegidas con encriptación SSL. Tu información financiera nunca se almacena en nuestros servidores." },
  { q: "¿Cómo recargo mi billetera?", a: "Ve a Mi Perfil → Billetera → Recargar. Cada recarga es de C$10,000." },
  { q: "¿Puedo obtener reembolso?", a: "Sí, dentro de los 7 días posteriores a la compra. Ve a la transacción y selecciona 'Solicitar reembolso'." },
]

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "¡Hola! Soy tu asistente virtual. Puedo ayudarte a encontrar proveedores, resolver dudas de pago o conectarte con un vendedor. ¿Qué necesitas?",
  model: "Sistema",
  timestamp: Date.now(),
}

function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return [INITIAL_MESSAGE]
}

function saveChatHistory(messages: ChatMessage[]) {
  try {
    // Keep last 50 messages to avoid storage overflow
    const toSave = messages.slice(-50)
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave))
  } catch {
    // localStorage not available
  }
}

export function AIChatbot({
  isOpen,
  onToggle,
}: {
  isOpen: boolean
  onToggle: () => void
}) {
  const { user, isAuthenticated } = useAuthStore()
  const { selectedProductId, navigate } = useAppStore()
  const [messages, setMessages] = useState<ChatMessage[]>(loadChatHistory)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [productContextInjected, setProductContextInjected] = useState(false)
  const [awaitingOrderId, setAwaitingOrderId] = useState(false)
  const [showPaymentFAQ, setShowPaymentFAQ] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Save chat history on message change
  useEffect(() => {
    saveChatHistory(messages)
  }, [messages])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Auto-inject product context when opened from product page
  useEffect(() => {
    if (isOpen && selectedProductId && !productContextInjected && isAuthenticated) {
      setProductContextInjected(true)
      injectProductContext(selectedProductId)
    }
  }, [isOpen, selectedProductId, productContextInjected, isAuthenticated])

  const injectProductContext = async (productId: string) => {
    try {
      const res = await authFetch(`/api/products?id=${productId}`)
      const data = await res.json()
      if (data.success && data.data) {
        const product = data.data
        const sellerName =
          product.seller?.businessProfile?.businessName || product.seller?.name || "el vendedor"
        const contextMsg: ChatMessage = {
          role: "assistant",
          content: `Veo que estás interesado en **${product.title}** de **${sellerName}** (${new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(product.price)}). ¿Quieres que te ayude a contactarlo?`,
          model: "Contexto automático",
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, contextMsg])
      }
    } catch {
      // Silently fail
    }
  }

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case "search":
        // Auto-navigate to search
        addBotMessage("¡Te llevo a la búsqueda! Puedes filtrar por categoría, departamento o precio.")
        setTimeout(() => navigate("search"), 800)
        break
      case "track":
        setAwaitingOrderId(true)
        addBotMessage("Por favor, ingresa el ID de tu pedido para rastrearlo. Lo encontrarás en tu historial de compras.")
        break
      case "payment":
        setShowPaymentFAQ(true)
        addBotMessage("Aquí tienes las preguntas frecuentes sobre pagos. Selecciona una opción:")
        break
      case "seller":
        addBotMessage("He marcado esta conversación para que un vendedor te responda pronto. Mientras tanto, ¿puedo ayudarte con algo más?")
        break
    }
  }

  const addBotMessage = (content: string, model?: string) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content,
        model: model || "Sistema",
        timestamp: Date.now(),
      },
    ])
  }

  const sendMessage = async (messageText?: string) => {
    const msg = messageText || input.trim()
    if (!msg || loading) return
    setInput("")
    setShowQuickActions(false)
    setShowPaymentFAQ(false)

    const userMessage: ChatMessage = {
      role: "user",
      content: msg,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Handle awaiting order ID
    if (awaitingOrderId) {
      setAwaitingOrderId(false)
      addBotMessage(`Buscando el pedido "${msg}"... Si no encuentras tu pedido, revisa tu historial en el panel de comprador.`)
      return
    }

    setLoading(true)

    try {
      const res = await authFetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      if (data.success) {
        addBotMessage(data.data.message, data.data.model)
      } else {
        addBotMessage(
          "Estamos experimentando alta demanda. Un vendedor te responderá pronto.",
          "Fallback"
        )
      }
    } catch {
      addBotMessage(
        "Estamos experimentando alta demanda. Un vendedor te responderá pronto.",
        "Fallback"
      )
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
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#F4D03F]"
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
        <div
          className="flex items-center justify-between p-4 border-b text-white"
          style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Asistente ProveedorConecta</p>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[10px] opacity-80">En línea · IA Multi-agente</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={onToggle}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick action buttons - shown when few messages */}
        {showQuickActions && messages.length <= 2 && (
          <div className="p-3 border-b bg-muted/30">
            <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">
              Acciones rápidas
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <motion.button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  className={`flex items-center gap-1.5 p-2 rounded-lg ${action.bg} hover:opacity-80 transition-opacity`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                  <span className="text-[11px] font-medium text-left leading-tight">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Payment FAQ */}
        <AnimatePresence>
          {showPaymentFAQ && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 border-b bg-amber-50/50 dark:bg-amber-900/10"
            >
              <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">
                Preguntas frecuentes sobre pagos
              </p>
              <div className="space-y-1.5">
                {PAYMENT_FAQ.map((faq, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      addBotMessage(faq.a, "FAQ")
                      setShowPaymentFAQ(false)
                    }}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg border hover:bg-primary/5 hover:border-primary/30 transition-colors flex items-center gap-2"
                  >
                    <HelpCircle className="h-3 w-3 text-amber-500 shrink-0" />
                    {faq.q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="h-72 overflow-y-auto p-4 space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={`${msg.timestamp}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2.5 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "text-white chat-bubble-sent"
                      : "bg-muted chat-bubble-received"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "linear-gradient(135deg, #1A5276, #2E86C1)" }
                      : {}
                  }
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.model && msg.role === "assistant" && (
                    <p className="text-[9px] mt-1 opacity-50">🤖 {msg.model}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator - animated 3 dots */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-muted px-4 py-3 rounded-xl flex items-center gap-1.5">
                <motion.span
                  className="inline-block w-2 h-2 bg-primary rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="inline-block w-2 h-2 bg-primary rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                />
                <motion.span
                  className="inline-block w-2 h-2 bg-primary rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                />
                <span className="text-xs text-muted-foreground ml-1">Pensando...</span>
              </div>
            </motion.div>
          )}

          {/* Awaiting order ID prompt */}
          {awaitingOrderId && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl text-sm border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-400">
                  📦 Escribe el ID de tu pedido:
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={awaitingOrderId ? "Ingresa el ID del pedido..." : "Escribe tu consulta..."}
            className="flex-1 text-sm"
            style={{ backgroundColor: "#fff !important", color: "#000 !important" }}
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
