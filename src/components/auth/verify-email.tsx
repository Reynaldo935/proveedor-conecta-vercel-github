"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ArrowLeft, Clock } from "lucide-react"

interface VerifyEmailProps {
  email?: string
  verificationToken?: string
  verificationLink?: string
}

export function VerifyEmail({ email, verificationToken, verificationLink }: VerifyEmailProps) {
  const { navigate } = useAppStore()
  const { setUser, user } = useAuthStore()
  const [status, setStatus] = useState<"pending" | "verified" | "expired" | "error">("pending")
  const [resending, setResending] = useState(false)
  const [polling, setPolling] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [currentLink, setCurrentLink] = useState(verificationLink)

  // Poll verification status
  const checkVerificationStatus = useCallback(async () => {
    if (!email) return

    try {
      // Check if user emailVerified via /api/auth/me
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data?.emailVerified) {
          setStatus("verified")
          setPolling(false)
          setUser(data.data)
          return
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
    }
  }, [setUser])

  // Handle direct token verification (when user clicks the link)
  useEffect(() => {
    if (verificationToken) {
      verifyToken(verificationToken)
    }
  }, [verificationToken, verifyToken])

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
    // Extract token from link
    const token = currentLink.split("token=")[1]
    if (token) {
      await verifyToken(token)
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
            Verificar Correo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pending State */}
          {status === "pending" && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                <Mail className="h-10 w-10 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Revisa tu correo</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Hemos enviado un enlace de verificación a:
                </p>
                <p className="text-sm font-medium mt-1 text-primary">{email || user?.email}</p>
              </div>

              {polling && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Esperando verificación...</span>
                </div>
              )}

              {/* Demo: Show verification link */}
              {currentLink && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    🔗 Enlace de verificación (demo):
                  </p>
                  <div className="bg-background rounded border p-2 break-all">
                    <p className="text-xs font-mono text-primary">{currentLink}</p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleSimulateClick}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Simular clic en enlace
                  </Button>
                </div>
              )}

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
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : countdown > 0 ? (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Reenviar en {countdown}s
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Reenviar correo de verificación
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Verified State */}
          {status === "verified" && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                  ¡Correo verificado!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu correo electrónico ha sido verificado exitosamente. Ya puedes acceder a todas las funciones de ProveedorConecta.
                </p>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => navigate("home")}
              >
                Ir al inicio
              </Button>
            </div>
          )}

          {/* Expired State */}
          {status === "expired" && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                  Enlace expirado
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  El enlace de verificación ha expirado. Los enlaces son válidos por 24 horas. Solicita uno nuevo.
                </p>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleResend}
                disabled={resending || countdown > 0}
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Reenviar en {countdown}s
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Solicitar nuevo enlace
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                  Error de verificación
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Hubo un error al verificar tu correo. Intenta de nuevo.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Reenviar correo
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Back to login link */}
          <div className="text-center">
            <button
              onClick={() => navigate("login")}
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
