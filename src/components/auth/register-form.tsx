"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  Mail, Lock, User, Eye, EyeOff, Phone, MapPin, Store, ShoppingBag,
  ArrowRight, ArrowLeft, Loader2, Check, X, ShieldCheck, Smartphone,
  MessageSquare, RefreshCw, Clock
} from "lucide-react"
import { validateEmail, validatePhoneNicaragua, formatPhoneNicaragua, NICARAGUA_DEPARTMENTS } from "@/lib/validators"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VerifyEmail } from "@/components/auth/verify-email"
import { motion, AnimatePresence } from "framer-motion"

const STEPS = [
  { id: 1, title: "Tipo de Cuenta", subtitle: "¿Cómo usarás ProveedorConecta?" },
  { id: 2, title: "Datos Personales", subtitle: "Cuéntanos sobre ti (teléfono opcional)" },
  { id: 3, title: "Verificar Teléfono", subtitle: "Opcional — puedes saltarlo" },
  { id: 4, title: "Contraseña", subtitle: "Protege tu cuenta" },
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
    department: "",
    address: "",
    role: "BUYER" as "BUYER" | "SELLER",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Phone verification state
  const [smsCode, setSmsCode] = useState("")
  const [smsSent, setSmsSent] = useState(false)
  const [smsVerified, setSmsVerified] = useState(false)
  const [smsSending, setSmsSending] = useState(false)
  const [smsVerifying, setSmsVerifying] = useState(false)
  const [smsCountdown, setSmsCountdown] = useState(0)
  const [receivedCode, setReceivedCode] = useState("")

  const [verificationState, setVerificationState] = useState<{
    show: boolean
    email: string
    token?: string
    link?: string
  }>({ show: false, email: "" })

  // Ref for SMS countdown interval to clean up on unmount
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password])

  // Countdown timer for SMS resend
  const startCountdown = useCallback(() => {
    setSmsCountdown(60)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setSmsCountdown(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  // Real-time validation
  const getFieldError = (field: string): string | undefined => {
    if (!touched[field]) return undefined
    switch (field) {
      case "name":
        return form.name.trim().length >= 3 ? undefined : "Nombre es requerido (mínimo 3 caracteres)"
      case "email": {
        const check = validateEmail(form.email)
        return check.valid ? undefined : check.message
      }
      case "phone": {
        const check = validatePhoneNicaragua(form.phone)
        return check.valid ? undefined : check.message
      }
      case "department":
        return form.department ? undefined : "Selecciona un departamento"
      case "address":
        return form.address.trim().length >= 5 ? undefined : "Dirección es requerida (mínimo 5 caracteres)"
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
      // Role is always valid
    } else if (s === 2) {
      if (!form.name.trim() || form.name.trim().length < 3) errs.name = "Nombre es requerido (mínimo 3 caracteres)"
      const emailCheck = validateEmail(form.email)
      if (!emailCheck.valid) errs.email = emailCheck.message
      // Phone is OPTIONAL — only validate if provided
      if (form.phone.trim()) {
        const phoneCheck = validatePhoneNicaragua(form.phone)
        if (!phoneCheck.valid) errs.phone = phoneCheck.message
      }
      // Department and address optional
    } else if (s === 3) {
      // Phone verification is OPTIONAL — always allow skipping
      if (form.phone.trim() && !smsVerified) {
        // Only require verification if they provided a phone and haven't verified
        // Actually, let's just show a warning, not block
      }
    } else if (s === 4) {
      if (form.password.length < 6) errs.password = "Mínimo 6 caracteres"
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Las contraseñas no coinciden"
    }
    setErrors(errs)
    const fieldsToTouch = s === 2 ? ["name", "email"] : s === 4 ? ["password", "confirmPassword"] : []
    setTouched(t => ({ ...t, ...Object.fromEntries(fieldsToTouch.map(f => [f, true])) }))
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 4))
    }
  }

  // Skip phone verification step
  const handleSkipPhone = () => {
    setStep(s => Math.min(s + 1, 4))
  }

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 1))
  }

  // Send SMS verification code
  const handleSendSms = async () => {
    const phoneCheck = validatePhoneNicaragua(form.phone)
    if (!phoneCheck.valid) {
      toast.error(phoneCheck.message)
      return
    }

    setSmsSending(true)
    try {
      const res = await fetch("/api/auth/phone-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone }),
      })
      const data = await res.json()
      if (data.success) {
        setSmsSent(true)
        setReceivedCode(data.data.code) // For demo: show the code
        startCountdown()
        toast.success("Código de verificación enviado a tu teléfono")
      } else {
        toast.error(data.error || "Error al enviar código")
      }
    } catch {
      toast.error("No se pudo conectar al servidor. Intenta de nuevo.")
    } finally {
      setSmsSending(false)
    }
  }

  // Verify SMS code
  const handleVerifySms = async () => {
    if (!smsCode || smsCode.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos")
      return
    }

    setSmsVerifying(true)
    try {
      const res = await fetch("/api/auth/phone-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, code: smsCode, action: "verify" }),
      })
      const data = await res.json()
      if (data.success) {
        setSmsVerified(true)
        toast.success("¡Teléfono verificado exitosamente!")
      } else {
        toast.error(data.error || "Código incorrecto")
      }
    } catch {
      toast.error("No se pudo conectar al servidor. Intenta de nuevo.")
    } finally {
      setSmsVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(4)) return

    // Double-check phone verification
    if (!smsVerified) {
      toast.error("Debes verificar tu número de teléfono primero")
      setStep(3)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phoneVerified: true,
        }),
      })
      const data = await res.json()
      if (data.success) {
        // If API indicates email verification is needed, show verification step
        if (data.requireEmailVerification || data.data?.emailVerified === false) {
          setVerificationState({
            show: true,
            email: form.email,
            token: data.verificationToken || data.data?.verificationToken,
            link: data.verificationLink || data.data?.verificationLink,
          })
          toast.success("¡Cuenta creada! Por favor verifica tu correo electrónico.")
        } else {
          setUser(data.data)
          toast.success("¡Cuenta creada exitosamente! Bienvenido a ProveedorConecta.")
          navigate("home")
        }
      } else {
        toast.error(data.error || "Error al registrarse")
      }
    } catch {
      toast.error("No se pudo conectar al servidor. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    const googleEmail = prompt("Ingresa tu correo de Google (simulación OAuth):")
    if (!googleEmail) return

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(googleEmail)) {
      toast.error("Formato de correo inválido")
      return
    }

    // Server-side email validation with account existence check
    try {
      const validateRes = await fetch("/api/auth/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: googleEmail, checkAccount: true }),
      })
      const validateData = await validateRes.json()
      if (validateData.success && validateData.data) {
        if (validateData.data.correoInvalido || !validateData.data.accountExists) {
          toast.error("Correo inválido — la cuenta de Google no existe o no se puede verificar")
          return
        }
        if (validateData.data.disposable) {
          toast.error("No se permiten correos de dominios desechables")
          return
        }
        if (!validateData.data.valid) {
          toast.error("Correo inválido. Verifica que la dirección de correo exista.")
          return
        }
      }
    } catch {
      // If validation endpoint fails, proceed anyway
    }

    // For Google OAuth, still require phone verification
    if (!smsVerified) {
      toast.error("Primero completa el formulario y verifica tu teléfono antes de registrarte con Google")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail,
          name: form.name || googleEmail.split("@")[0],
          googleId: "google_" + Date.now(),
          avatar: "",
          role: form.role,
          phone: form.phone,
          department: form.department,
          address: form.address,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.data)
        toast.success("¡Registro con Google exitoso! Bienvenido a ProveedorConecta.")
        navigate("home")
      } else {
        toast.error(data.error || "Error al registrarse")
      }
    } catch {
      toast.error("No se pudo conectar al servidor. Intenta de nuevo.")
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

  const progressValue = (step / 4) * 100

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
            className="bg-gradient-to-br from-[#1A5276] via-[#2471A3] to-[#3498DB] rounded-2xl p-6 text-center shadow-xl"
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
                <span>Paso {step} de 4</span>
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
              {/* Step indicators */}
              <div className="flex justify-between mt-2">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > i + 1 ? "bg-white/90 text-[#1A5276]" :
                      step === i + 1 ? "bg-white/40 text-white border-2 border-white" :
                      "bg-white/10 text-white/50"
                    }`}>
                      {step > i + 1 ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                  </div>
                ))}
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
                            ? "border-[#1A5276] bg-[#1A5276]/5 shadow-md"
                            : "border-muted bg-card hover:border-muted-foreground/30"
                        }`}
                      >
                        {form.role === "BUYER" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-[#1A5276] rounded-full flex items-center justify-center"
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
                            ? "border-[#F4D03F] bg-[#F4D03F]/5 shadow-md"
                            : "border-muted bg-card hover:border-muted-foreground/30"
                        }`}
                      >
                        {form.role === "SELLER" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-[#F4D03F] rounded-full flex items-center justify-center"
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
                        className="w-full h-11 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white font-medium shadow-md"
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

                {/* Step 2: Personal Info - ALL FIELDS REQUIRED */}
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
                      <p className="text-sm text-muted-foreground">Todos los campos son obligatorios</p>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo <span className="text-destructive">*</span></Label>
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

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico <span className="text-destructive">*</span></Label>
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

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="8XXX-XXXX"
                          value={form.phone}
                          onChange={(e) => {
                            const formatted = formatPhoneNicaragua(e.target.value)
                            setForm(f => ({ ...f, phone: formatted }))
                            setTouched(t => ({ ...t, phone: true }))
                          }}
                          onBlur={() => setTouched(t => ({ ...t, phone: true }))}
                          className={`pl-9 h-11 ${getFieldError("phone") ? "border-destructive" : touched.phone && form.phone && !getFieldError("phone") ? "border-green-500" : ""}`}
                          maxLength={9}
                        />
                        {touched.phone && form.phone && !getFieldError("phone") && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {getFieldError("phone") && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" /> {getFieldError("phone")}
                        </motion.p>
                      )}
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                      <Label htmlFor="department">Departamento <span className="text-destructive">*</span></Label>
                      <Select value={form.department} onValueChange={(value) => { setForm(f => ({ ...f, department: value })); setTouched(t => ({ ...t, department: true })) }}>
                        <SelectTrigger className={`w-full h-11 ${getFieldError("department") ? "border-destructive" : form.department ? "border-green-500" : ""}`}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Selecciona un departamento" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {NICARAGUA_DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {getFieldError("department") && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" /> {getFieldError("department")}
                        </motion.p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          placeholder="Casa #12, Barrio Central, Managua"
                          value={form.address}
                          onChange={(e) => { setForm(f => ({ ...f, address: e.target.value })); setTouched(t => ({ ...t, address: true })) }}
                          onBlur={() => setTouched(t => ({ ...t, address: true }))}
                          className={`pl-9 h-11 ${getFieldError("address") ? "border-destructive" : touched.address && form.address && !getFieldError("address") ? "border-green-500" : ""}`}
                        />
                        {touched.address && form.address && !getFieldError("address") && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {getFieldError("address") && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" /> {getFieldError("address")}
                        </motion.p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={handleBack} className="h-11">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                      </Button>
                      <Button type="button" onClick={handleNext} className="flex-1 h-11 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white font-medium">
                        Continuar <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Phone Verification (SMS Code) */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="text-center mb-4">
                      <h2 className="text-lg font-semibold">Verificar Teléfono</h2>
                      <p className="text-sm text-muted-foreground">Te enviaremos un código por SMS</p>
                    </div>

                    {/* Phone number display */}
                    <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Número registrado</p>
                        <p className="font-semibold">{form.phone}</p>
                      </div>
                      {smsVerified && (
                        <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">
                          <Check className="h-3 w-3 mr-1" /> Verificado
                        </Badge>
                      )}
                    </div>

                    {!smsVerified && (
                      <>
                        {/* Send code button */}
                        {!smsSent ? (
                          <Button
                            type="button"
                            className="w-full h-11 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white font-medium shadow-md"
                            onClick={handleSendSms}
                            disabled={smsSending}
                          >
                            {smsSending ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Enviando código...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Enviar código de verificación
                              </span>
                            )}
                          </Button>
                        ) : (
                          <>
                            {/* Show received code for demo */}
                            {receivedCode && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700"
                              >
                                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">
                                  📱 Código de verificación (demo):
                                </p>
                                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-amber-800 dark:text-amber-200 tracking-widest">
                                  {receivedCode}
                                </p>
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                                  En producción, este código llegaría por SMS a tu teléfono
                                </p>
                              </motion.div>
                            )}

                            {/* Code input */}
                            <div className="space-y-2">
                              <Label htmlFor="smsCode">Código de verificación (6 dígitos)</Label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="smsCode"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="000000"
                                    value={smsCode}
                                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className="pl-9 h-11 text-center text-lg font-[family-name:var(--font-jetbrains)] tracking-widest"
                                    maxLength={6}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  onClick={handleVerifySms}
                                  disabled={smsVerifying || smsCode.length !== 6}
                                  className="h-11 px-4 bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {smsVerifying ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Resend */}
                            <div className="text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleSendSms}
                                disabled={smsCountdown > 0 || smsSending}
                                className="text-sm"
                              >
                                {smsCountdown > 0 ? (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" /> Reenviar en {smsCountdown}s
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="h-3 w-3" /> Reenviar código
                                  </span>
                                )}
                              </Button>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* Verified success */}
                    {smsVerified && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-700 dark:text-green-400">¡Teléfono verificado!</p>
                            <p className="text-sm text-green-600 dark:text-green-500">Tu número {form.phone} ha sido confirmado</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {errors.sms && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive flex items-center gap-1">
                        <X className="h-3 w-3" /> {errors.sms}
                      </motion.p>
                    )}

                    {/* Skip phone verification */}
                    {!smsVerified && (
                      <div className="text-center pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSkipPhone}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Omitir verificación <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Puedes verificar tu teléfono después desde tu perfil
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={handleBack} className="h-11">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!smsVerified}
                        className="flex-1 h-11 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white font-medium"
                      >
                        Continuar <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Password */}
                {step === 4 && (
                  <motion.div
                    key="step4"
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
                        className="flex-1 h-11 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white font-medium shadow-md"
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
