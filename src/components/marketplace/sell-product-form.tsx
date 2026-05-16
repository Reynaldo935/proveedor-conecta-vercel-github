"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { PRODUCT_CATEGORIES } from "@/lib/validators"
import {
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  DollarSign,
  Tag,
  Camera,
  Check,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ProductForm {
  title: string
  description: string
  price: string
  discountPrice: string
  discountPercent: string
  category: string
  tags: string
  images: string[]
  videoUrl: string
  quantity: string
  discountStart: string
  discountEnd: string
}

const STEP_INFO = [
  { label: "Fotos", icon: Camera },
  { label: "Detalles", icon: Tag },
  { label: "Descuento", icon: DollarSign },
]

export function SellProductForm({ editMode = false }: { editMode?: boolean }) {
  const { navigate, editProductId } = useAppStore()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [form, setForm] = useState<ProductForm>({
    title: "",
    description: "",
    price: "",
    discountPrice: "",
    discountPercent: "",
    category: "",
    tags: "",
    images: [],
    videoUrl: "",
    quantity: "1",
    discountStart: "",
    discountEnd: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editMode && editProductId) {
      fetch(`/api/products/${editProductId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            const p = d.data
            setForm({
              title: p.title,
              description: p.description,
              price: String(p.price),
              discountPrice: p.discountPrice ? String(p.discountPrice) : "",
              discountPercent: p.discountPercent
                ? String(p.discountPercent)
                : "",
              category: p.category,
              tags: p.tags,
              images: p.images || [],
              videoUrl: p.videoUrl,
              quantity: String(p.quantity),
              discountStart: p.discountStart
                ? new Date(p.discountStart).toISOString().split("T")[0]
                : "",
              discountEnd: p.discountEnd
                ? new Date(p.discountEnd).toISOString().split("T")[0]
                : "",
            })
          }
        })
        .catch(() => toast.error("Error al cargar producto"))
    }
  }, [editMode, editProductId])

  const handleUpload = async (files: FileList) => {
    if (form.images.length + files.length > 5) {
      toast.error("Máximo 5 fotos")
      return
    }
    setUploading(true)
    setUploadProgress(0)
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append("files", f))
    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 90))
      }, 200)

      const res = await fetch("/api/upload", { method: "POST", body: fd })
      clearInterval(progressInterval)
      setUploadProgress(100)

      const d = await res.json()
      if (d.success) {
        setForm((f) => ({ ...f, images: [...f.images, ...d.data] }))
        toast.success("Imágenes subidas")
      } else toast.error(d.error)
    } catch {
      toast.error("Error al subir")
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const removeImage = (idx: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))

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

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}
    if (s === 1) {
      if (form.images.length === 0) errs.images = "Sube al menos 1 foto"
    } else if (s === 2) {
      if (!form.title.trim()) errs.title = "Título requerido"
      if (!form.price || parseFloat(form.price) <= 0)
        errs.price = "Precio debe ser mayor a 0"
      if (!form.category) errs.category = "Categoría requerida"
      if (form.description.trim().length < 10)
        errs.description = "Descripción debe tener al menos 10 caracteres"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validateStep(2)) return
    setLoading(true)
    try {
      const url = editMode
        ? `/api/products/${editProductId}`
        : "/api/products"
      const method = editMode ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.success) {
        toast.success(editMode ? "Producto actualizado" : "Producto publicado")
        navigate("my-products")
      } else toast.error(d.error)
    } catch {
      toast.error("Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  const stepProgress = (step / 3) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("home")}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-poppins)]">
            {editMode ? "Editar Producto" : "Vender Producto"}
          </CardTitle>

          {/* Step progress */}
          <div className="mt-3">
            <Progress value={stepProgress} className="h-2" />
            <div className="flex justify-between mt-2">
              {STEP_INFO.map((info, i) => {
                const stepNum = i + 1
                const isActive = step === stepNum
                const isCompleted = step > stepNum
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
            {/* Step 1: Photos */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Drop zone */}
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
                    id="photo-upload"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleUpload(e.target.files)}
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <motion.div
                      animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
                    >
                      <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    </motion.div>
                    <p className="font-medium">
                      {dragActive
                        ? "Suelta las fotos aquí"
                        : "Arrastra fotos aquí o haz clic para subir"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Máximo 5 fotos · JPG, PNG
                    </p>
                  </label>
                </div>

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
                        Subiendo imágenes...
                      </p>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5" />
                  </motion.div>
                )}

                {errors.images && (
                  <p className="text-xs text-destructive">{errors.images}</p>
                )}

                {/* Image previews */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    <AnimatePresence>
                      {form.images.map((img, i) => (
                        <motion.div
                          key={img + i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative group"
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                          {i === 0 && (
                            <Badge className="absolute bottom-1 left-1 text-[8px] px-1 py-0 bg-primary">
                              Portada
                            </Badge>
                          )}
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Video (URL opcional)</Label>
                  <Input
                    type="url"
                    placeholder="https://youtube.com/..."
                    value={form.videoUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, videoUrl: e.target.value }))
                    }
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Ej: Cemento Portland 50kg"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Precio (C$) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, price: e.target.value }))
                        }
                        className={`pl-9 ${errors.price ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-xs text-destructive">{errors.price}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría *</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, category: v }))
                      }
                    >
                      <SelectTrigger
                        className={errors.category ? "border-destructive" : ""}
                      >
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-xs text-destructive">
                        {errors.category}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    placeholder="Describe tu producto en detalle..."
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className={errors.description ? "border-destructive" : ""}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad disponible</Label>
                    <Input
                      type="number"
                      value={form.quantity}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, quantity: e.target.value }))
                      }
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Etiquetas</Label>
                    <Input
                      placeholder="construccion, cemento"
                      value={form.tags}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, tags: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Discount */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-5 w-5 text-dorado" />
                  <p className="text-sm text-muted-foreground">
                    Opcional: Aplica un descuento a tu producto
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Precio con descuento (C$)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={form.discountPrice}
                      onChange={(e) => {
                        const dp = e.target.value
                        const pct =
                          dp && form.price
                            ? String(
                                Math.round(
                                  (1 - parseFloat(dp) / parseFloat(form.price)) *
                                    100
                                )
                              )
                            : ""
                        setForm((f) => ({
                          ...f,
                          discountPrice: dp,
                          discountPercent: pct,
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descuento (%)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.discountPercent}
                      onChange={(e) => {
                        const pct = e.target.value
                        const dp =
                          pct && form.price
                            ? String(
                                parseFloat(form.price) *
                                  (1 - parseFloat(pct) / 100)
                              )
                            : ""
                        setForm((f) => ({
                          ...f,
                          discountPercent: pct,
                          discountPrice: dp,
                        }))
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Inicio del descuento</Label>
                    <Input
                      type="date"
                      value={form.discountStart}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          discountStart: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fin del descuento</Label>
                    <Input
                      type="date"
                      value={form.discountEnd}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          discountEnd: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Discount preview */}
                <AnimatePresence>
                  {form.discountPrice && form.price && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card className="bg-dorado/10 border-dorado/30">
                        <CardContent className="p-4">
                          <p className="text-sm font-medium">
                            Vista previa del descuento:
                          </p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-volcan">
                              C${parseFloat(form.discountPrice).toFixed(2)}
                            </span>
                            <span className="line-through text-muted-foreground">
                              C${parseFloat(form.price).toFixed(2)}
                            </span>
                            <Badge className="bg-volcan text-volcan-foreground">
                              -{form.discountPercent}%
                            </Badge>
                          </div>
                          {form.discountStart && form.discountEnd && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Válido del{" "}
                              {new Date(form.discountStart).toLocaleDateString(
                                "es-NI"
                              )}{" "}
                              al{" "}
                              {new Date(form.discountEnd).toLocaleDateString(
                                "es-NI"
                              )}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                Siguiente{" "}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                className="bg-primary hover:bg-primary/90 min-w-[160px]"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editMode ? "Actualizando..." : "Publicando..."}
                  </>
                ) : editMode ? (
                  "Actualizar Producto"
                ) : (
                  "Publicar Producto"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
