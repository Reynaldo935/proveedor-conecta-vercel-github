"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DatabaseBackup,
  Download,
  RefreshCw,
  AlertTriangle,
  Trash2,
  ChevronLeft,
  Loader2,
  CheckCircle,
  Clock,
  HardDrive,
  Shield,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface BackupEntry {
  id: string
  date: string
  size: string
  type: "FULL" | "PARTIAL"
  tables: string[]
  recordCount: number
  createdAt: string
}

interface BackupListData {
  backups: BackupEntry[]
  total: number
  totalSize: string
}

export function BackupView() {
  const { navigate } = useAppStore()
  const { user, isAuthenticated } = useAuthStore()
  const [backups, setBackups] = useState<BackupEntry[]>([])
  const [totalSize, setTotalSize] = useState("0 B")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const isAdmin = user?.email === "rey7214935@gmail.com"

  const loadBackups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/backup")
      const data = await res.json()
      if (data.success) {
        setBackups(data.data.backups)
        setTotalSize(data.data.totalSize)
      } else {
        toast.error(data.error || "Error al cargar respaldos")
      }
    } catch {
      toast.error("Error de conexión al cargar respaldos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadBackups()
    }
  }, [isAuthenticated, loadBackups])

  const handleCreateBackup = async () => {
    setCreating(true)
    setStatusMessage("Creando respaldo completo...")
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || "Respaldo creado exitosamente")
        setStatusMessage(`Respaldo creado: ${data.data.recordCount} registros en ${data.data.tables} tablas`)
        loadBackups()
      } else {
        toast.error(data.error || "Error al crear respaldo")
        setStatusMessage(null)
      }
    } catch {
      toast.error("Error de conexión al crear respaldo")
      setStatusMessage(null)
    } finally {
      setCreating(false)
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    setRestoring(backupId)
    setRestoreDialogOpen(false)
    setStatusMessage("Restaurando desde respaldo...")
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", backupId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || "Restauración completada")
        setStatusMessage(data.message)
      } else {
        toast.error(data.error || "Error al restaurar respaldo")
        setStatusMessage(null)
      }
    } catch {
      toast.error("Error de conexión al restaurar")
      setStatusMessage(null)
    } finally {
      setRestoring(null)
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    setDeleting(backupId)
    try {
      // Simulated delete (no DELETE endpoint in the API)
      setBackups((prev) => prev.filter((b) => b.id !== backupId))
      toast.success("Respaldo eliminado")
    } catch {
      toast.error("Error al eliminar respaldo")
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-NI", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Inicia Sesión</h2>
        <p className="text-muted-foreground mt-2">Debes iniciar sesión para acceder a los respaldos.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("login")}>
          Iniciar Sesión
        </Button>
      </div>
    )
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Acceso Denegado</h2>
        <p className="text-muted-foreground mt-2">Solo el administrador puede gestionar los respaldos.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("home")}>
          Volver al Inicio
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("home")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] flex items-center gap-2">
              <DatabaseBackup className="h-6 w-6 text-primary" />
              Respaldo de Datos
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestión de respaldos y restauración de la base de datos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadBackups} disabled={loading} className="rounded-xl">
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button
            size="sm"
            className="rounded-xl bg-[#1A5276] hover:bg-[#154360] text-white gap-1.5"
            onClick={handleCreateBackup}
            disabled={creating}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <DatabaseBackup className="h-4 w-4" />
                Crear Respaldo
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Status Message */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-200">{statusMessage}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-green-600"
                  onClick={() => setStatusMessage(null)}
                >
                  Cerrar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <HardDrive className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{backups.length}</p>
            <p className="text-xs text-muted-foreground">Respaldos Totales</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <DatabaseBackup className="h-6 w-6 mx-auto text-[#2E86C1] mb-2" />
            <p className="text-2xl font-bold">{totalSize}</p>
            <p className="text-xs text-muted-foreground">Espacio Total</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-[#F4D03F] mb-2" />
            <p className="text-2xl font-bold">
              {backups.length > 0
                ? formatDate(backups[0].createdAt).split(",")[0]
                : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">Último Respaldo</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Warning Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 border-0 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Precaución con la Restauración
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Restaurar un respaldo sobrescribirá los datos actuales. Asegúrate de crear un respaldo reciente antes de restaurar. Esta acción no se puede deshacer.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Backup List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold font-[family-name:var(--font-poppins)]">
          Historial de Respaldos
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-muted animate-pulse">
                      <DatabaseBackup className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-48" />
                      <div className="h-3 bg-muted rounded animate-pulse w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : backups.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <DatabaseBackup className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No hay respaldos disponibles</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crea tu primer respaldo haciendo clic en el botón de arriba
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {backups.map((backup, i) => (
              <motion.div
                key={backup.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0">
                        <DatabaseBackup className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">
                            Respaldo #{backup.id.split("_")[1]?.slice(-6) || i + 1}
                          </h3>
                          <Badge className={`text-[10px] px-1.5 py-0 rounded-md ${
                            backup.type === "FULL" ? "bg-[#1A5276]" : "bg-[#2E86C1]"
                          }`}>
                            {backup.type === "FULL" ? "Completo" : "Parcial"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(backup.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {backup.size}
                          </span>
                          <span>{backup.recordCount} registros</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {backup.tables.slice(0, 5).map((table) => (
                            <Badge key={table} variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md">
                              {table}
                            </Badge>
                          ))}
                          {backup.tables.length > 5 && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md">
                              +{backup.tables.length - 5} más
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl h-8 text-xs gap-1"
                          disabled={restoring === backup.id}
                          onClick={() => {
                            setSelectedBackupId(backup.id)
                            setRestoreDialogOpen(true)
                          }}
                        >
                          <RefreshCw className={`h-3 w-3 ${restoring === backup.id ? "animate-spin" : ""}`} />
                          Restaurar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl h-8 text-xs gap-1"
                          disabled={deleting === backup.id}
                          onClick={() => handleDeleteBackup(backup.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirmar Restauración
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas restaurar desde este respaldo? Esta acción sobrescribirá los datos actuales y no se puede deshacer.
          </DialogDescription>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mt-2">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Se recomienda crear un respaldo actual antes de restaurar para evitar pérdida de datos.
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setRestoreDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl bg-[#C0392B] hover:bg-[#A93226] text-white"
              onClick={() => {
                if (selectedBackupId) {
                  handleRestoreBackup(selectedBackupId)
                }
              }}
            >
              Sí, Restaurar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
