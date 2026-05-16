"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { PRODUCT_CATEGORIES } from "@/lib/validators"
import {
  FileText,
  Plus,
  ChevronLeft,
  Clock,
  DollarSign,
  Send,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Package,
  Loader2,
  MessageSquare,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface CotizacionResponse {
  id: string
  cotizacionId: string
  sellerId: string
  price: number
  description: string
  deliveryTime: string
  status: string
  createdAt: string
  seller: {
    id: string
    name: string
    avatar: string
    businessProfile?: { businessName: string } | null
  }
}

interface Cotizacion {
  id: string
  buyerId: string
  title: string
  description: string
  category: string
  status: string
  createdAt: string
  buyer: { id: string; name: string; avatar: string }
  responses: CotizacionResponse[]
}

export function CotizacionView() {
  const { navigate } = useAppStore()
  const { user, isAuthenticated } = useAuthStore()
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showResponseForm, setShowResponseForm] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
  })
  const [responseForm, setResponseForm] = useState({
    price: "",
    description: "",
    deliveryTime: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [responding, setResponding] = useState(false)
  const [viewMode, setViewMode] = useState<"buyer" | "seller">("buyer")

  const loadCotizaciones = async () => {
    try {
      const res = await fetch(`/api/cotizacion?role=${viewMode}`)
      const d = await res.json()
      if (d.success) setCotizaciones(d.data)
    } catch {
      toast.error("Error al cargar cotizaciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    setLoading(true)
    loadCotizaciones()
  }, [isAuthenticated, viewMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) {
      toast.error("Título requerido")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/cotizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.success) {
        setCotizaciones((prev) => [d.data, ...prev])
        setShowForm(false)
        setForm({ title: "", description: "", category: "" })
        toast.success("Cotización creada exitosamente")
      } else {
        toast.error(d.error)
      }
    } catch {
      toast.error("Error al crear cotización")
    } finally {
      setSubmitting(false)
    }
  }

  const handleResponse = async (cotizacionId: string) => {
    if (!responseForm.price || parseFloat(responseForm.price) <= 0) {
      toast.error("Precio requerido")
      return
    }
    setResponding(true)
    try {
      const res = await fetch(`/api/cotizacion/${cotizacionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseForm),
      })
      const d = await res.json()
      if (d.success) {
        // Update the cotizacion with the new response
        setCotizaciones((prev) =>
          prev.map((c) =>
            c.id === cotizacionId
              ? { ...c, responses: [...c.responses, d.data] }
              : c
          )
        )
        setShowResponseForm(null)
        setResponseForm({ price: "", description: "", deliveryTime: "" })
        toast.success("Respuesta enviada")
      } else {
        toast.error(d.error)
      }
    } catch {
      toast.error("Error al enviar respuesta")
    } finally {
      setResponding(false)
    }
  }

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(p)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-NI", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

  const isSeller = user?.role === "SELLER"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("home")}>
            <ChevronLeft className="h-4 w-4 mr-1" />
          </Button>
          <h1 className="text-xl font-bold font-[family-name:var(--font-poppins)]">
            Cotizaciones
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {isSeller && (
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setViewMode("buyer")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "buyer"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                Mis Solicitudes
              </button>
              <button
                onClick={() => setViewMode("seller")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "seller"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                Para Responder
              </button>
            </div>
          )}
          {!isSeller && (
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4 mr-1" /> Nueva
            </Button>
          )}
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Solicitar Cotización
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      placeholder="¿Qué necesitas?"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      placeholder="Describe en detalle lo que buscas: cantidad, calidad, especificaciones..."
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, category: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Enviar Solicitud
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : cotizaciones.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardContent className="p-8 text-center">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FileText className="h-16 w-16 mx-auto text-primary/20 mb-4" />
              </motion.div>
              <p className="font-medium text-lg">Sin cotizaciones</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                {viewMode === "seller"
                  ? "No hay solicitudes de cotización para responder aún"
                  : "Crea una solicitud para que los vendedores te envíen ofertas"}
              </p>
              {!isSeller && (
                <Button
                  className="mt-4 bg-primary hover:bg-primary/90"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Crear Cotización
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {cotizaciones.map((c, index) => {
              const isExpanded = expandedId === c.id
              const isShowingResponseForm = showResponseForm === c.id

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`transition-all ${
                      c.status === "OPEN"
                        ? "border-primary/20"
                        : "border-muted"
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* Header row */}
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : c.id)
                        }
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{c.title}</h3>
                            <Badge
                              variant={
                                c.status === "OPEN" ? "default" : "secondary"
                              }
                              className={`text-[10px] flex-shrink-0 ${
                                c.status === "OPEN" ? "bg-green-600" : ""
                              }`}
                            >
                              {c.status === "OPEN" ? "Abierta" : "Cerrada"}
                            </Badge>
                          </div>
                          {c.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {c.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {c.category && (
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                              >
                                <Package className="h-2.5 w-2.5 mr-1" />
                                {c.category}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-0.5" />
                              {formatDate(c.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {c.responses.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <MessageSquare className="h-2.5 w-2.5" />
                              {c.responses.length}
                            </Badge>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <Separator className="my-3" />

                            {/* Responses */}
                            {c.responses.length > 0 ? (
                              <div className="space-y-2 mb-3">
                                <p className="text-sm font-medium">
                                  Respuestas ({c.responses.length})
                                </p>
                                {c.responses.map((r) => (
                                  <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 rounded-lg bg-muted/50 border"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-medium">
                                            {r.seller?.businessProfile
                                              ?.businessName ||
                                              r.seller?.name}
                                          </p>
                                          <Badge
                                            variant={
                                              r.status === "ACCEPTED"
                                                ? "default"
                                                : r.status === "REJECTED"
                                                  ? "destructive"
                                                  : "secondary"
                                            }
                                            className="text-[9px]"
                                          >
                                            {r.status === "ACCEPTED"
                                              ? "Aceptada"
                                              : r.status === "REJECTED"
                                                ? "Rechazada"
                                                : "Pendiente"}
                                          </Badge>
                                        </div>
                                        {r.description && (
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {r.description}
                                          </p>
                                        )}
                                        {r.deliveryTime && (
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            <Clock className="h-3 w-3 inline mr-0.5" />
                                            Entrega: {r.deliveryTime}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-primary">
                                          {formatPrice(r.price)}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground mb-3">
                                Aún no hay respuestas
                              </p>
                            )}

                            {/* Seller response form */}
                            {isSeller &&
                              c.status === "OPEN" &&
                              viewMode === "seller" && (
                                <div className="mt-3">
                                  {isShowingResponseForm ? (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                    >
                                      <Card className="border-primary/30 bg-primary/5">
                                        <CardContent className="p-4 space-y-3">
                                          <p className="text-sm font-medium flex items-center gap-1.5">
                                            <Send className="h-4 w-4 text-primary" />
                                            Enviar Respuesta
                                          </p>
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                              <Label className="text-xs">
                                                Precio (C$) *
                                              </Label>
                                              <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input
                                                  type="number"
                                                  placeholder="0.00"
                                                  value={responseForm.price}
                                                  onChange={(e) =>
                                                    setResponseForm((f) => ({
                                                      ...f,
                                                      price: e.target.value,
                                                    }))
                                                  }
                                                  className="pl-9"
                                                />
                                              </div>
                                            </div>
                                            <div className="space-y-1.5">
                                              <Label className="text-xs">
                                                Tiempo de entrega
                                              </Label>
                                              <Input
                                                placeholder="3-5 días"
                                                value={
                                                  responseForm.deliveryTime
                                                }
                                                onChange={(e) =>
                                                  setResponseForm((f) => ({
                                                    ...f,
                                                    deliveryTime:
                                                      e.target.value,
                                                  }))
                                                }
                                              />
                                            </div>
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label className="text-xs">
                                              Descripción de la oferta
                                            </Label>
                                            <Textarea
                                              placeholder="Describe tu oferta, condiciones, disponibilidad..."
                                              rows={3}
                                              value={responseForm.description}
                                              onChange={(e) =>
                                                setResponseForm((f) => ({
                                                  ...f,
                                                  description: e.target.value,
                                                }))
                                              }
                                            />
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              className="bg-primary hover:bg-primary/90"
                                              onClick={() =>
                                                handleResponse(c.id)
                                              }
                                              disabled={responding}
                                            >
                                              {responding ? (
                                                <>
                                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                  Enviando...
                                                </>
                                              ) : (
                                                <>
                                                  <Send className="h-3 w-3 mr-1" />
                                                  Enviar Oferta
                                                </>
                                              )}
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                setShowResponseForm(null)
                                              }
                                            >
                                              Cancelar
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </motion.div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="bg-primary hover:bg-primary/90 w-full"
                                      onClick={() =>
                                        setShowResponseForm(c.id)
                                      }
                                    >
                                      <Send className="h-4 w-4 mr-1.5" />
                                      Responder Cotización
                                    </Button>
                                  )}
                                </div>
                              )}
                          </motion.div>
                        )}
                      </AnimatePresence>
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
