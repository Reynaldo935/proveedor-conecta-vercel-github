"use client"

import { useState, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Mail, Lock, User, Eye, EyeOff, Phone, MapPin, Store, ShoppingBag, ArrowRight, ArrowLeft, Loader2, Check, X, ShieldCheck } from "lucide-react"
import { validateEmail } from "@/lib/validators"
import { VerifyEmail } from "@/components/auth/verify-email"
import { motion, AnimatePresence } from "framer-motion"

const STEPS = [
  { id: 1, title: "Tipo de Cuenta", subtitle: "¿Cómo usarás ProveedorConecta?" },
  { id: 2, title: "Datos Personales", subtitle: "Cuéntanos sobre ti" },
  { id: 3, title: "Contraseña", subtitle: "Protege tu cuenta" },
]

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 20, label: "Muy débil", color: "bg-red-500" }
  if (score === 2) return { score: 40, label: "Débil", color: "bg-orange-500" }
  if (score === 3) return { score: 60, label: "Regular", color: "bg-yellow-500" }
  if (score === 4) return { score: 80, label: "Fuerte", color: "bg-green-500" }
  return { score: 100, label: "Muy fuerte", color: "bg-emerald-500" }
}

export function RegisterForm() {
  const { navigate } = useAppStore()
  const { setUser } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [verificationState, setVerificationState] = useState<{
    show: boolean
    email: string
    token?: string
    link?: string
  }>({ show: false, email: "" })

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password])

  // Real-time validation
  const getFieldError = (field: string): string | undefined => {
    if (!touched[field]) return undefined
    switch (field) {
      case "name":
        return form.name.trim() ? undefined : "Nombre es requerido"
      case "email": {
        const check = validateEmail(form.email)
        return check.valid ? undefined : check.message
      }
      case "password":
        return form.password.length >= 6 ? undefined : "Mínimo 6 caracteres"
      case "confirmPassword":
        return form.password === form.confirmPassword ? undefined : "Las contraseñas no coinciden"
      default:
        return undefined
    }
  }

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}
    if (s === 1) {
      // Role is always valid (default BUYER)
    } else if (s === 2) {
      if (!form.name.trim()) errs.name = "Nombre es requerido"
      const emailCheck = validateEmail(form.email)
      if (!emailCheck.valid) errs.email = emailCheck.message
    } else if (s === 3) {
      if (form.password.length < 6) errs.password = "Mínimo 6 caracteres"
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Las contraseñas no coinciden"
    }
    setErrors(errs)
    // Mark all fields as touched for current step
    const fieldsToTouch = s === 2 ? ["name", "email"] : s === 3 ? ["password", "confirmPassword"] : []
    setTouched(t => ({ ...t, ...Object.fromEntries(fieldsToTouch.map(f => [f, true])) }))
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 3))
    }
  }

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(3)) return

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
        toast.success("¡Cuenta creada! Verifica tu correo electrónico.")
        setVerificationState({
          show: true,
          email: form.email,
          token: data.data.verificationToken,
          link: data.data.verificationLink,
        })
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
        if (data.data.requiresVerification) {
          toast.success("¡Registro con Google exitoso! Verifica tu correo electrónico.")
          setVerificationState({
            show: true,
            email: googleEmail,
            token: data.data.verificationToken,
            link: data.data.verificationLink,
          })
        } else {
          toast.success("¡Registro con Google exitoso!")
          navigate("home")
        }
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Show verification step if registration succeeded
  if (verificationState.show) {
    return (
      <VerifyEmail
        email={verificationState.email}
        verificationToken={verificationState.token}
        verificationLink={verificationState.link}
      />
    )
  }

  const progressValue = (step / 3) * 100

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="relative -mb-6 z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-gradient-to-br from-[#00695C] via-[#00796B] to-[#00BFA5] rounded-2xl p-6 text-center shadow-xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border border-white/30"
            >
              <span className="text-white font-bold text-xl">PC</span>
            </motion.div>
            <h1 className="text-xl font-bold text-white font-[family-name:var(--font-poppins)]">
              Crear Cuenta
            </h1>
            <p className="text-white/80 text-sm mt-1">Únete a ProveedorConecta Nicaragua</p>

            {/* Step Progress */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-white/70">
                <span>Paso {step} de 3</span>
                <span>{STEPS[step - 1].title}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-white/90 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressValue}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        <Card className="rounded-2xl shadow-lg border-0 pt-10">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {/* Step 1: Role Selection */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-4">
                      <h2 className="text-lg font-semibold">¿Cómo usarás ProveedorConecta?</h2>
                      <p className="text-sm text-muted-foreground">Puedes cambiar esto después</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setForm(f => ({ ...f, role: "BUYER" }))}
                        className={`relative p-6 rounded-2xl border-2 transition-all text-center ${
                          form.role === "BUYER"
                            ? "border-[#00695C] bg-[#00695C]/5 shadow-md"
                            : "border-muted bg-card hover:border-muted-foreground/30"
                        }`}
                      >
                        {form.role === "BUYER" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-[#00695C] rounded-full flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                        <div className="text-4xl mb-3">🛒</div>
                        <div className="font-semibold text-sm">Comprador</div>
                        <div className="text-xs text-muted-foreground mt-1">Busco productos y servicios</div>
                        <ShoppingBag className="h-5 w-5 mx-auto mt-2 text-muted-foreground" />
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setForm(f => ({ ...f, role: "SELLER" }))}
                        className={`relative p-6 rounded-2xl border-2 transition-all text-center ${
                          form.role === "SELLER"
                            ? "border-[#D4A017] bg-[#D4A017]/5 shadow-md"
                            : "border-muted bg-card hover:border-muted-foreground/30"
                        }`}
                      >
                        {form.role === "SELLER" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-[#D4A017] rounded-full flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                        <div className="text-4xl mb-3">🏪</div>
                        <div className="font-semibold text-sm">Vendedor</div>
                        <div className="text-xs text-muted-foreground mt-1">Ofrezco productos y servicios</div>
                        <Store className="h-5 w-5 mx-auto mt-2 text-muted-foreground" />
                      </motion.button>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="w-full h-11 bg-gradient-to-r from-[#00695C] to-[#00897B] hover:from-[#005A4E] hover:to-[#00796B] text-white font-medium shadow-md"
                      >
                        Continuar <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-3 text-muted-foreground">o</span>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full h-11" onClick={handleGoogleRegister} disabled={loading}>
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Registrarse con Google
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Personal Info */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-4">
                      <h2 className="text-lg font-semibold">Datos Personales</h2>
                      <p className="text-sm text-muted-foreground">Cuéntanos sobre ti</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="Juan Pérez"
                          value={form.name}
                          onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setTouched(t => ({ ...t, name: true })) }}
                          onBlur={() => setTouched(t => ({ ...t, name: true }))}
                          className={`pl-9 h-11 ${getFieldError("name") ? "border-destructive" : touched.name && form.name ? "border-green-500" : ""}`}
                        />
                        {touched.name && form.name && !getFieldError("name") && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {getFieldError("name") && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" /> {getFieldError("name")}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@correo.com"
                          value={form.email}
                          onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); setTouched(t => ({ ...t, email: true })) }}
                          onBlur={() => setTouched(t => ({ ...t, email: true }))}
                          className={`pl-9 h-11 ${getFieldError("email") ? "border-destructive" : touched.email && form.email && !getFieldError("email") ? "border-green-500" : ""}`}
                        />
                        {touched.email && form.email && !getFieldError("email") && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {getFieldError("email") && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" /> {getFieldError("email")}
                        </motion.p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="phone" placeholder="8XXX-XXXX" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="pl-9 h-11" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Ubicación</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="address" placeholder="Managua" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} className="pl-9 h-11" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={handleBack} className="h-11">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                      </Button>
                      <Button type="button" onClick={handleNext} className="flex-1 h-11 bg-gradient-to-r from-[#00695C] to-[#00897B] hover:from-[#005A4E] hover:to-[#00796B] text-white font-medium">
                        Continuar <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Password */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-4">
                      <h2 className="text-lg font-semibold">Protege tu Cuenta</h2>
                      <p className="text-sm text-muted-foreground">Elige una contraseña segura</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={form.password}
                          onChange={(e) => { setForm(f => ({ ...f, password: e.target.value })); setTouched(t => ({ ...t, password: true })) }}
                          onBlur={() => setTouched(t => ({ ...t, password: true }))}
                          className={`pl-9 pr-10 h-11 ${getFieldError("password") ? "border-destructive" : ""}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {/* Password Strength Indicator */}
                      {form.password && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5">
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${passwordStrength.score}%` }}
                              transition={{ duration: 0.3 }}
                              className={`h-full rounded-full ${passwordStrength.color}`}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Fortaleza:</span>
                            <span className={`text-xs font-medium ${passwordStrength.score >= 60 ? "text-green-600" : passwordStrength.score >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {[
                              { label: "6+ caracteres", met: form.password.length >= 6 },
                              { label: "Mayúscula", met: /[A-Z]/.test(form.password) },
                              { label: "Número", met: /[0-9]/.test(form.password) },
                              { label: "Especial (!@#)", met: /[^A-Za-z0-9]/.test(form.password) },
                            ].map(req => (
                              <span key={req.label} className={`flex items-center gap-1 ${req.met ? "text-green-600" : "text-muted-foreground"}`}>
                                {req.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                {req.label}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      {getFieldError("password") && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" /> {getFieldError("password")}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repite tu contraseña"
                          value={form.confirmPassword}
                          onChange={(e) => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setTouched(t => ({ ...t, confirmPassword: true })) }}
                          onBlur={() => setTouched(t => ({ ...t, confirmPassword: true }))}
                          className={`pl-9 pr-10 h-11 ${getFieldError("confirmPassword") ? "border-destructive" : touched.confirmPassword && form.confirmPassword && !getFieldError("confirmPassword") ? "border-green-500" : ""}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {touched.confirmPassword && form.confirmPassword && !getFieldError("confirmPassword") && form.password === form.confirmPassword && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Las contraseñas coinciden
                        </motion.p>
                      )}
                      {getFieldError("confirmPassword") && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" /> {getFieldError("confirmPassword")}
                        </motion.p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={handleBack} className="h-11">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 h-11 bg-gradient-to-r from-[#00695C] to-[#00897B] hover:from-[#005A4E] hover:to-[#00796B] text-white font-medium shadow-md"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Creando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Crear Cuenta
                          </span>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-sm text-muted-foreground mt-5"
            >
              ¿Ya tienes cuenta?{" "}
              <button onClick={() => navigate("login")} className="text-primary hover:underline font-medium">
                Inicia sesión
              </button>
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
