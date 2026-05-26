"use client"

import { useState } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  FileSpreadsheet,
  FileText,
  FileImage,
  Download,
  ChevronLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface DownloadItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  format: string
  endpoint: string
  badge?: string
  badgeColor?: string
}

const DOWNLOAD_ITEMS: DownloadItem[] = [
  {
    id: "products-xlsx",
    title: "Productos (Excel)",
    description: "Exporta todos los productos disponibles en formato Excel (.xlsx) con precios, categorías y vendedores.",
    icon: <FileSpreadsheet className="h-6 w-6" />,
    iconBg: "bg-green-100 dark:bg-green-900/20",
    iconColor: "text-green-600",
    format: "xlsx",
    endpoint: "/api/export?type=products&format=xlsx",
    badge: "Excel",
    badgeColor: "bg-green-600",
  },
  {
    id: "transactions-csv",
    title: "Transacciones (CSV)",
    description: "Descarga el historial de transacciones en formato CSV compatible con cualquier hoja de cálculo.",
    icon: <FileText className="h-6 w-6" />,
    iconBg: "bg-blue-100 dark:bg-blue-900/20",
    iconColor: "text-blue-600",
    format: "csv",
    endpoint: "/api/export?type=transactions&format=csv",
    badge: "CSV",
    badgeColor: "bg-[#2E86C1]",
  },
  {
    id: "transactions-xlsx",
    title: "Transacciones (Excel)",
    description: "Exporta las transacciones en formato Excel (.xlsx) con todos los detalles de pagos y comisiones.",
    icon: <FileSpreadsheet className="h-6 w-6" />,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/20",
    iconColor: "text-emerald-600",
    format: "xlsx",
    endpoint: "/api/export?type=transactions&format=xlsx",
    badge: "Excel",
    badgeColor: "bg-green-600",
  },
  {
    id: "users-csv",
    title: "Usuarios (CSV)",
    description: "Exporta la lista de usuarios registrados con roles, verificación y datos de contacto.",
    icon: <FileText className="h-6 w-6" />,
    iconBg: "bg-purple-100 dark:bg-purple-900/20",
    iconColor: "text-purple-600",
    format: "csv",
    endpoint: "/api/export?type=users&format=csv",
    badge: "Admin",
    badgeColor: "bg-[#C0392B]",
  },
  {
    id: "voucher-pdf",
    title: "Comprobante de Pago (PDF)",
    description: "Descarga el comprobante de una transacción específica en formato PDF para tus registros contables.",
    icon: <FileText className="h-6 w-6" />,
    iconBg: "bg-red-100 dark:bg-red-900/20",
    iconColor: "text-red-600",
    format: "pdf",
    endpoint: "",
    badge: "PDF",
    badgeColor: "bg-[#C0392B]",
  },
  {
    id: "voucher-image",
    title: "Comprobante de Pago (Imagen)",
    description: "Captura el comprobante de pago como imagen PNG para compartir o archivar digitalmente.",
    icon: <FileImage className="h-6 w-6" />,
    iconBg: "bg-orange-100 dark:bg-orange-900/20",
    iconColor: "text-orange-600",
    format: "png",
    endpoint: "",
    badge: "Imagen",
    badgeColor: "bg-[#F4D03F] text-[#1C2833]",
  },
  {
    id: "report-docx",
    title: "Reporte (Word)",
    description: "Genera un reporte detallado en formato Word (.docx) con estadísticas y resumen de la plataforma.",
    icon: <FileText className="h-6 w-6" />,
    iconBg: "bg-indigo-100 dark:bg-indigo-900/20",
    iconColor: "text-indigo-600",
    format: "docx",
    endpoint: "/api/export?type=report&format=docx",
    badge: "Word",
    badgeColor: "bg-indigo-600",
  },
]

export function DownloadsView() {
  const { navigate } = useAppStore()
  const { user, isAuthenticated } = useAuthStore()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [transactionId, setTransactionId] = useState("")

  const handleDownload = async (item: DownloadItem) => {
    if (!isAuthenticated) {
      toast.error("Inicia sesión para descargar archivos")
      navigate("login")
      return
    }

    // Voucher downloads need a transaction ID
    if ((item.id === "voucher-pdf" || item.id === "voucher-image") && !transactionId.trim()) {
      toast.error("Ingresa el ID de transacción para descargar el comprobante")
      return
    }

    setDownloadingId(item.id)

    try {
      if (item.id === "voucher-pdf") {
        // Fetch voucher HTML and trigger download as file
        const res = await fetch(`/api/voucher?transactionId=${transactionId.trim()}`)
        if (res.ok) {
          const html = await res.text()
          const blob = new Blob([html], { type: "text/html" })
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `comprobante-${transactionId.trim().slice(-8)}.html`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          toast.success("Comprobante descargado — ábrelo en tu navegador e imprime como PDF")
        } else {
          const errData = await res.json().catch(() => null)
          toast.error(errData?.error || "No se pudo generar el comprobante")
        }
      } else if (item.id === "voucher-image") {
        // Open voucher in new tab for screenshot/image save
        const voucherUrl = `/api/voucher?transactionId=${transactionId.trim()}`
        window.open(voucherUrl, "_blank")
        toast.success("Comprobante abierto — haz clic derecho → Guardar como imagen")
      } else {
        // Standard file download
        const link = document.createElement("a")
        link.href = item.endpoint
        link.download = ""
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Descargando ${item.title}...`)
      }

      setCompletedIds((prev) => new Set(prev).add(item.id))
      setTimeout(() => {
        setCompletedIds((prev) => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      }, 3000)
    } catch {
      toast.error("Error al descargar el archivo")
    } finally {
      setDownloadingId(null)
    }
  }

  const isAdmin = user?.email === "rey7214935@gmail.com"

  const staggerContainer = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  }

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button variant="ghost" onClick={() => navigate("home")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] flex items-center gap-2">
            <Download className="h-6 w-6 text-primary" />
            Centro de Descargas
          </h1>
          <p className="text-sm text-muted-foreground">
            Exporta datos y descarga comprobantes en múltiples formatos
          </p>
        </div>
      </motion.div>

      {/* Voucher Transaction ID Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">
                  ID de Transacción (para comprobantes)
                </label>
                <Input
                  placeholder="Ingresa el ID de la transacción..."
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-end">
                <Badge variant="secondary" className="rounded-lg whitespace-nowrap">
                  {transactionId ? `${transactionId.slice(-8).toUpperCase()}` : "Sin ID"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Download Cards Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {DOWNLOAD_ITEMS.map((item) => {
          const isDownloading = downloadingId === item.id
          const isCompleted = completedIds.has(item.id)
          const isVoucher = item.id === "voucher-pdf" || item.id === "voucher-image"
          const isRestricted = item.id === "users-csv" && !isAdmin

          return (
            <motion.div key={item.id} variants={staggerItem}>
              <Card className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${item.iconBg} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <span className={item.iconColor}>{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{item.title}</h3>
                        {item.badge && (
                          <Badge className={`text-[10px] px-1.5 py-0 rounded-md ${item.badgeColor}`}>
                            {item.badge}
                          </Badge>
                        )}
                        {isRestricted && (
                          <Badge className="text-[10px] px-1.5 py-0 rounded-md bg-muted text-muted-foreground">
                            <AlertCircle className="h-3 w-3 mr-0.5" /> Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {item.description}
                      </p>
                      <Button
                        size="sm"
                        className="rounded-xl gap-1.5 bg-[#1A5276] hover:bg-[#154360] text-white"
                        disabled={isDownloading || isRestricted || (isVoucher && !transactionId.trim())}
                        onClick={() => handleDownload(item)}
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Descargando...
                          </>
                        ) : isCompleted ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            ¡Listo!
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" />
                            Descargar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Help Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <p className="text-xs text-muted-foreground">
          Los archivos se descargan directamente a tu dispositivo. Los formatos CSV son compatibles con Excel, Google Sheets y LibreOffice Calc.
        </p>
      </motion.div>
    </div>
  )
}
