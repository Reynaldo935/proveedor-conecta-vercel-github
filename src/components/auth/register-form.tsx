"use client"

import { useState } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Mail, Lock, User, Eye, EyeOff, Phone, MapPin, Store, ShoppingBag } from "lucide-react"
import { validateEmail } from "@/lib/validators"

export function RegisterForm() {
  const { navigate } = useAppStore()
  const { setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    role: "BUYER" as "BUYER" | "SELLER",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "Nombre es requerido"
    const emailCheck = validateEmail(form.email)
    if (!emailCheck.valid) errs.email = emailCheck.message
    if (form.password.length < 6) errs.password = "Mínimo 6 caracteres"
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Las contraseñas no coinciden"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.data)
        toast.success("¡Cuenta creada exitosamente! Revisa tu correo para verificar tu cuenta.")
        navigate("home")
      } else {
        toast.error(data.error || "Error al registrarse")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    const googleEmail = prompt("Ingresa tu correo de Google (simulación OAuth):")
    if (!googleEmail) return

    setLoading(true)
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail,
          name: googleEmail.split("@")[0],
          googleId: "google_" + Date.now(),
          avatar: "",
          role: form.role,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.data)
        toast.success("¡Registro con Google exitoso! Correo verificado automáticamente.")
        navigate("home")
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">PC</span>
          </div>
          <CardTitle className="text-2xl font-[family-name:var(--font-poppins)]">
            Crear Cuenta
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Únete a ProveedorConecta Nicaragua
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Register */}
          <Button variant="outline" className="w-full h-12 text-base" onClick={handleGoogleRegister} disabled={loading}>
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Registrarse con Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><Separator /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">o</span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Tipo de cuenta</Label>
              <RadioGroup value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v as "BUYER" | "SELLER" }))} className="grid grid-cols-2 gap-3">
                <div>
                  <RadioGroupItem value="BUYER" id="buyer" className="peer sr-only" />
                  <Label htmlFor="buyer" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <ShoppingBag className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">Comprador</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="SELLER" id="seller" className="peer sr-only" />
                  <Label htmlFor="seller" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Store className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">Vendedor</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder="Juan Pérez" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="pl-9" />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="tu@correo.com" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="pl-9" />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="pl-9 pr-9" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="confirmPassword" type="password" placeholder="Repite tu contraseña" value={form.confirmPassword} onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))} className="pl-9" />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" placeholder="8XXX-XXXX" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Ubicación</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="address" placeholder="Managua" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} className="pl-9" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <button onClick={() => navigate("login")} className="text-primary hover:underline font-medium">
              Inicia sesión
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
