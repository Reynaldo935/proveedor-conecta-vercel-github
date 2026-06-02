"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useAuthStore } from "@/store/auth-store"
import { authFetch } from "@/lib/client-auth"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gift,
  Star,
  TrendingUp,
  ArrowDownCircle,
  Clock,
  AlertTriangle,
  Coins,
  History,
  Sparkles,
} from "lucide-react"

interface PointHistoryEntry {
  id: string
  type: "EARN" | "REDEEM" | "EXPIRE" | "BONUS"
  amount: number
  reason: string
  createdAt: string
}

interface LoyaltyData {
  balance: number
  totalEarned: number
  totalRedeemed: number
  expiresAt: string | null
  history: PointHistoryEntry[]
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Star; bgColor: string }> = {
  EARN: { label: "Ganado", color: "text-green-600", icon: TrendingUp, bgColor: "bg-green-50 dark:bg-green-900/20" },
  REDEEM: { label: "Canjeado", color: "text-red-600", icon: ArrowDownCircle, bgColor: "bg-red-50 dark:bg-red-900/20" },
  EXPIRE: { label: "Expirado", color: "text-gray-500", icon: Clock, bgColor: "bg-gray-50 dark:bg-gray-900/20" },
  BONUS: { label: "Bono", color: "text-amber-600", icon: Sparkles, bgColor: "bg-amber-50 dark:bg-amber-900/20" },
}

export function LoyaltyDashboard() {
  const { user, isAuthenticated } = useAuthStore()
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeemAmount, setRedeemAmount] = useState("")
  const [redeeming, setRedeeming] = useState(false)
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false)

  const fetchLoyalty = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await authFetch("/api/loyalty")
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      } else {
        toast.error("Error al cargar puntos de lealtad")
      }
    } catch {
      toast.error("No se pudo conectar. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchLoyalty()
  }, [fetchLoyalty])

  const handleRedeem = async () => {
    const points = parseInt(redeemAmount)
    if (isNaN(points) || points < 100) {
      toast.error("Mínimo 100 puntos para canjear")
      return
    }
    if (data && points > data.balance) {
      toast.error("Puntos insuficientes")
      return
    }

    setRedeeming(true)
    try {
      const res = await authFetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(`¡Canje exitoso! C$${result.data.discountAmount} de descuento`)
        setRedeemAmount("")
        setRedeemDialogOpen(false)
        fetchLoyalty()
      } else {
        toast.error(result.error || "Error al canjear puntos")
      }
    } catch {
      toast.error("No se pudo conectar. Intenta de nuevo.")
    } finally {
      setRedeeming(false)
    }
  }

  const pointsToNextCordoba = data ? 100 - (data.balance % 100) : 100
  const progressToNextCordoba = data ? (data.balance % 100) : 0
  const expiresDate = data?.expiresAt ? new Date(data.expiresAt) : null
  const daysUntilExpiry = expiresDate
    ? Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-NI", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-semibold">Inicia sesión para ver tus puntos</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
        >
          <Gift className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A5276" }}>
            Puntos de Lealtad
          </h1>
          <p className="text-sm text-muted-foreground">
            Gana puntos con cada compra y canjéalos por descuentos
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2" style={{ borderColor: "#2E86C1" }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Saldo Actual
                    </span>
                    <Coins className="h-5 w-5" style={{ color: "#F4D03F" }} />
                  </div>
                  <p className="text-3xl font-bold" style={{ color: "#1A5276" }}>
                    {data?.balance ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    = C${data ? Math.floor(data.balance / 100) : 0} de descuento
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total Ganados
                    </span>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    +{data?.totalEarned ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    1 punto por cada C$1 gastado
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total Canjeados
                    </span>
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-3xl font-bold text-red-500">
                    -{data?.totalRedeemed ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    100 puntos = C$1
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Progress bar + Redeem */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Progress toward next C$1 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progreso al próximo C$1</span>
                    <span className="text-sm font-semibold" style={{ color: "#1A5276" }}>
                      {progressToNextCordoba}/100 puntos
                    </span>
                  </div>
                  <Progress value={progressToNextCordoba} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Te faltan {pointsToNextCordoba} puntos para tu próximo córdoba de descuento
                  </p>
                </div>

                {/* Expiration warning */}
                {isExpiringSoon && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      ¡Tus puntos expiran en {daysUntilExpiry} días! Canjéalos antes del{" "}
                      {expiresDate?.toLocaleDateString("es-NI")}
                    </p>
                  </motion.div>
                )}

                {/* Redeem button */}
                <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full font-semibold"
                      style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
                      disabled={!data || data.balance < 100}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Canjear Puntos
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Canjear Puntos de Lealtad</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="text-center p-4 rounded-lg" style={{ background: "#E8F4FD" }}>
                        <p className="text-sm text-muted-foreground">Saldo disponible</p>
                        <p className="text-3xl font-bold" style={{ color: "#1A5276" }}>
                          {data?.balance ?? 0} puntos
                        </p>
                        <p className="text-sm text-muted-foreground">
                          = C${data ? Math.floor(data.balance / 100) : 0} descuento
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Puntos a canjear (mínimo 100)
                        </label>
                        <Input
                          type="number"
                          min={100}
                          max={data?.balance ?? 0}
                          step={100}
                          value={redeemAmount}
                          onChange={(e) => setRedeemAmount(e.target.value)}
                          placeholder="Ej: 500"
                          className="text-lg"
                          style={{ backgroundColor: "#fff !important", color: "#000 !important" }}
                        />
                        {redeemAmount && parseInt(redeemAmount) >= 100 && (
                          <p className="text-sm mt-2 font-medium" style={{ color: "#2E86C1" }}>
                            Recibirás: C${Math.floor(parseInt(redeemAmount) / 100)} de descuento
                          </p>
                        )}
                      </div>
                      {/* Quick amounts */}
                      <div className="flex gap-2 flex-wrap">
                        {[100, 500, 1000, 2000].map((amt) => (
                          <Button
                            key={amt}
                            variant="outline"
                            size="sm"
                            disabled={!!data && amt > data.balance}
                            onClick={() => setRedeemAmount(String(amt))}
                          >
                            {amt} pts
                          </Button>
                        ))}
                        {data && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRedeemAmount(String(data.balance))}
                          >
                            Todo ({data.balance})
                          </Button>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button
                        onClick={handleRedeem}
                        disabled={
                          redeeming ||
                          !redeemAmount ||
                          parseInt(redeemAmount) < 100 ||
                          (data ? parseInt(redeemAmount) > data.balance : false)
                        }
                        style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
                      >
                        {redeeming ? "Procesando..." : "Canjear"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </motion.div>

          {/* Points History */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" style={{ color: "#1A5276" }} />
                  Historial de Puntos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.history || data.history.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Aún no tienes historial de puntos.
                      <br />
                      ¡Realiza tu primera compra para empezar a ganar!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <AnimatePresence>
                      {data.history.map((entry, i) => {
                        const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.EARN
                        const Icon = config.icon
                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor}`}
                          >
                            <Icon className={`h-4 w-4 ${config.color} shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {entry.reason || config.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(entry.createdAt)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`font-mono font-bold ${config.color}`}
                            >
                              {entry.amount > 0 ? "+" : ""}
                              {entry.amount}
                            </Badge>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}
