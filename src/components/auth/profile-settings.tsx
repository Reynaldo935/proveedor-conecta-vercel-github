"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { PRODUCT_CATEGORIES, NICARAGUA_DEPARTMENTS, PAYMENT_METHODS } from "@/lib/validators"
import { ChevronLeft, Camera, Store } from "lucide-react"

export function ProfileSettings() {
  const { navigate } = useAppStore()
  const { user, setUser } = useAuthStore()
  const [form, setForm] = useState({ name: "", phone: "", address: "", bio: "", avatar: "" })
  const [businessForm, setBusinessForm] = useState({
    businessName: "", description: "", category: "", address: "",
    phone: "", hours: "", paymentMethods: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", phone: user.phone || "", address: user.address || "", bio: user.bio || "", avatar: user.avatar || "" })
      if (user.businessProfile) {
        const bp = user.businessProfile
        setBusinessForm({
          businessName: bp.businessName || "", description: bp.description || "",
          category: bp.category || "", address: bp.address || "", phone: bp.phone || "",
          hours: bp.hours || "", paymentMethods: bp.paymentMethods ? JSON.parse(bp.paymentMethods) : [],
        })
      }
    }
  }, [user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setUploading(true)
    const fd = new FormData()
    fd.append("files", e.target.files[0])
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (d.success) {
        setForm(f => ({ ...f, avatar: d.data[0] }))
        await fetch("/api/auth/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar: d.data[0] }) })
        toast.success("Foto actualizada")
      }
    } catch { toast.error("Error al subir") }
    finally { setUploading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/auth/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const d = await res.json()
      if (d.success) { setUser(d.data); toast.success("Perfil actualizado") }
      else toast.error(d.error)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  const handleBusinessSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${user?.id}/business`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(businessForm) })
      const d = await res.json()
      if (d.success) toast.success("Perfil de negocio actualizado")
      else toast.error(d.error)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  const togglePayment = (id: string) => {
    setBusinessForm(f => ({
      ...f,
      paymentMethods: f.paymentMethods.includes(id) ? f.paymentMethods.filter(p => p !== id) : [...f.paymentMethods, id],
    }))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("home")}><ChevronLeft className="h-4 w-4 mr-1" /> Volver</Button>
      <h1 className="text-xl font-bold font-[family-name:var(--font-poppins)]">Mi Perfil</h1>

      {/* Avatar */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={form.avatar || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer">
              <Camera className="h-3 w-3" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <h2 className="font-semibold text-lg">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="mt-1">{user?.role === "SELLER" ? "🏪 Vendedor" : "🛒 Comprador"}</Badge>
            {user?.emailVerified && <Badge className="ml-1 bg-green-600">✓ Verificado</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Información Personal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="8XXX-XXXX" /></div>
          <div className="space-y-2"><Label>Dirección</Label><Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Managua, Nicaragua" /></div>
          <div className="space-y-2"><Label>Biografía</Label><Textarea value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} /></div>
          <Button className="bg-primary" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar Cambios"}</Button>
        </CardContent>
      </Card>

      {/* Business Profile */}
      {user?.role === "SELLER" && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Store className="h-5 w-5" /> Perfil de Negocio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Nombre del negocio</Label><Input value={businessForm.businessName} onChange={(e) => setBusinessForm(f => ({ ...f, businessName: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Descripción</Label><Textarea value={businessForm.description} onChange={(e) => setBusinessForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Categoría</Label><Input value={businessForm.category} onChange={(e) => setBusinessForm(f => ({ ...f, category: e.target.value }))} placeholder="Construcción" /></div>
              <div className="space-y-2"><Label>Teléfono del negocio</Label><Input value={businessForm.phone} onChange={(e) => setBusinessForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Dirección del negocio</Label><Input value={businessForm.address} onChange={(e) => setBusinessForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Horarios</Label><Input value={businessForm.hours} onChange={(e) => setBusinessForm(f => ({ ...f, hours: e.target.value }))} placeholder="Lun-Vie 8am-5pm" /></div>
            <div className="space-y-2">
              <Label>Métodos de pago aceptados</Label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map(m => (
                  <Badge key={m.id} variant={businessForm.paymentMethods.includes(m.id) ? "default" : "outline"} className={`cursor-pointer ${businessForm.paymentMethods.includes(m.id) ? "bg-primary" : ""}`} onClick={() => togglePayment(m.id)}>
                    {m.icon} {m.name}
                  </Badge>
                ))}
              </div>
            </div>
            <Button className="bg-primary" onClick={handleBusinessSave} disabled={saving}>{saving ? "Guardando..." : "Guardar Negocio"}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
