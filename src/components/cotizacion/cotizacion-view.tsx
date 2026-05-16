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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { PRODUCT_CATEGORIES } from "@/lib/validators"
import { FileText, Plus, ChevronLeft, Clock, DollarSign } from "lucide-react"

export function CotizacionView() {
  const { navigate } = useAppStore()
  const { user, isAuthenticated } = useAuthStore()
  const [cotizaciones, setCotizaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", category: "" })

  useEffect(() => {
    if (!isAuthenticated) return
    fetch("/api/cotizacion").then(r => r.json()).then(d => { if (d.success) setCotizaciones(d.data) }).catch(() => {})
    .finally(() => setLoading(false))
  }, [isAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) { toast.error("Título requerido"); return }
    const res = await fetch("/api/cotizacion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.success) { setCotizaciones(prev => [d.data, ...prev]); setShowForm(false); setForm({ title: "", description: "", category: "" }); toast.success("Cotización creada") }
    else toast.error(d.error)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("home")}><ChevronLeft className="h-4 w-4 mr-1" /></Button>
          <h1 className="text-xl font-bold font-[family-name:var(--font-poppins)]">Cotizaciones</h1>
        </div>
        <Button className="bg-primary" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Solicitar Cotización</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Título *</Label><Input placeholder="¿Qué necesitas?" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descripción</Label><Textarea placeholder="Describe en detalle lo que buscas..." rows={4} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Categoría</Label><Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="flex gap-2"><Button type="submit" className="bg-primary">Enviar Solicitud</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? <p>Cargando...</p> : cotizaciones.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p>Sin cotizaciones</p><p className="text-sm text-muted-foreground">Crea una solicitud para que los vendedores te envíen ofertas</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {cotizaciones.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{c.title}</h3>
                    {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                    {c.category && <Badge variant="secondary" className="mt-2">{c.category}</Badge>}
                  </div>
                  <Badge variant={c.status === "OPEN" ? "default" : "secondary"} className={c.status === "OPEN" ? "bg-green-600" : ""}>{c.status === "OPEN" ? "Abierta" : "Cerrada"}</Badge>
                </div>
                {c.responses?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">{c.responses.length} respuesta(s)</p>
                    {c.responses.map((r: any) => (
                      <div key={r.id} className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                        <div><p className="text-sm">{r.seller?.businessProfile?.businessName || r.seller?.name}</p><p className="text-xs text-muted-foreground">{r.description}</p></div>
                        <div className="text-right"><p className="font-bold text-primary">C${r.price}</p><p className="text-xs text-muted-foreground"><Clock className="h-3 w-3 inline" /> {r.deliveryTime}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
