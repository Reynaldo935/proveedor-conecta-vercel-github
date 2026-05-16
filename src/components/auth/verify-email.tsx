"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ArrowLeft, Clock, Loader2, PartyPopper } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface VerifyEmailProps {
  email?: string
  verificationToken?: string
  verificationLink?: string
}

export function VerifyEmail({ email, verificationToken, verificationLink }: VerifyEmailProps) {
  const { navigate } = useAppStore()
  const { setUser, user } = useAuthStore()
  const [status, setStatus] = useState<"pending" | "verifying" | "verified" | "expired" | "error">(
    verificationToken ? "verifying" : "pending"
  )
  const [resending, setResending] = useState(false)
  const [polling, setPolling] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [currentLink, setCurrentLink] = useState(verificationLink)
  const [verifyingWithToken, setVerifyingWithToken] = useState(false)

  // Poll verification status
  const checkVerificationStatus = useCallback(async () => {
    if (!email) return
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data?.emailVerified) {
          setStatus("verified")
          setPolling(false)
          setUser(data.data)
        }
      }
    } catch {
      // Silently fail polling
    }
  }, [email, setUser])

  // Auto-poll every 5 seconds
  useEffect(() => {
    if (!polling || status === "verified") return
    const interval = setInterval(checkVerificationStatus, 5000)
    return () => clearInterval(interval)
  }, [polling, status, checkVerificationStatus])

  // Countdown for resend button
  useEffect(() => {
    if (status === "verified") return
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown, status])

  const verifyToken = useCallback(async (token: string) => {
    setVerifyingWithToken(true)
    try {
      const res = await fetch(`/api/auth/verify?token=${token}`)
      const data = await res.json()

      if (data.success) {
        setStatus("verified")
        setPolling(false)
        if (data.data) {
          setUser(data.data)
        }
        toast.success("¡Correo verificado exitosamente!")
      } else if (data.expired) {
        setStatus("expired")
        setPolling(false)
      } else {
        setStatus("error")
        setPolling(false)
      }
    } catch {
      setStatus("error")
      setPolling(false)
    } finally {
      setVerifyingWithToken(false)
    }
  }, [setUser])

  // Handle direct token verification
  useEffect(() => {
    if (verificationToken && status === "verifying") {
      verifyToken(verificationToken)
    }
  }, [verificationToken, verifyToken, status])

  const handleResend = async () => {
    if (!email) {
      toast.error("No se encontró el correo electrónico")
      return
    }

    setResending(true)
    try {
      const res = await fetch("/api/auth/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (data.success) {
        setCurrentLink(data.data.verificationLink)
        setCountdown(60)
        toast.success("Se ha enviado un nuevo correo de verificación")
      } else {
        toast.error(data.error || "Error al reenviar correo")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setResending(false)
    }
  }

  const handleSimulateClick = async () => {
    if (!currentLink) return
    const token = currentLink.split("token=")[1]
    if (token) {
      setStatus("verifying")
      await verifyToken(token)
    }
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
              {/* Pending / Verifying State */}
              {(status === "pending" || status === "verifying") && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  {/* Animated Mail Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto"
                  >
                    <motion.div
                      animate={status === "verifying" ? { rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 0.5, repeat: status === "verifying" ? Infinity : 0 }}
                    >
                      {status === "verifying" ? (
                        <Loader2 className="h-10 w-10 text-amber-600 dark:text-amber-400 animate-spin" />
                      ) : (
                        <Mail className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                      )}
                    </motion.div>
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-bold">Verifica tu Correo</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Hemos enviado un enlace de verificación a:
                    </p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm font-semibold mt-1 text-primary"
                    >
                      {email || user?.email}
                    </motion.p>
                  </div>

                  {status === "pending" && polling && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                    >
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Esperando verificación...</span>
                    </motion.div>
                  )}

                  {/* Demo: Show verification link as clickable button */}
                  {status === "pending" && currentLink && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-5 space-y-3 border border-primary/20"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <ExternalLink className="h-4 w-4" />
                        <span>Enlace de verificación (demo)</span>
                      </div>
                      <div className="bg-background rounded-lg border border-primary/10 p-3 break-all">
                        <p className="text-xs font-mono text-muted-foreground">{currentLink}</p>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white shadow-md"
                        onClick={handleSimulateClick}
                        disabled={verifyingWithToken}
                      >
                        {verifyingWithToken ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" /> Simular clic en enlace
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {/* Resend section */}
                  {status === "pending" && (
                    <div className="border-t pt-4 space-y-3">
                      <p className="text-xs text-muted-foreground">
                        ¿No recibiste el correo? Revisa tu carpeta de spam.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleResend}
                        disabled={resending || countdown > 0}
                      >
                        {resending ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" /> Enviando...
                          </span>
                        ) : countdown > 0 ? (
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Reenviar en {countdown}s
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Reenviar correo de verificación
                          </span>
                        )}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Verified State */}
              {status === "verified" && (
                <motion.div
                  key="verified"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-center space-y-6"
                >
                  {/* Success animation */}
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

                  {/* Confetti-like decorative dots */}
                  <div className="relative">
                    {[
                      { x: -40, y: -20, delay: 0.5 },
                      { x: 40, y: -15, delay: 0.6 },
                      { x: -30, y: 10, delay: 0.7 },
                      { x: 30, y: 15, delay: 0.8 },
                    ].map((dot, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, x: 0, y: 0 }}
                        animate={{ scale: 1, x: dot.x, y: dot.y }}
                        transition={{ delay: dot.delay, type: "spring" }}
                        className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-dorado"
                      />
                    ))}
                    <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                      ¡Correo Verificado!
                    </h3>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <p className="text-sm text-muted-foreground">
                      Tu correo electrónico ha sido verificado exitosamente. Ya puedes acceder a todas las funciones de ProveedorConecta.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <Button
                      className="w-full h-11 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white font-medium shadow-md"
                      onClick={() => navigate("home")}
                    >
                      <PartyPopper className="h-4 w-4 mr-2" /> Ir al Marketplace
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* Expired State */}
              {status === "expired" && (
                <motion.div
                  key="expired"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto"
                  >
                    <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Enlace Expirado</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      El enlace de verificación ha expirado. Los enlaces son válidos por 24 horas. Solicita uno nuevo.
                    </p>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white"
                    onClick={handleResend}
                    disabled={resending || countdown > 0}
                  >
                    {resending ? (
                      <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Enviando...</span>
                    ) : countdown > 0 ? (
                      <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Reenviar en {countdown}s</span>
                    ) : (
                      <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Solicitar nuevo enlace</span>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Error State */}
              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto"
                  >
                    <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Error de Verificación</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Hubo un error al verificar tu correo. Intenta de nuevo.
                    </p>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#154360] hover:to-[#2471A3] text-white"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? (
                      <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Enviando...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Reenviar correo</span>
                    )}
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
