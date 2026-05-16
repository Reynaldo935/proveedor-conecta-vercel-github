"use client"

import { useState } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from "lucide-react"
import { VerifyEmail } from "@/components/auth/verify-email"
import { motion, AnimatePresence } from "framer-motion"

const DEMO_ACCOUNTS = [
  { email: "ferreteria@demo.ni", label: "Ferretería", icon: "🏗️", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  { email: "agroserv@demo.ni", label: "Agroserv", icon: "🌾", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" },
  { email: "tech@demo.ni", label: "Tech", icon: "💻", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  { email: "comprador@demo.ni", label: "Comprador", icon: "🛒", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
]
const DEMO_PASSWORD = "demo123"

export function LoginForm() {
  const { navigate } = useAppStore()
  const { setUser } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [demoLogging, setDemoLogging] = useState<string | null>(null)

  // Show verification view if login detected unverified email
  if (unverifiedEmail) {
    return <VerifyEmail email={unverifiedEmail} />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Completa todos los campos")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.data)
        toast.success("¡Bienvenido de vuelta!")
        navigate("home")
      } else if (data.requiresVerification) {
        toast.error(data.error)
        setUnverifiedEmail(email)
      } else {
        toast.error(data.error || "Error al iniciar sesión")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string) => {
    setDemoLogging(demoEmail)
    setEmail(demoEmail)
    setPassword(DEMO_PASSWORD)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: DEMO_PASSWORD }),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.data)
        toast.success(`¡Bienvenido! (${demoEmail})`)
        navigate("home")
      } else if (data.requiresVerification) {
        toast.error(data.error)
        setUnverifiedEmail(demoEmail)
      } else {
        toast.error(data.error || "Cuenta demo no disponible")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
      setDemoLogging(null)
    }
  }

  const handleGoogleLogin = async () => {
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
          role: "BUYER",
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.data)
        if (data.data.requiresVerification) {
          toast.success("¡Registro con Google exitoso! Verifica tu correo electrónico.")
          setUnverifiedEmail(googleEmail)
        } else {
          toast.success("¡Bienvenido de vuelta!")
          navigate("home")
        }
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Error de conexión con Google")
    } finally {
      setLoading(false)
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
        {/* Gradient Header Card */}
        <div className="relative -mb-6 z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-gradient-to-br from-[#00695C] via-[#00796B] to-[#00BFA5] rounded-2xl p-8 text-center shadow-xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/30"
            >
              <span className="text-white font-bold text-2xl">PC</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-white font-[family-name:var(--font-poppins)]"
            >
              ProveedorConecta
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/80 text-sm mt-1"
            >
              Inicia sesión en el marketplace de Nicaragua
            </motion.p>
          </motion.div>
        </div>

        <Card className="rounded-2xl shadow-lg border-0 pt-10">
          <CardContent className="space-y-5 p-6">
            {/* Demo Accounts Quick Login */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Sparkles className="h-3.5 w-3.5 text-dorado" />
                <span>Cuentas demo — acceso rápido</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc, i) => (
                  <motion.button
                    key={acc.email}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    onClick={() => handleDemoLogin(acc.email)}
                    disabled={loading}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${acc.color}`}
                  >
                    <span className="text-lg">{acc.icon}</span>
                    <span className="truncate">{acc.label}</span>
                    {demoLogging === acc.email && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin ml-auto" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">o ingresa manualmente</span>
              </div>
            </div>

            {/* Email/Password Login */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
                className="space-y-2"
              >
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11"
                    disabled={loading}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
                className="space-y-2"
              >
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={showPassword ? "off" : "on"}
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.15 }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </motion.div>
                    </AnimatePresence>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-[#00695C] to-[#00897B] hover:from-[#005A4E] hover:to-[#00796B] text-white font-medium shadow-md hover:shadow-lg transition-all" disabled={loading}>
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </motion.div>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Iniciar Sesión
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </form>

            {/* Google Login */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              <Button
                variant="outline"
                className="w-full h-11 text-base"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="text-center text-sm text-muted-foreground"
            >
              ¿No tienes cuenta?{" "}
              <button onClick={() => navigate("register")} className="text-primary hover:underline font-medium">
                Regístrate aquí
              </button>
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
