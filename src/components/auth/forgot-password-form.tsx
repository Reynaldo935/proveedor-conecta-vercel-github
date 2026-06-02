"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, ExternalLink, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Step = "email" | "sent" | "reset" | "success"

export function ForgotPasswordForm() {
  const { navigate } = useAppStore()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetLink, setResetLink] = useState("")
  const [countdown, setCountdown] = useState(0)

  // Request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Ingresa tu correo electrónico")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (data.success) {
        if (data.data) {
          // User exists — show token info
          setToken(data.data.token)
          setResetLink(data.data.resetLink)
          setStep("sent")
          toast.success("Se ha generado un enlace de restablecimiento")
        } else {
          // Generic message (user may not exist)
          setStep("sent")
          toast.info("Si el correo está registrado, recibirás un enlace")
        }
      } else {
        toast.error(data.error || "Error al procesar la solicitud")
      }
    } catch {
      toast.error("No se pudo conectar. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Reset password with token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newPassword || !confirmPassword) {
      toast.error("Completa todos los campos")
      return
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", token, password: newPassword }),
      })
      const data = await res.json()

      if (data.success) {
        setStep("success")
        toast.success("¡Contraseña actualizada exitosamente!")
      } else {
        toast.error(data.error || "Error al restablecer la contraseña")
        if (data.expired) {
          setStep("email")
        }
      }
    } catch {
      toast.error("No se pudo conectar. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Resend reset email
  const handleResend = async () => {
    if (countdown > 0) return
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setToken(data.data.token)
        setResetLink(data.data.resetLink)
        setCountdown(60)
        toast.success("Se ha generado un nuevo enlace de restablecimiento")
      } else {
        toast.info("Si el correo está registrado, recibirás un enlace")
      }
    } catch {
      toast.error("No se pudo conectar. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown > 0])

  const handleSimulateResetClick = () => {
    setStep("reset")
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-2 bg-gradient-to-r from-[#1A5276] via-[#2E86C1] to-[#3498DB]" />

          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Email input */}
              {step === "email" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
                  >
                    <KeyRound className="h-10 w-10 text-primary" />
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-bold">Recuperar Contraseña</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                    </p>
                  </div>

                  <form onSubmit={handleRequestReset} className="space-y-4">
                    <div className="space-y-2 text-left">
                      <Label htmlFor="reset-email">Correo electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="tu@correo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 h-11"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white font-medium shadow-md"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                        </span>
                      ) : (
                        "Enviar Enlace de Restablecimiento"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* Step 2: Token sent (simulated email) */}
              {step === "sent" && (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto"
                  >
                    <Mail className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-bold">Enlace Enviado</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Se ha enviado un enlace de restablecimiento a:
                    </p>
                    <p className="text-sm font-semibold mt-1 text-primary">{email}</p>
                  </div>

                  {/* Demo: Show token info as clickable */}
                  {token && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-5 space-y-3 border border-primary/20 text-left"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <ExternalLink className="h-4 w-4" />
                        <span>Enlace de restablecimiento (demo)</span>
                      </div>
                      <div className="bg-background rounded-lg border border-primary/10 p-3 break-all">
                        <p className="text-xs font-mono text-muted-foreground">{resetLink}</p>
                      </div>
                      <div className="bg-background rounded-lg border border-primary/10 p-3">
                        <p className="text-xs text-muted-foreground">Token:</p>
                        <p className="text-xs font-mono font-semibold select-all">{token}</p>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white shadow-md"
                        onClick={handleSimulateResetClick}
                      >
                        <span className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4" /> Simular clic en enlace
                        </span>
                      </Button>
                    </motion.div>
                  )}

                  {/* Resend section */}
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      ¿No recibiste el correo? Revisa tu carpeta de spam.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleResend}
                      disabled={loading || countdown > 0}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                        </span>
                      ) : countdown > 0 ? (
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Reenviar en {countdown}s
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Mail className="h-4 w-4" /> Reenviar enlace
                        </span>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Reset password form */}
              {step === "reset" && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
                  >
                    <Lock className="h-10 w-10 text-primary" />
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-bold">Nueva Contraseña</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Ingresa tu nueva contraseña para la cuenta asociada a <span className="font-semibold text-primary">{email}</span>
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2 text-left">
                      <Label htmlFor="reset-token">Token de verificación</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reset-token"
                          type="text"
                          placeholder="Token de verificación"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          className="pl-9 h-11 font-mono text-xs"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <Label htmlFor="new-password">Nueva contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-9 pr-10 h-11"
                          disabled={loading}
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
                    </div>

                    <div className="space-y-2 text-left">
                      <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repite tu contraseña"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-9 pr-10 h-11"
                          disabled={loading}
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
                      {confirmPassword && newPassword && confirmPassword !== newPassword && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Las contraseñas no coinciden
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white font-medium shadow-md"
                      disabled={loading || (confirmPassword !== newPassword && confirmPassword !== "")}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Restableciendo...
                        </span>
                      ) : (
                        "Restablecer Contraseña"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* Step 4: Success */}
              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 flex items-center justify-center mx-auto"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                    >
                      <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                    </motion.div>
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                      ¡Contraseña Actualizada!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
                    </p>
                  </div>

                  <Button
                    className="w-full h-11 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white font-medium shadow-md"
                    onClick={() => navigate("login")}
                  >
                    Ir a Iniciar Sesión
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back to login link */}
            <div className="text-center mt-6">
              <button
                onClick={() => navigate("login")}
                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
