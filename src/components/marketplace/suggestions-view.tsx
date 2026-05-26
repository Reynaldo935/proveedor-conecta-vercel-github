"use client"

import { useState } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Lightbulb,
  Send,
  ChevronLeft,
  MessageSquare,
  ThumbsUp,
  CheckCircle,
  Clock,
  Plus,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Suggestion {
  id: string
  title: string
  description: string
  category: string
  votes: number
  status: "new" | "reviewing" | "implemented"
  createdAt: string
}

const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    id: "1",
    title: "Integración con WhatsApp Business",
    description: "Permitir a los vendedores recibir notificaciones de pedidos directamente por WhatsApp",
    category: "Integración",
    votes: 24,
    status: "reviewing",
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    title: "Sistema de reseñas y calificaciones",
    description: "Agregar reseñas verificadas para que los compradores evalúen a los proveedores",
    category: "Marketplace",
    votes: 18,
    status: "new",
    createdAt: "2026-02-01",
  },
  {
    id: "3",
    title: "Pago con criptomonedas",
    description: "Aceptar Bitcoin y stablecoins como método de pago alternativo",
    category: "Pagos",
    votes: 12,
    status: "new",
    createdAt: "2026-02-10",
  },
  {
    id: "4",
    title: "Catálogo PDF descargable por proveedor",
    description: "Generar catálogos PDF automáticos con los productos de cada proveedor",
    category: "Exportación",
    votes: 30,
    status: "implemented",
    createdAt: "2025-12-01",
  },
  {
    id: "5",
    title: "Notificaciones push en tiempo real",
    description: "Alertas instantáneas cuando un comprador muestra interés en tus productos",
    category: "Notificaciones",
    votes: 15,
    status: "reviewing",
    createdAt: "2026-01-20",
  },
]

const STATUS_CONFIG = {
  new: { label: "Nueva", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  reviewing: { label: "En Revisión", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Lightbulb },
  implemented: { label: "Implementada", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
}

export function SuggestionsView() {
  const { navigate } = useAppStore()
  const { isAuthenticated } = useAuthStore()
  const [suggestions, setSuggestions] = useState<Suggestion[]>(INITIAL_SUGGESTIONS)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())

  const handleSubmitSuggestion = () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error("Completa el título y la descripción")
      return
    }
    const newSuggestion: Suggestion = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
      category: newCategory || "General",
      votes: 0,
      status: "new",
      createdAt: new Date().toISOString().split("T")[0],
    }
    setSuggestions(prev => [newSuggestion, ...prev])
    setNewTitle("")
    setNewDescription("")
    setNewCategory("")
    setShowForm(false)
    toast.success("¡Sugerencia enviada! Gracias por tu aporte 🇳🇮")
  }

  const handleVote = (id: string) => {
    if (!isAuthenticated) {
      toast.error("Inicia sesión para votar")
      navigate("login")
      return
    }
    if (votedIds.has(id)) {
      setVotedIds(prev => { const n = new Set(prev); n.delete(id); return n })
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, votes: s.votes - 1 } : s))
    } else {
      setVotedIds(prev => new Set(prev).add(id))
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, votes: s.votes + 1 } : s))
    }
  }

  const sortedSuggestions = [...suggestions].sort((a, b) => b.votes - a.votes)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("home")}>
            <ChevronLeft className="h-4 w-4 mr-1" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-dorado" /> Sugerencias
            </h1>
            <p className="text-sm text-muted-foreground">Ayúdanos a mejorar ProveedorConecta</p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary/90 gap-1"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancelar" : "Nueva Sugerencia"}
        </Button>
      </div>

      {/* New suggestion form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">💡 Comparte tu idea</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Título de tu sugerencia"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Describe tu idea en detalle..."
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
                <Input
                  placeholder="Categoría (ej: Pagos, Marketplace, Integración)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <Button onClick={handleSubmitSuggestion} className="w-full bg-primary">
                  <Send className="h-4 w-4 mr-2" /> Enviar Sugerencia
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions list */}
      <div className="space-y-3">
        {sortedSuggestions.map((suggestion, i) => {
          const statusConfig = STATUS_CONFIG[suggestion.status]
          const StatusIcon = statusConfig.icon
          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Vote button */}
                    <div className="flex flex-col items-center gap-1 min-w-[50px]">
                      <Button
                        variant={votedIds.has(suggestion.id) ? "default" : "outline"}
                        size="sm"
                        className={`h-10 w-10 rounded-full p-0 ${votedIds.has(suggestion.id) ? "bg-primary" : ""}`}
                        onClick={() => handleVote(suggestion.id)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-bold">{suggestion.votes}</span>
                      <span className="text-[10px] text-muted-foreground">votos</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{suggestion.title}</h3>
                        <Badge className={`text-[10px] ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">
                          {suggestion.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {suggestion.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
