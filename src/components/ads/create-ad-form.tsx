"use client"

import { useState, useRef } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { authFetch } from "@/lib/client-auth"
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  X,
  Check,
  Loader2,
  Megaphone,
  Link,
  FileText,
  CreditCard,
  Eye,
  Sparkles,
  Clock,
  CalendarDays,
  Calendar,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Plan Definitions ────────────────────────────────────────────────────────

type AdPlan = "THREE_DAYS" | "WEEKLY" | "MONTHLY"

interface PlanOption {
  id: AdPlan
  label: string
  price: number
  duration: string
  icon: React.ElementType
  description: string
  badge?: string
  popular?: boolean
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    id: "THREE_DAYS",
    label: "3 Días",
    price: 250,
    duration: "3 días",
    icon: Clock,
    description: "Ideal para promociones rápidas y eventos cortos",
  },
  {
    id: "WEEKLY",
    label: "Semana",
    price: 500,
    duration: "7 días",
    icon: CalendarDays,
    description: "La mejor relación calidad-precio para vendedores activos",
    popular: true,
    badge: "POPULAR",
  },
  {
    id: "MONTHLY",
    label: "Mes",
    price: 1500,
    duration: "30 días",
    icon: Calendar,
    description: "Máxima visibilidad y presencia continua en el marketplace",
    badge: "MEJOR VALOR",
  },
]

// ─── Step Definitions ────────────────────────────────────────────────────────

const STEP_INFO = [
  { label: "Contenido", icon: FileText },
  { label: "Plan", icon: CreditCard },
  { label: "Vista Previa", icon: Eye },
]

// ─── Form Interface ──────────────────────────────────────────────────────────

interface AdFormData {
  title: string
  description: string
  imageUrl: string
  targetUrl: string
  plan: AdPlan | ""
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CreateAdForm() {
  const { navigate } = useAppStore()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [form, setForm] = useState<AdFormData>({
    title: "",
    description: "",
    imageUrl: "",
    targetUrl: "",
    plan: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const selectedPlan = PLAN_OPTIONS.find((p) => p.id === form.plan)

  const getAmount = (): number => {
    return selectedPlan?.price ?? 0
  }

  // ─── Upload Handler ────────────────────────────────────────────────────────

  const handleUpload = async (files: FileList) => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append("files", f))
    fd.append("subfolder", "ads")

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 90))
      }, 200)

      const res = await authFetch("/api/upload", { method: "POST", body: fd })
      clearInterval(progressInterval)
      setUploadProgress(100)

      const d = await res.json()
      if (d.success && d.data.length > 0) {
        setForm((f) => ({ ...f, imageUrl: d.data[0] }))
        toast.success("Imagen subida exitosamente")
        if (fileInputRef.current) fileInputRef.current.value = ""
      } else {
        toast.error(d.error || "Error al subir imagen")
      }
    } catch {
      toast.error("Error al subir imagen")
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const removeImage = () => {
    setForm((f) => ({ ...f, imageUrl: "" }))
  }

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}

    if (s === 1) {
      if (!form.title.trim()) errs.title = "El título es obligatorio"
      if (form.title.trim().length < 3)
        errs.title = "El título debe tener al menos 3 caracteres"
      if (form.description.trim().length > 0 && form.description.trim().length < 10)
        errs.description = "La descripción debe tener al menos 10 caracteres"
    } else if (s === 2) {
      if (!form.plan) errs.plan = "Selecciona un plan de publicidad"
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return

    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl,
        targetUrl: form.targetUrl.trim(),
        plan: form.plan,
        type: "PUBLISH",
        amount: getAmount(),
      }

      const res = await authFetch("/api/advertisements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const d = await res.json()
      if (d.success) {
        toast.success("¡Anuncio creado exitosamente! Será revisado y activado pronto.")
        navigate("home")
      } else {
        toast.error(d.error || "Error al crear anuncio")
      }
    } catch {
      toast.error("No se pudo crear el anuncio. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // ─── Step Progress ─────────────────────────────────────────────────────────

  const stepProgress = (step / 3) * 100

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate("home")} className="gap-1">
        <ChevronLeft className="h-4 w-4" /> Volver
      </Button>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Crear Anuncio</h1>
            <p className="text-sm text-muted-foreground">
              Promociona tus productos y llega a más compradores
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main form card */}
      <Card>
        <CardHeader>
          {/* Step progress bar */}
          <div className="mt-1">
            <Progress value={stepProgress} className="h-2" />
            <div className="flex justify-between mt-2">
              {STEP_INFO.map((info, i) => {
                const stepNum = i + 1
                const isActive = step === stepNum
                const isCompleted = step > stepNum
                const Icon = info.icon
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 text-xs cursor-pointer transition-colors ${
                      isCompleted
                        ? "text-primary"
                        : isActive
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                    }`}
                    onClick={() => {
                      if (isCompleted) setStep(stepNum)
                    }}
                  >
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        stepNum
                      )}
                    </div>
                    <span className="hidden sm:inline">{info.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {/* ─── Step 1: Content ────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="ad-title" className="text-sm font-medium">
                    Título del Anuncio *
                  </Label>
                  <Input
                    id="ad-title"
                    placeholder="Ej: ¡Gran oferta en materiales de construcción!"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className={errors.title ? "border-destructive" : ""}
                    maxLength={80}
                  />
                  <div className="flex justify-between">
                    {errors.title ? (
                      <p className="text-xs text-destructive">{errors.title}</p>
                    ) : (
                      <span />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {form.title.length}/80
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="ad-desc" className="text-sm font-medium">
                    Descripción
                  </Label>
                  <Textarea
                    id="ad-desc"
                    placeholder="Describe lo que promocionas, los beneficios y por qué los compradores deberían interesarse..."
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className={
                      errors.description ? "border-destructive" : ""
                    }
                    maxLength={500}
                  />
                  <div className="flex justify-between">
                    {errors.description ? (
                      <p className="text-xs text-destructive">
                        {errors.description}
                      </p>
                    ) : (
                      <span />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {form.description.length}/500
                    </p>
                  </div>
                </div>

                {/* Image/Video Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Imagen o Video del Anuncio
                  </Label>

                  {!form.imageUrl ? (
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        dragActive
                          ? "border-primary bg-primary/5 scale-[1.02]"
                          : "hover:border-primary/50"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        id="ad-media-upload"
                        accept="image/*,video/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) =>
                          e.target.files && handleUpload(e.target.files)
                        }
                      />
                      <label
                        htmlFor="ad-media-upload"
                        className="cursor-pointer"
                      >
                        <motion.div
                          animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
                        >
                          <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        </motion.div>
                        <p className="font-medium">
                          {dragActive
                            ? "Suelta el archivo aquí"
                            : "Arrastra una imagen o video aquí"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          o haz clic para seleccionar · Imágenes y videos
                        </p>
                      </label>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group rounded-xl overflow-hidden border"
                    >
                      {form.imageUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                        <video
                          src={form.imageUrl}
                          className="w-full h-56 object-cover"
                          controls
                          muted
                        />
                      ) : (
                        <img
                          src={form.imageUrl}
                          alt="Vista previa del anuncio"
                          className="w-full h-56 object-cover"
                        />
                      )}
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-destructive text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2">
                        <Badge
                          variant="secondary"
                          className="bg-black/60 text-white border-0 text-xs"
                        >
                          {form.imageUrl.match(/\.(mp4|webm|ogg|mov)$/i)
                            ? "Video"
                            : "Imagen"}
                        </Badge>
                      </div>
                    </motion.div>
                  )}

                  {/* Upload progress */}
                  {uploading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <p className="text-sm text-primary font-medium">
                          Subiendo archivo...
                        </p>
                      </div>
                      <Progress value={uploadProgress} className="h-1.5" />
                    </motion.div>
                  )}
                </div>

                {/* Target URL */}
                <div className="space-y-2">
                  <Label
                    htmlFor="ad-target-url"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <Link className="h-3.5 w-3.5" />
                    URL de Destino (opcional)
                  </Label>
                  <Input
                    id="ad-target-url"
                    type="url"
                    placeholder="https://ejemplo.com/mi-producto"
                    value={form.targetUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, targetUrl: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Los usuarios serán dirigidos aquí al hacer clic en tu anuncio
                  </p>
                </div>
              </motion.div>
            )}

            {/* ─── Step 2: Plan Selection ─────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="text-center mb-2">
                  <p className="text-sm text-muted-foreground">
                    Elige el plan que mejor se adapte a tus necesidades
                  </p>
                </div>

                {/* Plan cards */}
                <div className="space-y-3">
                  {PLAN_OPTIONS.map((plan, idx) => {
                    const isSelected = form.plan === plan.id
                    const Icon = plan.icon
                    const savings =
                      plan.id === "MONTHLY"
                        ? ((250 * 10 - 1500) / (250 * 10) * 100).toFixed(0)
                        : plan.id === "WEEKLY"
                          ? ((250 * 7 - 500) / (250 * 7) * 100).toFixed(0)
                          : null

                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all relative overflow-hidden ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                              : "hover:border-primary/50 hover:shadow-md"
                          }`}
                          onClick={() => {
                            setForm((f) => ({ ...f, plan: plan.id }))
                            if (errors.plan) setErrors({})
                          }}
                        >
                          {/* Popular badge */}
                          {plan.badge && (
                            <div className="absolute top-0 right-0">
                              <div
                                className={`text-[10px] font-bold px-3 py-0.5 rounded-bl-lg ${
                                  plan.popular
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-dorado text-dorado-foreground"
                                }`}
                              >
                                {plan.badge}
                              </div>
                            </div>
                          )}

                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              {/* Radio indicator */}
                              <div
                                className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/40"
                                }`}
                              >
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 500,
                                    }}
                                  >
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  </motion.div>
                                )}
                              </div>

                              {/* Plan details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon className="h-4 w-4 text-primary shrink-0" />
                                  <h3 className="font-bold text-base">
                                    {plan.label}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] shrink-0"
                                  >
                                    {plan.duration}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {plan.description}
                                </p>
                                {savings && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Ahorras {savings}% vs plan de 3 días
                                  </p>
                                )}
                              </div>

                              {/* Price */}
                              <div className="text-right shrink-0">
                                <p className="text-2xl font-bold text-primary">
                                  C${plan.price.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  por {plan.duration}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>

                {errors.plan && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-destructive text-center"
                  >
                    {errors.plan}
                  </motion.p>
                )}

                {/* Pricing summary */}
                <AnimatePresence>
                  {form.plan && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold">
                              Resumen de Pago
                            </p>
                          </div>
                          <Separator className="mb-2" />
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Plan {selectedPlan?.label}
                              </span>
                              <span className="font-medium">
                                C${selectedPlan?.price.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Duración
                              </span>
                              <span className="font-medium">
                                {selectedPlan?.duration}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Tipo
                              </span>
                              <span className="font-medium">Publicación</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-base font-bold">
                              <span>Total</span>
                              <span className="text-primary">
                                C${getAmount().toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            El cargo se deducirá de tu saldo de billetera
                            (C$
                            {user?.balance?.toLocaleString() ?? "0"})
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ─── Step 3: Preview ────────────────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="text-center mb-2">
                  <p className="text-sm text-muted-foreground">
                    Así es como los compradores verán tu anuncio
                  </p>
                </div>

                {/* Preview Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="overflow-hidden border-primary/20 shadow-lg">
                    {/* Ad image */}
                    {form.imageUrl ? (
                      <div className="relative">
                        {form.imageUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                          <video
                            src={form.imageUrl}
                            className="w-full h-48 object-cover"
                            controls
                            muted
                          />
                        ) : (
                          <img
                            src={form.imageUrl}
                            alt={form.title}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground gap-1 shadow-md">
                          <Megaphone className="h-3 w-3" />
                          Patrocinado
                        </Badge>
                        <Badge
                          variant="outline"
                          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-xs"
                        >
                          {selectedPlan?.label}
                        </Badge>
                      </div>
                    ) : (
                      <div className="relative h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <Megaphone className="h-10 w-10 text-primary/30" />
                        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground gap-1">
                          <Megaphone className="h-3 w-3" />
                          Patrocinado
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-lg leading-tight">
                        {form.title || "Título del anuncio"}
                      </h3>
                      {form.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {form.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs border-primary/30 text-primary"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {selectedPlan?.duration}
                          </Badge>
                        </div>
                        {form.targetUrl && (
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(form.targetUrl, "_blank")
                            }}
                          >
                            <Link className="h-3.5 w-3.5" />
                            Ver Más
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Summary */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-dorado" />
                      Resumen del Anuncio
                    </h4>
                    <Separator />
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Título</span>
                      <span className="font-medium truncate">
                        {form.title}
                      </span>
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">
                        {selectedPlan?.label} ({selectedPlan?.duration})
                      </span>
                      <span className="text-muted-foreground">Tipo</span>
                      <span className="font-medium">Publicación</span>
                      <span className="text-muted-foreground">Imagen</span>
                      <span className="font-medium">
                        {form.imageUrl ? "Incluida" : "Sin imagen"}
                      </span>
                      <span className="text-muted-foreground">URL destino</span>
                      <span className="font-medium truncate">
                        {form.targetUrl || "No especificada"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total a Pagar</span>
                      <span className="text-primary">
                        C${getAmount().toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Terms note */}
                <p className="text-xs text-muted-foreground text-center">
                  Al publicar, aceptas que tu anuncio será revisado antes de ser
                  activado. Los anuncios activos se muestran en el marketplace
                  de ProveedorConecta Nicaragua.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  if (validateStep(step)) setStep((s) => s + 1)
                }}
              >
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                className="bg-primary hover:bg-primary/90 min-w-[180px]"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4 mr-2" />
                    Publicar Anuncio
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
