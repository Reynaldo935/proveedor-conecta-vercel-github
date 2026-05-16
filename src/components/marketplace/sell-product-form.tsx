"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { PRODUCT_CATEGORIES } from "@/lib/validators"
import { Upload, X, ChevronLeft, ChevronRight, ImagePlus, DollarSign, Tag } from "lucide-react"

interface ProductForm {
  title: string; description: string; price: string; discountPrice: string
  discountPercent: string; category: string; tags: string; images: string[]
  videoUrl: string; quantity: string; discountStart: string; discountEnd: string
}

export function SellProductForm({ editMode = false }: { editMode?: boolean }) {
  const { navigate, editProductId } = useAppStore()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<ProductForm>({
    title: "", description: "", price: "", discountPrice: "", discountPercent: "",
    category: "", tags: "", images: [], videoUrl: "", quantity: "1", discountStart: "", discountEnd: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editMode && editProductId) {
      fetch(`/api/products/${editProductId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            const p = d.data
            setForm({
              title: p.title, description: p.description, price: String(p.price),
              discountPrice: p.discountPrice ? String(p.discountPrice) : "",
              discountPercent: p.discountPercent ? String(p.discountPercent) : "",
              category: p.category, tags: p.tags, images: p.images || [],
              videoUrl: p.videoUrl, quantity: String(p.quantity),
              discountStart: p.discountStart ? new Date(p.discountStart).toISOString().split("T")[0] : "",
              discountEnd: p.discountEnd ? new Date(p.discountEnd).toISOString().split("T")[0] : "",
            })
          }
        })
        .catch(() => toast.error("Error al cargar producto"))
    }
  }, [editMode, editProductId])

  const handleUpload = async (files: FileList) => {
    if (form.images.length + files.length > 5) { toast.error("Máximo 5 fotos"); return }
    setUploading(true)
    const fd = new FormData()
    Array.from(files).forEach(f => fd.append("files", f))
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (d.success) { setForm(f => ({ ...f, images: [...f.images, ...d.data] })); toast.success("Imágenes subidas") }
      else toast.error(d.error)
    } catch { toast.error("Error al subir") }
    finally { setUploading(false) }
  }

  const removeImage = (idx: number) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}
    if (s === 1) {
      if (form.images.length === 0) errs.images = "Sube al menos 1 foto"
    } else if (s === 2) {
      if (!form.title.trim()) errs.title = "Título requerido"
      if (!form.price || parseFloat(form.price) <= 0) errs.price = "Precio debe ser mayor a 0"
      if (!form.category) errs.category = "Categoría requerida"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validateStep(2)) return
    setLoading(true)
    try {
      const url = editMode ? `/api/products/${editProductId}` : "/api/products"
      const method = editMode ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const d = await res.json()
      if (d.success) { toast.success(editMode ? "Producto actualizado" : "Producto publicado"); navigate("my-products") }
      else toast.error(d.error)
    } catch { toast.error("Error al guardar") }
    finally { setLoading(false) }
  }

  const stepProgress = (step / 3) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("home")}><ChevronLeft className="h-4 w-4 mr-1" /> Volver</Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-poppins)]">{editMode ? "Editar Producto" : "Vender Producto"}</CardTitle>
          <Progress value={stepProgress} className="mt-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span className={step >= 1 ? "text-primary font-semibold" : ""}>1. Fotos</span>
            <span className={step >= 2 ? "text-primary font-semibold" : ""}>2. Detalles</span>
            <span className={step >= 3 ? "text-primary font-semibold" : ""}>3. Descuento</span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: Photos */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <input type="file" id="photo-upload" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Arrastra fotos aquí o haz clic para subir</p>
                  <p className="text-sm text-muted-foreground mt-1">Máximo 5 fotos · JPG, PNG</p>
                </label>
              </div>
              {uploading && <p className="text-center text-sm text-primary">Subiendo...</p>}
              {errors.images && <p className="text-xs text-destructive">{errors.images}</p>}
              {form.images.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt="" className="w-full h-20 object-cover rounded-lg" />
                      <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <Label>Video (URL opcional)</Label>
                <Input type="url" placeholder="https://youtube.com/..." value={form.videoUrl} onChange={(e) => setForm(f => ({ ...f, videoUrl: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input placeholder="Ej: Cemento Portland 50kg" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio (C$) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="0.00" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} className="pl-9" />
                  </div>
                  {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea placeholder="Describe tu producto..." rows={4} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad disponible</Label>
                  <Input type="number" value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Etiquetas</Label>
                  <Input placeholder="construccion, cemento" value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Discount */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-5 w-5 text-dorado" />
                <p className="text-sm text-muted-foreground">Opcional: Aplica un descuento a tu producto</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio con descuento (C$)</Label>
                  <Input type="number" placeholder="0.00" value={form.discountPrice} onChange={(e) => {
                    const dp = e.target.value
                    const pct = dp && form.price ? String(Math.round((1 - parseFloat(dp) / parseFloat(form.price)) * 100)) : ""
                    setForm(f => ({ ...f, discountPrice: dp, discountPercent: pct }))
                  }} />
                </div>
                <div className="space-y-2">
                  <Label>Descuento (%)</Label>
                  <Input type="number" placeholder="0" value={form.discountPercent} onChange={(e) => {
                    const pct = e.target.value
                    const dp = pct && form.price ? String(parseFloat(form.price) * (1 - parseFloat(pct) / 100)) : ""
                    setForm(f => ({ ...f, discountPercent: pct, discountPrice: dp }))
                  }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inicio del descuento</Label>
                  <Input type="date" value={form.discountStart} onChange={(e) => setForm(f => ({ ...f, discountStart: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Fin del descuento</Label>
                  <Input type="date" value={form.discountEnd} onChange={(e) => setForm(f => ({ ...f, discountEnd: e.target.value }))} />
                </div>
              </div>
              {form.discountPrice && form.price && (
                <Card className="bg-dorado/10 border-dorado/30">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Vista previa del descuento:</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-volcan">C${parseFloat(form.discountPrice).toFixed(2)}</span>
                      <span className="line-through text-muted-foreground">C${parseFloat(form.price).toFixed(2)}</span>
                      <Badge className="bg-volcan text-volcan-foreground">-{form.discountPercent}%</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Anterior</Button>
            ) : <div />}
            {step < 3 ? (
              <Button className="bg-primary" onClick={() => { if (validateStep(step)) setStep(s => s + 1) }}>Siguiente <ChevronRight className="h-4 w-4 ml-1" /></Button>
            ) : (
              <Button className="bg-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Publicando..." : editMode ? "Actualizar Producto" : "Publicar Producto"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
