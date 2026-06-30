"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Package,
  FileText,
  MapPin,
  Minus,
  Sparkles,
  RotateCcw,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "assistant"
  content: string
  model?: string
  timestamp: number
}

interface ConversationMsg {
  role: "user" | "assistant"
  content: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''
const CHAT_HISTORY_KEY = "pc_chat_history_v2"
const MAX_HISTORY_MESSAGES = 10

const QUICK_SUGGESTIONS = [
  {
    id: "find-supplier",
    label: "¿Cómo encontrar proveedores?",
    icon: Search,
    prompt: "¿Cómo puedo encontrar proveedores en ProveedorConecta?",
  },
  {
    id: "payment-methods",
    label: "¿Métodos de pago?",
    icon: CreditCard,
    prompt: "¿Qué métodos de pago aceptan en ProveedorConecta?",
  },
  {
    id: "publish-product",
    label: "¿Cómo publicar un producto?",
    icon: Package,
    prompt: "¿Cómo publico un producto para vender en ProveedorConecta?",
  },
  {
    id: "cotizacion",
    label: "¿Qué es una cotización?",
    icon: FileText,
    prompt: "¿Qué es una cotización y cómo funciona en ProveedorConecta?",
  },
  {
    id: "map",
    label: "¿Cómo funciona el mapa?",
    icon: MapPin,
    prompt: "¿Cómo funciona el mapa interactivo de proveedores?",
  },
]

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "¡Hola! 👋 Soy el asistente virtual de ProveedorConecta Nicaragua. Estoy aquí para ayudarte con todo lo que necesites sobre la plataforma.\n\nPuedo ayudarte a:\n🔍 Encontrar proveedores\n💰 Conocer métodos de pago\n📦 Publicar productos\n📋 Solicitar cotizaciones\n🗺️ Usar el mapa\n\n¿En qué te puedo ayudar?",
  model: "Sistema",
  timestamp: Date.now(),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-NI", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY)
    if (raw) {
      const parsed: ChatMessage[] = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(-MAX_HISTORY_MESSAGES)
      }
    }
  } catch {
    // ignore
  }
  return [INITIAL_MESSAGE]
}

function saveChatHistory(messages: ChatMessage[]) {
  try {
    const toSave = messages.slice(-MAX_HISTORY_MESSAGES)
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave))
  } catch {
    // localStorage not available
  }
}

// ─── Local Knowledge Base (always available, instant responses) ──────────────
function getLocalResponse(msg: string): string | null {
  const q = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  if (q.includes('hola') || q.includes('buenos dias') || q.includes('buenas tardes')) {
    return '¡Hola! 👋 Soy el asistente de ProveedorConecta Nicaragua. Puedo ayudarte a:\n\n🔍 **Encontrar proveedores** - Tenemos 20+ proveedores oficiales y vendedores registrados\n💰 **Métodos de pago** - 11 métodos incluyendo Banpro, BAC, LAFISE, PayPal, Kash\n📦 **Publicar productos** - Regístrate como vendedor y publica tus productos con fotos\n📋 **Cotizaciones** - Solicita cotizaciones a múltiples proveedores a la vez\n🗺️ **Mapa GPS** - Encuentra proveedores por ubicación en tiempo real\n💬 **Chat** - Comunícate directamente con vendedores\n\n¿Sobre qué tema quieres saber más?'
  }
  
  if (q.includes('proveedor') || q.includes('encontrar') || q.includes('buscar')) {
    return '🔍 **Encontrar proveedores en ProveedorConecta:**\n\n1. Ve al menú ☰ → **Catálogos Oficiales**\n2. Ahí verás 20+ proveedores nicaragüenses verificados (Flor de Caña, Café Toro, Ferromax, etc.)\n3. También hay una pestaña **"Vendedores"** con vendedores registrados\n4. Usa el buscador para filtrar por nombre, producto o ciudad\n5. Cada proveedor muestra sus productos con **precios reales**\n6. Haz clic en **"Ver Catálogo Real"** para ir al sitio oficial\n\n¿Buscas algún proveedor en específico?'
  }
  
  if (q.includes('pago') || q.includes('pagar') || q.includes('banco') || q.includes('metodo')) {
    return '💰 **Métodos de pago disponibles (11):**\n\n🏦 **Bancos:** Banpro, BAC Credomatic, LAFISE\n📱 **Billeteras:** Banpro Billetera, Kash, Tigo Money\n💳 **Pasarelas:** PixelPay, Pagadito\n🌐 **Internacionales:** PayPal, Google Pay, Western Union\n\n**Comisión de plataforma:** 3% por transacción\n**Monedas:** Córdobas (NIO) y Dólares (USD)\n\nPara pagar: Ve a **Pagos** en el menú y selecciona tu método. Serás redirigido al canal de pago real del banco.'
  }
  
  if (q.includes('publicar') || q.includes('vender') || q.includes('producto') || q.includes('vendedor')) {
    return '📦 **Cómo publicar un producto:**\n\n1. Regístrate en ProveedorConecta con tu Google/Email\n2. Ve a tu **Perfil** y haz clic en **"🏪 Convertirse en Vendedor"**\n3. Completa tu perfil de negocio (nombre, categoría, teléfono)\n4. Ve a **"Vender Producto"** en el menú\n5. Sube hasta 5 fotos de tu producto\n6. Elige categoría, pon precio y descripción\n7. ¡Listo! Tu producto aparece en:\n   - Marketplace (página principal)\n   - Tu perfil de vendedor\n   - Catálogos → Tab "Vendedores"\n\n¿Necesitas ayuda con algo específico de la publicación?'
  }
  
  if (q.includes('cotizacion') || q.includes('cotizar') || q.includes('rfq')) {
    return '📋 **Sistema de Cotizaciones (RFQ):**\n\n1. Ve a **Cotizaciones** en el menú\n2. Describe qué producto/servicio necesitas\n3. Elige la categoría\n4. Tu solicitud se envía a TODOS los vendedores de esa categoría\n5. Los vendedores te envían propuestas con precio y plazo\n6. Tú eliges la mejor oferta\n\n**Estados:** OPEN → RESPONDED → ACCEPTED → COMPLETED\n\nEs como pedir presupuestos a múltiples proveedores a la vez. ¡Ahorra tiempo y dinero!'
  }
  
  if (q.includes('mapa') || q.includes('gps') || q.includes('ubicacion')) {
    return '🗺️ **Mapa Interactivo de Proveedores:**\n\n1. Ve a **Mapa GPS** en el menú\n2. El mapa muestra proveedores en los 17 departamentos de Nicaragua\n3. Usa tu ubicación GPS para encontrar proveedores cercanos\n4. Filtra por categoría (Alimentos, Construcción, Tecnología, etc.)\n5. Haz clic en un marcador para ver detalles del proveedor\n\nTecnología: Leaflet + OpenStreetMap + Nominatim'
  }
  
  if (q.includes('admin') || q.includes('administrador') || q.includes('panel')) {
    return '👑 **Panel de Administración:**\n\nEl administrador único (rey7214935@gmail.com) tiene acceso a:\n- 📊 Dashboard con estadísticas de ventas y usuarios\n- 👥 Ver TODOS los usuarios registrados\n- 🔍 Auditoría de actividad\n- 💾 Backup completo de la base de datos\n- 📢 Gestionar anuncios publicitarios\n- 📥 Exportar datos (CSV/JSON)\n\nSi necesitas acceso de administrador, contacta al equipo.'
  }
  
  if (q.includes('chat') || q.includes('mensaje') || q.includes('comunicar')) {
    return '💬 **Chat en Tiempo Real:**\n\n- Comunícate directamente con vendedores\n- Envía mensajes, imágenes, videos y archivos\n- Comparte tu ubicación GPS en tiempo real\n- Indicadores de escritura y estado en línea\n- Tecnología: Pusher + Socket.io\n- Fallback HTTP cuando WebSocket no está disponible\n\nPara chatear: Ve a un producto y haz clic en **"Contactar vendedor"**'
  }
  
  return null // No local match, try AI
}

function getFallbackResponse(): string {
  const responses = [
    'Puedo ayudarte con:\n\n🔍 **Proveedores** - Menú → Catálogos Oficiales (20+ proveedores NI)\n💰 **Pagos** - 11 métodos (Banpro, BAC, LAFISE, PayPal, etc.)\n📦 **Vender** - Perfil → Convertirse en Vendedor\n📋 **Cotizaciones** - Solicita presupuestos a proveedores\n🗺️ **Mapa** - Encuentra proveedores por ubicación\n💬 **Chat** - Comunícate con vendedores en tiempo real\n\n¿Qué tema te interesa?',
    '¡Estoy aquí para ayudarte! 🚀\n\nProveedorConecta tiene:\n- **328 productos** en **16 categorías**\n- **20+ proveedores** oficiales verificados\n- **11 métodos** de pago nicaragüenses\n- **Chat** en tiempo real\n- **Mapa** interactivo\n\nDime qué necesitas y te guío.',
  ]
  return responses[Math.floor(Math.random() * responses.length)]
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
  const [isMinimized, setIsMinimized] = useState(false)
  const [productContextInjected, setProductContextInjected] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Save chat history on message change
  useEffect(() => {
    saveChatHistory(messages)
  }, [messages])

  // Smooth scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, isMinimized])

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
        const formattedPrice = new Intl.NumberFormat("es-NI", {
          style: "currency",
          currency: "NIO",
        }).format(product.price)
        const contextMsg: ChatMessage = {
          role: "assistant",
          content: `Veo que estás interesado en **${product.title}** de **${sellerName}** (${formattedPrice}). ¿Quieres que te ayude a contactarlo o tienes alguna pregunta sobre el producto?`,
          model: "Contexto automático",
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, contextMsg])
      }
    } catch {
      // Silently fail
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

  // Build conversation history for API (last N user/assistant exchanges)
  const buildConversationHistory = (): ConversationMsg[] => {
    return messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8) // Last 8 messages for context
      .map((m) => ({
        role: m.role,
        content: m.content,
      }))
  }

  const sendMessage = async (messageText?: string) => {
    const msg = messageText || input.trim()
    if (!msg || loading) return
    setInput("")
    setLoading(true)

    const userMessage: ChatMessage = {
      role: "user",
      content: msg,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])

    // ── Try Gemini AI FIRST (free tier, always available) ──
    try {
      const geminiRes = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversationHistory: buildConversationHistory(),
        }),
      })
      const geminiData = await geminiRes.json()
      if (geminiData.success) {
        addBotMessage(geminiData.data.message, geminiData.data.model)
        setLoading(false)
        return
      }
    } catch { /* fall through */ }

    // ── Try local knowledge base (always available, instant) ──
    const localAnswer = getLocalResponse(msg)
    if (localAnswer) {
      addBotMessage(localAnswer, 'ProveedorConecta')
      setLoading(false)
      return
    }

    try {
      // Try n8n webhook if URL is configured
      if (N8N_WEBHOOK_URL) {
        try {
          const n8nRes = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: msg,
              sessionId: user?.id || 'anonymous',
              userName: user?.name || 'Visitante',
              conversationHistory: buildConversationHistory(),
              source: 'proveedorconecta-chatbot',
            }),
          })
          
          if (n8nRes.ok) {
            const n8nData = await n8nRes.json()
            const responseText = n8nData.response || n8nData.message || n8nData.output || n8nData.text || JSON.stringify(n8nData)
            addBotMessage(responseText, 'n8n')
            setLoading(false)
            return
          }
        } catch (n8nError) {
          console.warn('n8n webhook failed, trying fallback...')
        }
      }

      // Fallback to internal AI API
      const res = await authFetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          model: "zai",
          conversationHistory: buildConversationHistory(),
          context: user?.name ? `Usuario: ${user.name}` : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        addBotMessage(data.data.message, data.data.model)
      } else {
        addBotMessage(getFallbackResponse(), 'ProveedorConecta')
      }
    } catch {
      addBotMessage(getFallbackResponse(), 'ProveedorConecta')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (prompt: string) => {
    sendMessage(prompt)
  }

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE])
  }

  const handleMinimize = () => {
    setIsMinimized(true)
  }

  const handleRestore = () => {
    setIsMinimized(false)
  }

  // Determine if suggestions should show (only at start with few messages)
  const showSuggestions = messages.length <= 2 && !loading

  // ─── Floating button when closed ──────────────────────────────────────────
  if (!isOpen) {
    return (
      <motion.button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center group"
        style={{
          background: "linear-gradient(135deg, #1A5276, #2E86C1)",
          boxShadow: "0 4px 20px rgba(26, 82, 118, 0.4)",
        }}
        whileHover={{ scale: 1.1, boxShadow: "0 6px 28px rgba(26, 82, 118, 0.5)" }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
        aria-label="Abrir asistente virtual"
      >
        <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        <motion.span
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#F4D03F] border-2 border-white"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.button>
    )
  }

  // ─── Minimized state ──────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={handleRestore}
          className="flex items-center gap-2 px-4 py-3 rounded-full text-white shadow-lg hover:shadow-xl transition-shadow"
          style={{
            background: "linear-gradient(135deg, #1A5276, #2E86C1)",
            boxShadow: "0 4px 20px rgba(26, 82, 118, 0.4)",
          }}
          aria-label="Restaurar asistente"
        >
          <Bot className="h-4 w-4" />
          <span className="text-sm font-medium">Asistente</span>
          <motion.span
            className="h-2 w-2 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </button>
      </motion.div>
    )
  }

  // ─── Full chat window ─────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)]"
    >
      <div className="rounded-2xl shadow-2xl overflow-hidden border border-border bg-card flex flex-col"
        style={{ height: "min(560px, 70vh)" }}
      >
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-3 text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Asistente ProveedorConecta</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-green-400"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <p className="text-[10px] opacity-80">En línea · IA Multi-modelo</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
              onClick={clearChat}
              title="Limpiar chat"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
              onClick={handleMinimize}
              title="Minimizar"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
              onClick={onToggle}
              title="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ─── Quick Suggestions ──────────────────────────────────────────── */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="shrink-0 border-b bg-muted/30 px-3 py-2.5"
            >
              <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase tracking-wider">
                Preguntas frecuentes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((suggestion, i) => (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors dark:bg-primary/10 dark:text-primary-foreground dark:hover:bg-primary/20"
                  >
                    <suggestion.icon className="h-3 w-3 shrink-0" />
                    <span className="whitespace-nowrap">{suggestion.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Messages Area ──────────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(26, 82, 118, 0.2) transparent",
          }}
        >
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={`${msg.timestamp}-${i}`}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex flex-col max-w-[85%]">
                  {/* Message bubble */}
                  <div
                    className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-2xl rounded-br-md text-white"
                        : "rounded-2xl rounded-bl-md bg-muted text-foreground"
                    }`}
                    style={
                      msg.role === "user"
                        ? { background: "linear-gradient(135deg, #1A5276, #2E86C1)" }
                        : {}
                    }
                  >
                    {/* Bot avatar for assistant messages */}
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="h-4 w-4 rounded-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
                        >
                          <Bot className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {msg.model || "Asistente"}
                        </span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  {/* Timestamp */}
                  <p
                    className={`text-[9px] mt-0.5 px-1 ${
                      msg.role === "user"
                        ? "text-right text-muted-foreground"
                        : "text-left text-muted-foreground"
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* ─── Typing indicator ────────────────────────────────────────── */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex justify-start"
              >
                <div className="flex flex-col max-w-[85%]">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="h-4 w-4 rounded-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
                      >
                        <Bot className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Escribiendo...
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <motion.span
                        className="inline-block w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -5, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.span
                        className="inline-block w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -5, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                      />
                      <motion.span
                        className="inline-block w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -5, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Input Area ────────────────────────────────────────────────── */}
        <div className="shrink-0 px-3 py-2.5 border-t bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex gap-2 items-center"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta..."
              disabled={loading}
              className="flex-1 text-sm h-9 bg-background border-border focus-visible:ring-primary/30"
              maxLength={500}
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                className="h-9 w-9 shrink-0"
                style={{
                  background: input.trim()
                    ? "linear-gradient(135deg, #1A5276, #2E86C1)"
                    : undefined,
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </motion.div>
          </form>
          {isAuthenticated && (
            <div className="flex items-center justify-center mt-1.5">
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal text-muted-foreground border-border/50">
                🔒 Chat privado · {user?.name || "Usuario"}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
