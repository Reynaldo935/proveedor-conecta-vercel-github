"use client"

import { useState } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft,
  Loader2, Store, ShoppingBag,
} from "lucide-react"
import { validateEmail } from "@/lib/validators"
import { motion } from "framer-motion"

const STEPS = [
  { id: 1, title: "Tipo de Cuenta", subtitle: "¿Cómo usarás ProveedorConecta?" },
  { id: 2, title: "Tus Datos", subtitle: "Nombre y correo electrónico" },
  { id: 3, title: "Contraseña", subtitle: "Protege tu cuenta" },
]

export function RegisterForm() {
  const { navigate } = useAppStore()
  const { setUser } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "BUYER" as "BUYER" | "SELLER",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}
    if (s === 2) {
      if (!form.name.trim() || form.name.trim().length < 3) errs.name = "Nombre requerido (mínimo 3 caracteres)"
      const ec = validateEmail(form.email)
      if (!ec.valid) errs.email = ec.message
    } else if (s === 3) {
      if (form.password.length < 6) errs.password = "Mínimo 6 caracteres"
      if (form.password !== form.confirmPassword) errs.confirmPassword = "No coinciden"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, 3)) }
  const handleBack = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(3)) return
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          phone: "",
          department: "",
          address: "",
        }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.data) setUser(data.data)
        toast.success("¡Cuenta creada! Revisa tu correo para verificar.")
        navigate("home")
      } else {
        if (data.needsVerification) {
          toast.info("Revisa tu correo para verificar tu cuenta")
          navigate("home")
        } else {
          toast.error(data.error || "Error al registrarse")
        }
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // ─── Render Step Content ──────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Tipo de Cuenta</h2>
              <p className="text-sm text-muted-foreground">¿Cómo usarás ProveedorConecta?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, role: "BUYER" }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  form.role === "BUYER"
                    ? "border-[#00BCD4] bg-[#00BCD4]/10"
                    : "border-border hover:border-[#00BCD4]/50"
                }`}
              >
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-[#00BCD4]" />
                <p className="font-semibold text-sm">Comprador</p>
                <p className="text-[10px] text-muted-foreground">Busco productos</p>
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, role: "SELLER" }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  form.role === "SELLER"
                    ? "border-[#00BCD4] bg-[#00BCD4]/10"
                    : "border-border hover:border-[#00BCD4]/50"
                }`}
              >
                <Store className="h-8 w-8 mx-auto mb-2 text-[#00BCD4]" />
                <p className="font-semibold text-sm">Vendedor</p>
                <p className="text-[10px] text-muted-foreground">Vendo productos</p>
              </button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Tus Datos</h2>
              <p className="text-sm text-muted-foreground">Nombre y correo electrónico</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="Tu nombre" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="pl-9" />
                </div>
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="tu@correo.com" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="pl-9" />
                </div>
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Contraseña</h2>
              <p className="text-sm text-muted-foreground">Crea una contraseña segura</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="pl-9 pr-9" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirm" type={showConfirm ? "text" : "password"}
                    placeholder="Repite tu contraseña" value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} className="pl-9 pr-9" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showConfirm ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {STEPS.map((s) => (
            <div key={s.id} className="flex items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s.id ? "bg-[#00BCD4] text-white" : "bg-muted text-muted-foreground"
              }`}>{s.id}</div>
              {s.id < 3 && <div className={`w-8 h-0.5 ${step > s.id ? "bg-[#00BCD4]" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-medium text-foreground mb-2">{STEPS[step - 1].title}</p>
        <p className="text-center text-xs text-muted-foreground mb-6">{STEPS[step - 1].subtitle}</p>

        <Card className="rounded-2xl shadow-lg border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              {renderStep()}

              <div className="flex gap-2 mt-6">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                  </Button>
                )}
                {step < 3 ? (
                  <Button type="button" onClick={handleNext} className="flex-1 bg-[#00BCD4] hover:bg-[#00A5BD] text-white">
                    Continuar <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="flex-1 bg-[#00BCD4] hover:bg-[#00A5BD] text-white">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Crear Cuenta
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          ¿Ya tienes cuenta?{" "}
          <button onClick={() => navigate("login")} className="text-[#00BCD4] hover:underline font-medium">
            Inicia sesión
          </button>
        </p>
      </motion.div>
    </div>
  )
}
