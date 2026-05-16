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
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { PAYMENT_METHODS } from "@/lib/validators"
import { ChevronLeft, Camera, Store, User, Loader2, Save, CheckCircle2, Upload } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState<"personal" | "business" | null>(null)

  // Load profile from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()
        if (data.success && data.data) {
          const u = data.data
          setUser(data.data)
          setForm({
            name: u.name || "",
            phone: u.phone || "",
            address: u.address || "",
            bio: u.bio || "",
            avatar: u.avatar || "",
          })
          if (u.businessProfile) {
            const bp = u.businessProfile
            setBusinessForm({
              businessName: bp.businessName || "",
              description: bp.description || "",
              category: bp.category || "",
              address: bp.address || "",
              phone: bp.phone || "",
              hours: bp.hours || "",
              paymentMethods: bp.paymentMethods ? JSON.parse(bp.paymentMethods) : [],
            })
          }
        }
      } catch {
        toast.error("Error al cargar perfil")
      } finally {
        setLoadingProfile(false)
      }
    }
    loadProfile()
  }, [setUser])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setUploading(true)
    const fd = new FormData()
    fd.append("files", e.target.files[0])
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (d.success) {
        const newAvatar = d.data[0]
        setForm(f => ({ ...f, avatar: newAvatar }))
        // Save avatar to profile immediately
        const updateRes = await fetch("/api/auth/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: newAvatar }),
        })
        const updateData = await updateRes.json()
        if (updateData.success) setUser(updateData.data)
        toast.success("Foto de perfil actualizada")
      }
    } catch {
      toast.error("Error al subir imagen")
    } finally {
      setUploading(false)
    }
  }

  const handleAvatarSimulate = () => {
    // Simulate avatar upload for demo
    const avatars = [
      "/uploads/products/cement.jpg",
      "/uploads/products/corn.jpg",
      "/uploads/products/laptop.jpg",
    ]
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)]
    setUploading(true)
    setTimeout(async () => {
      setForm(f => ({ ...f, avatar: randomAvatar }))
      try {
        const res = await fetch("/api/auth/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: randomAvatar }),
        })
        const d = await res.json()
        if (d.success) setUser(d.data)
      } catch {
        // Ignore
      }
      setUploading(false)
      toast.success("Foto actualizada (simulación)")
    }, 800)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.success) {
        setUser(d.data)
        setSavedSuccess("personal")
        toast.success("Perfil actualizado")
        setTimeout(() => setSavedSuccess(null), 3000)
      } else {
        toast.error(d.error || "Error al actualizar")
      }
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleBusinessSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${user.id}/business`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessForm),
      })
      const d = await res.json()
      if (d.success) {
        // Refresh user data to get updated business profile
        const meRes = await fetch("/api/auth/me")
        const meData = await meRes.json()
        if (meData.success) setUser(meData.data)
        setSavedSuccess("business")
        toast.success("Perfil de negocio actualizado")
        setTimeout(() => setSavedSuccess(null), 3000)
      } else {
        toast.error(d.error || "Error al actualizar negocio")
      }
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const togglePayment = (id: string) => {
    setBusinessForm(f => ({
      ...f,
      paymentMethods: f.paymentMethods.includes(id) ? f.paymentMethods.filter(p => p !== id) : [...f.paymentMethods, id],
    }))
  }

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)

  if (loadingProfile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Button variant="ghost" onClick={() => navigate("home")} className="mb-2">
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">Mi Perfil</h1>
      </motion.div>

      {/* Avatar Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-[#1A5276] to-[#3498DB]" />
          <CardContent className="p-6 -mt-10">
            <div className="flex items-end gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  <AvatarImage src={form.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
              <div className="flex-1 pb-1">
                <h2 className="font-semibold text-lg">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {user?.role === "SELLER" ? "🏪 Vendedor" : "🛒 Comprador"}
                  </Badge>
                  {user?.emailVerified && (
                    <Badge className="bg-green-600 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verificado
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleAvatarSimulate} disabled={uploading}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Simular foto
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs: Personal & Business */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Tabs defaultValue="personal">
          <TabsList className="w-full">
            <TabsTrigger value="personal" className="flex-1">
              <User className="h-4 w-4 mr-2" /> Personal
            </TabsTrigger>
            {user?.role === "SELLER" && (
              <TabsTrigger value="business" className="flex-1">
                <Store className="h-4 w-4 mr-2" /> Negocio
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="personal" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="p-name">Nombre</Label>
                  <Input id="p-name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="p-phone">Teléfono</Label>
                    <Input id="p-phone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="8XXX-XXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-address">Dirección</Label>
                    <Input id="p-address" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Managua, Nicaragua" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-bio">Biografía</Label>
                  <Textarea id="p-bio" value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Cuéntanos sobre ti..." />
                </div>

                <AnimatePresence>
                  {savedSuccess === "personal" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Cambios guardados exitosamente
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Guardar Cambios</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {user?.role === "SELLER" && (
            <TabsContent value="business" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" /> Perfil de Negocio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="b-name">Nombre del negocio</Label>
                    <Input id="b-name" value={businessForm.businessName} onChange={(e) => setBusinessForm(f => ({ ...f, businessName: e.target.value }))} placeholder="Mi Negocio S.A." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-desc">Descripción</Label>
                    <Textarea id="b-desc" value={businessForm.description} onChange={(e) => setBusinessForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe tu negocio..." />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="b-cat">Categoría</Label>
                      <Input id="b-cat" value={businessForm.category} onChange={(e) => setBusinessForm(f => ({ ...f, category: e.target.value }))} placeholder="Construcción" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-phone">Teléfono del negocio</Label>
                      <Input id="b-phone" value={businessForm.phone} onChange={(e) => setBusinessForm(f => ({ ...f, phone: e.target.value }))} placeholder="8XXX-XXXX" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-addr">Dirección del negocio</Label>
                    <Input id="b-addr" value={businessForm.address} onChange={(e) => setBusinessForm(f => ({ ...f, address: e.target.value }))} placeholder="Managua, Nicaragua" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-hours">Horarios</Label>
                    <Input id="b-hours" value={businessForm.hours} onChange={(e) => setBusinessForm(f => ({ ...f, hours: e.target.value }))} placeholder="Lun-Vie 8am-5pm" />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Métodos de pago aceptados</Label>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_METHODS.map(m => (
                        <Badge
                          key={m.id}
                          variant={businessForm.paymentMethods.includes(m.id) ? "default" : "outline"}
                          className={`cursor-pointer transition-all hover:scale-105 ${
                            businessForm.paymentMethods.includes(m.id) ? "bg-primary text-primary-foreground" : ""
                          }`}
                          onClick={() => togglePayment(m.id)}
                        >
                          {m.icon} {m.name}
                          {businessForm.paymentMethods.includes(m.id) && <CheckCircle2 className="h-3 w-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {savedSuccess === "business" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Negocio guardado exitosamente
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    className="bg-gradient-to-r from-[#F4D03F] to-[#E6B422] hover:from-[#C49000] hover:to-[#F4D03F] text-white"
                    onClick={handleBusinessSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Guardar Negocio</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  )
}
