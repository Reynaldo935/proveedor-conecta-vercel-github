"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useAuthStore } from "@/store/auth-store"
import { authFetch } from "@/lib/client-auth"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Users,
  Package,
  Coffee,
  CalendarDays,
} from "lucide-react"

interface CalendarEventData {
  id: string
  title: string
  description: string
  eventType: "meeting" | "delivery" | "restock" | "other"
  eventDate: string
  duration: number
  notes: string
  createdAt: string
}

interface AppointmentData {
  id: string
  title: string
  description: string
  eventDate: string
  duration: number
  status: string
  notes: string
  buyer: { id: string; name: string; avatar: string }
  seller: { id: string; name: string; avatar: string }
  isAppointment: boolean
}

type EventItem = CalendarEventData | AppointmentData

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof CalendarIcon }> = {
  meeting: { label: "Reunión", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: Users },
  delivery: { label: "Entrega", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", icon: Package },
  restock: { label: "Reabastecimiento", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30", icon: Coffee },
  other: { label: "Otro", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30", icon: CalendarDays },
}

const DAYS_OF_WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function isAppointment(item: EventItem): item is AppointmentData {
  return "isAppointment" in item && item.isAppointment === true
}

export function CalendarView() {
  const { user, isAuthenticated } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEventData[]>([])
  const [appointments, setAppointments] = useState<AppointmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    eventType: "meeting" as const,
    eventDate: "",
    duration: 60,
    notes: "",
  })
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchCalendarData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`
      const res = await authFetch(`/api/calendar?month=${monthStr}`)
      const result = await res.json()
      if (result.success) {
        setEvents(result.data.events || [])
        setAppointments(result.data.appointments || [])
      }
    } catch {
      toast.error("Error al cargar calendario")
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, year, month])

  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  // Calendar grid computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = (firstDay.getDay() + 6) % 7 // Monday = 0
    const daysInMonth = lastDay.getDate()
    const prevMonthLast = new Date(year, month, 0).getDate()

    const days: { date: Date; isCurrentMonth: boolean }[] = []

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLast - i),
        isCurrentMonth: false,
      })
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    // Next month padding
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }, [year, month])

  // Get events for a specific date
  const getEventsForDate = useCallback(
    (date: Date) => {
      const dateStr = date.toISOString().split("T")[0]
      const allItems: EventItem[] = [
        ...events.filter((e) => e.eventDate.startsWith(dateStr)),
        ...appointments.filter((a) => a.eventDate.startsWith(dateStr)),
      ]
      return allItems
    },
    [events, appointments]
  )

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.eventDate) {
      toast.error("Título y fecha son requeridos")
      return
    }
    setCreating(true)
    try {
      const res = await authFetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      })
      const result = await res.json()
      if (result.success) {
        toast.success("Evento creado exitosamente")
        setCreateDialogOpen(false)
        setNewEvent({
          title: "",
          description: "",
          eventType: "meeting",
          eventDate: "",
          duration: 60,
          notes: "",
        })
        fetchCalendarData()
      } else {
        toast.error(result.error || "Error al crear evento")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    setDeleting(eventId)
    try {
      const res = await authFetch(`/api/calendar?id=${eventId}`, {
        method: "DELETE",
      })
      const result = await res.json()
      if (result.success) {
        toast.success("Evento eliminado")
        fetchCalendarData()
      } else {
        toast.error(result.error || "Error al eliminar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setDeleting(null)
    }
  }

  const today = new Date()
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay) : []

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-semibold">Inicia sesión para ver tu calendario</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
          >
            <CalendarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1A5276" }}>
              Calendario y Agenda
            </h1>
            <p className="text-sm text-muted-foreground">
              Organiza tus reuniones, entregas y reabastecimiento
            </p>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="font-semibold"
              style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Evento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Título</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Ej: Reunión con proveedor"
                  style={{ backgroundColor: "#fff !important", color: "#000 !important" }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tipo de evento</label>
                <Select
                  value={newEvent.eventType}
                  onValueChange={(v) =>
                    setNewEvent({ ...newEvent, eventType: v as typeof newEvent.eventType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">🤝 Reunión</SelectItem>
                    <SelectItem value="delivery">📦 Entrega</SelectItem>
                    <SelectItem value="restock">🔄 Reabastecimiento</SelectItem>
                    <SelectItem value="other">📌 Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Fecha</label>
                  <Input
                    type="date"
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    style={{ backgroundColor: "#fff !important", color: "#000 !important" }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Duración (min)</label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={newEvent.duration}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, duration: parseInt(e.target.value) || 60 })
                    }
                    style={{ backgroundColor: "#fff !important", color: "#000 !important" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Descripción</label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Detalles del evento..."
                  rows={2}
                  style={{ backgroundColor: "#fff !important", color: "#000 !important" }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Notas</label>
                <Textarea
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                  style={{ backgroundColor: "#fff !important", color: "#000 !important" }}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleCreateEvent}
                disabled={creating || !newEvent.title.trim() || !newEvent.eventDate}
                style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
              >
                {creating ? "Creando..." : "Crear Evento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-lg font-semibold">
                  {MONTHS[month]} {year}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-md" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {/* Day headers */}
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}

                  {/* Calendar cells */}
                  {calendarDays.map((dayInfo, i) => {
                    const dayEvents = getEventsForDate(dayInfo.date)
                    const isSelected =
                      selectedDay &&
                      dayInfo.date.getDate() === selectedDay.getDate() &&
                      dayInfo.date.getMonth() === selectedDay.getMonth() &&
                      dayInfo.date.getFullYear() === selectedDay.getFullYear()

                    return (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedDay(dayInfo.date)}
                        className={`relative min-h-[60px] sm:min-h-[70px] p-1 rounded-lg border text-left transition-colors ${
                          !dayInfo.isCurrentMonth
                            ? "opacity-40 border-transparent"
                            : isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                        } ${isToday(dayInfo.date) && dayInfo.isCurrentMonth ? "ring-2 ring-primary ring-offset-1" : ""}`}
                      >
                        <span
                          className={`text-xs font-medium ${
                            isToday(dayInfo.date) && dayInfo.isCurrentMonth
                              ? "text-primary font-bold"
                              : ""
                          }`}
                        >
                          {dayInfo.date.getDate()}
                        </span>
                        {/* Event dots */}
                        {dayEvents.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {dayEvents.slice(0, 3).map((evt, ei) => {
                              const type = isAppointment(evt) ? "meeting" : evt.eventType
                              const config = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.other
                              return (
                                <span
                                  key={ei}
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    type === "meeting"
                                      ? "bg-blue-500"
                                      : type === "delivery"
                                      ? "bg-green-500"
                                      : type === "restock"
                                      ? "bg-orange-500"
                                      : "bg-gray-400"
                                  }`}
                                />
                              )
                            })}
                            {dayEvents.length > 3 && (
                              <span className="text-[8px] text-muted-foreground">
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t flex-wrap">
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        key === "meeting"
                          ? "bg-blue-500"
                          : key === "delivery"
                          ? "bg-green-500"
                          : key === "restock"
                          ? "bg-orange-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <span className="text-muted-foreground">{config.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Selected Day Events Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: "#1A5276" }} />
                {selectedDay
                  ? selectedDay.toLocaleDateString("es-NI", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  : "Selecciona un día"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDay ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Haz clic en un día del calendario para ver sus eventos
                  </p>
                </div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Sin eventos para este día
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setNewEvent({
                        ...newEvent,
                        eventDate: selectedDay.toISOString().split("T")[0],
                      })
                      setCreateDialogOpen(true)
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Agregar evento
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {selectedDayEvents.map((evt, i) => {
                      const isAppt = isAppointment(evt)
                      const type = isAppt ? "meeting" : evt.eventType
                      const config = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.other
                      const Icon = config.icon

                      return (
                        <motion.div
                          key={evt.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`p-3 rounded-lg ${config.bgColor}`}
                        >
                          <div className="flex items-start gap-2">
                            <Icon className={`h-4 w-4 ${config.color} shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{evt.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(evt.eventDate).toLocaleTimeString("es-NI", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                · {evt.duration} min
                              </p>
                              {evt.description && (
                                <p className="text-xs mt-1 text-muted-foreground line-clamp-2">
                                  {evt.description}
                                </p>
                              )}
                              {isAppt && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    {evt.status}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            {!isAppt && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500"
                                disabled={deleting === evt.id}
                                onClick={() => handleDeleteEvent(evt.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
