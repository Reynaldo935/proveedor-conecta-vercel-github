"use client"

import { useAppStore } from "@/store/app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  CreditCard,
  Wallet,
  DollarSign,
  ChevronLeft,
  ArrowRight,
  Shield,
  Smartphone,
  Building2,
  Globe,
  Lock,
  Eye,
} from "lucide-react"
import { motion } from "framer-motion"

// --- Inline SVG Payment Method Logos ---
function PixelPayLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#6C5CE7" />
      <rect x="8" y="8" width="14" height="14" rx="3" fill="white" opacity="0.9" />
      <rect x="26" y="8" width="14" height="14" rx="3" fill="white" opacity="0.6" />
      <rect x="8" y="26" width="14" height="14" rx="3" fill="white" opacity="0.6" />
      <rect x="26" y="26" width="14" height="14" rx="3" fill="white" opacity="0.3" />
    </svg>
  )
}

function PagaditoLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#00B894" />
      <circle cx="24" cy="20" r="10" fill="white" opacity="0.9" />
      <path d="M17 34 L24 28 L31 34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx="24" cy="20" r="4" fill="#00B894" />
    </svg>
  )
}

function PayPalLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#003087" />
      <path d="M18 36L20 24H16C15.5 24 15 23.5 15.1 23L17 13C17.1 12.4 17.5 12 18.1 12H27C30 12 32 14.5 31.5 17.5C31 20.5 28.5 23 25.5 23H21L20 29H24C24.5 29 25 29.5 24.9 30L24 36H18Z" fill="white" />
      <path d="M24 36L26 24H22L23 18H27C30 18 32 20.5 31.5 23.5C31 26.5 28.5 29 25.5 29H27L26 35C25.9 35.5 25.5 36 25 36H24Z" fill="#0070E0" opacity="0.8" />
    </svg>
  )
}

function GooglePayLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#1A1A2E" />
      <path d="M24 20C25.1 20 26 19.1 26 18C26 16.9 25.1 16 24 16C22.9 16 22 16.9 22 18C22 19.1 22.9 20 24 20Z" fill="#EA4335" />
      <path d="M18 24C19.1 24 20 23.1 20 22C20 20.9 19.1 20 18 20C16.9 20 16 20.9 16 22C16 23.1 16.9 24 18 24Z" fill="#4285F4" />
      <path d="M30 24C31.1 24 32 23.1 32 22C32 20.9 31.1 20 30 20C28.9 20 28 20.9 28 22C28 23.1 28.9 24 30 24Z" fill="#FBBC05" />
      <path d="M24 32C25.1 32 26 31.1 26 30C26 28.9 25.1 28 24 28C22.9 28 22 28.9 22 30C22 31.1 22.9 32 24 32Z" fill="#34A853" />
      <path d="M24 26C25.1 26 26 25.1 26 24C26 22.9 25.1 22 24 22C22.9 22 22 22.9 22 24C22 25.1 22.9 26 24 26Z" fill="white" />
    </svg>
  )
}

function BanproLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#006341" />
      <rect x="10" y="14" width="28" height="20" rx="3" fill="white" opacity="0.15" />
      <path d="M16 18V30H20C23 30 25 28 25 25.5C25 23 23 21 20 21H19V18H16ZM19 23.5H20C21.5 23.5 22 24.5 22 25.5C22 26.5 21.5 27.5 20 27.5H19V23.5Z" fill="white" />
      <path d="M27 18V30H30V25L33 30H36L32.5 24L36 18H33L30 23V18H27Z" fill="white" opacity="0.8" />
    </svg>
  )
}

function BACLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#0033A0" />
      <path d="M14 28L18 18H21L25 28H22L21.5 26H17.5L17 28H14ZM18.2 24H20.8L19.5 20L18.2 24Z" fill="white" />
      <path d="M26 18V28H29V22L32 28H35V18H32V24L29 18H26Z" fill="white" opacity="0.9" />
      <rect x="14" y="31" width="21" height="2" rx="1" fill="#E31837" />
    </svg>
  )
}

function LAFISELogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#0067B1" />
      <path d="M14 30L19 18H22L17 30H14Z" fill="white" />
      <path d="M20 30L25 18H28L23 30H20Z" fill="white" opacity="0.7" />
      <path d="M26 30L31 18H34L29 30H26Z" fill="white" opacity="0.4" />
      <circle cx="36" cy="20" r="3" fill="#F4D03F" />
    </svg>
  )
}

function KashLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#FF6B35" />
      <path d="M16 18H28C30 18 31 19.5 31 21C31 22.5 30 24 28 24H20V26H28C30 26 31 27.5 31 29C31 30.5 30 32 28 32H16V18Z" fill="white" />
      <path d="M20 21V23H27C27.5 23 28 22.5 28 22C28 21.5 27.5 21 27 21H20Z" fill="#FF6B35" />
      <path d="M20 27V29H27C27.5 29 28 28.5 28 28C28 27.5 27.5 27 27 27H20Z" fill="#FF6B35" />
    </svg>
  )
}

function BilleteraLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#8E44AD" />
      <rect x="10" y="16" width="28" height="18" rx="3" fill="white" opacity="0.9" />
      <rect x="28" y="22" width="10" height="7" rx="2" fill="#8E44AD" opacity="0.3" />
      <circle cx="33" cy="25.5" r="2" fill="#8E44AD" />
      <rect x="10" y="14" width="28" height="5" rx="2" fill="white" opacity="0.5" />
    </svg>
  )
}

function WesternUnionLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#FFDD00" />
      <path d="M14 20H20V22H16V24H19V26H16V28H20V30H14V20Z" fill="#1A1A1A" />
      <path d="M22 20H26L28 24L30 20H34V30H30V25L28 28L26 25V30H22V20Z" fill="#1A1A1A" />
    </svg>
  )
}

// --- Logo mapping ---
const PAYMENT_LOGOS: Record<string, React.ReactNode> = {
  PIXELPAY: <PixelPayLogo />,
  PAGADITO: <PagaditoLogo />,
  PAYPAL: <PayPalLogo />,
  GOOGLE_PAY: <GooglePayLogo />,
  BANPRO: <BanproLogo />,
  BANPRO_BILLETERA: <BanproLogo />,
  BAC: <BACLogo />,
  LAFISE: <LAFISELogo />,
  KASH: <KashLogo />,
  BILLETERA: <BilleteraLogo />,
  WESTERN_UNION: <WesternUnionLogo />,
}

// --- Data masking examples ---
const MASKING_EXAMPLES = [
  {
    method: "Tarjeta de Crédito",
    methodId: "card",
    masked: "**** **** **** 1234",
    description: "Solo se muestran los últimos 4 dígitos de la tarjeta",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    method: "Tarjeta de Débito",
    methodId: "debit",
    masked: "**** **** **** 5678",
    description: "Solo se muestran los últimos 4 dígitos de la tarjeta",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    method: "Cuenta Bancaria",
    methodId: "bank",
    masked: "••••••1234",
    description: "Solo se muestran los últimos 4 dígitos de la cuenta",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    method: "Billetera Digital",
    methodId: "wallet",
    masked: "u***@correo.com",
    description: "Se oculta parcialmente el correo vinculado",
    icon: <Wallet className="h-4 w-4" />,
  },
  {
    method: "Número de Teléfono",
    methodId: "phone",
    masked: "+505 ***8 9012",
    description: "Solo se muestran los últimos dígitos del teléfono",
    icon: <Smartphone className="h-4 w-4" />,
  },
  {
    method: "PayPal",
    methodId: "paypal",
    masked: "u***@gmail.com",
    description: "Se oculta parcialmente el correo de PayPal",
    icon: <Globe className="h-4 w-4" />,
  },
]

interface PaymentMethodInfo {
  id: string
  name: string
  emoji: string
  description: string
  fees: string
  currencies: string[]
  type: "digital" | "bank" | "mobile" | "international"
  icon: React.ReactNode
}

const PAYMENT_METHODS_INFO: PaymentMethodInfo[] = [
  {
    id: "PIXELPAY",
    name: "PixelPay",
    emoji: "💳",
    description: "Pasarela de pago digital que acepta tarjetas de crédito y débito. Procesamiento seguro y rápido para compras en línea.",
    fees: "2.5% + C$5 por transacción",
    currencies: ["NIO", "USD"],
    type: "digital",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "PAGADITO",
    name: "Pagadito",
    emoji: "💳",
    description: "Pasarela de pago centroamericana que permite pagos con tarjeta de forma segura. Ampliamente utilizada en la región.",
    fees: "2.8% por transacción",
    currencies: ["NIO", "USD"],
    type: "digital",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "PAYPAL",
    name: "PayPal",
    emoji: "🅿️",
    description: "Plataforma de pagos internacional. Ideal para transacciones en dólares y compras internacionales.",
    fees: "3.5% + $0.30 USD por transacción",
    currencies: ["USD"],
    type: "international",
    icon: <Globe className="h-5 w-5" />,
  },
  {
    id: "GOOGLE_PAY",
    name: "Google Pay",
    emoji: "📱",
    description: "Pago móvil de Google. Rápido y seguro con tu cuenta de Google vinculada.",
    fees: "Sin comisión adicional",
    currencies: ["USD"],
    type: "digital",
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    id: "BANPRO",
    name: "Banpro Transferencia",
    emoji: "🏦",
    description: "Transferencia bancaria directa desde tu cuenta Banpro. Seguro y sin intermediarios.",
    fees: "Sin comisión en la plataforma",
    currencies: ["NIO", "USD"],
    type: "bank",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: "BANPRO_BILLETERA",
    name: "Banpro Billetera",
    emoji: "📱",
    description: "Billetera digital de Banpro. Paga directamente desde la app de Banpro en tu celular.",
    fees: "Sin comisión en la plataforma",
    currencies: ["NIO", "USD"],
    type: "mobile",
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    id: "BAC",
    name: "BAC Credomatic",
    emoji: "🏦",
    description: "Pagos con tarjeta de crédito o débito BAC Credomatic. Acepta Visa y Mastercard.",
    fees: "3% por transacción con tarjeta",
    currencies: ["NIO", "USD"],
    type: "bank",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: "LAFISE",
    name: "LAFISE",
    emoji: "🏦",
    description: "Transferencia o pago con tarjeta LAFISE. Banco regional con presencia en Centroamérica.",
    fees: "1.5% por transferencia",
    currencies: ["NIO", "USD"],
    type: "bank",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: "KASH",
    name: "Kash",
    emoji: "📱",
    description: "Billetera digital nicaragüense. Envía y recibe pagos al instante desde tu teléfono.",
    fees: "1% por transacción",
    currencies: ["NIO"],
    type: "mobile",
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    id: "BILLETERA",
    name: "Billetera Móvil",
    emoji: "📲",
    description: "Pago mediante billetera móvil de operadores locales (Claro, Movistar). Accesible sin cuenta bancaria.",
    fees: "C$5 por transacción",
    currencies: ["NIO"],
    type: "mobile",
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    id: "WESTERN_UNION",
    name: "Western Union",
    emoji: "💸",
    description: "Pago en efectivo a través de Western Union. Ideal para quienes no tienen cuenta bancaria.",
    fees: "Según tarifa Western Union",
    currencies: ["NIO", "USD"],
    type: "international",
    icon: <DollarSign className="h-5 w-5" />,
  },
]

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  digital: { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600", label: "Digital" },
  bank: { bg: "bg-emerald-100 dark:bg-emerald-900/20", text: "text-emerald-600", label: "Bancario" },
  mobile: { bg: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-600", label: "Móvil" },
  international: { bg: "bg-orange-100 dark:bg-orange-900/20", text: "text-orange-600", label: "Internacional" },
}

export function PaymentsView() {
  const { navigate } = useAppStore()

  const staggerContainer = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
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
            <CreditCard className="h-6 w-6 text-primary" />
            Métodos de Pago
          </h1>
          <p className="text-sm text-muted-foreground">
            11 formas de pagar disponibles en Nicaragua
          </p>
        </div>
      </motion.div>

      {/* Commission Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
                  <DollarSign className="h-6 w-6 text-[#F4D03F]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Comisión del 3%</h3>
                  <p className="text-sm text-white/80">
                    Toda transacción en la plataforma tiene una comisión del 3% que se transfiere automáticamente a la cuenta LAFISE del administrador.
                  </p>
                </div>
              </div>
              <Badge className="bg-[#F4D03F] text-[#1C2833] text-sm px-3 py-1 rounded-lg font-bold">
                3%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-3"
      >
        <Card
          className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          onClick={() => navigate("cotizaciones")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F4D03F]/10 group-hover:bg-[#F4D03F]/20 transition-colors">
              <DollarSign className="h-5 w-5 text-[#F4D03F]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Cotizaciones</p>
              <p className="text-xs text-muted-foreground">Solicita cotizaciones a proveedores</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
        <Card
          className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          onClick={() => navigate("checkout")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Checkout</p>
              <p className="text-xs text-muted-foreground">Procesa un pago seguro</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Method Logos Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold font-[family-name:var(--font-poppins)] mb-4">
              Red de Pagos Disponible
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {Object.entries(PAYMENT_LOGOS).map(([id, logo]) => {
                const method = PAYMENT_METHODS_INFO.find((m) => m.id === id)
                const typeInfo = method ? TYPE_COLORS[method.type] : null
                return (
                  <motion.div
                    key={id}
                    whileHover={{ scale: 1.08, y: -2 }}
                    className="flex flex-col items-center gap-1.5 p-2"
                  >
                    <div className={`p-2 rounded-xl ${typeInfo?.bg || "bg-gray-100 dark:bg-gray-800"} transition-colors`}>
                      {logo}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight max-w-[64px]">
                      {method?.name || id}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Methods List */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold font-[family-name:var(--font-poppins)]">
          Métodos Disponibles
        </h2>

        {PAYMENT_METHODS_INFO.map((method) => {
          const typeInfo = TYPE_COLORS[method.type]
          return (
            <motion.div key={method.id} variants={staggerItem}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* SVG Logo + Icon */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="group-hover:scale-110 transition-transform duration-300">
                        {PAYMENT_LOGOS[method.id] || (
                          <div className={`p-3 rounded-xl ${typeInfo.bg}`}>
                            <span className={typeInfo.text}>{method.icon}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm">{method.name}</h3>
                        <Badge className={`text-[10px] px-1.5 py-0 rounded-md ${typeInfo.bg} ${typeInfo.text}`}>
                          {typeInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {method.description}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-xs">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Comisión:</span>
                          <span className="font-medium">{method.fees}</span>
                        </div>
                        <Separator orientation="vertical" className="h-3" />
                        <div className="flex items-center gap-1.5">
                          {method.currencies.map((cur) => (
                            <Badge
                              key={cur}
                              variant="secondary"
                              className="text-[10px] px-1.5"
                            >
                              {cur}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {/* ── PAGAR AHORA button ── */}
                      <Button
                        size="sm"
                        className="mt-3 w-full sm:w-auto gap-1.5 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] hover:from-[#0D3B5E] hover:to-[#1A6FA0] text-white font-semibold shadow-md"
                        onClick={() => {
                          window.open(`/api/payments/redirect?method=${method.id}&amount=0&description=Pago+con+${method.name}`, '_blank')
                        }}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        Pagar con {method.name}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Data Masking Examples Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                <Eye className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm font-[family-name:var(--font-poppins)]">
                  Protección de Datos Financieros
                </h3>
                <p className="text-xs text-muted-foreground">
                  Así es como protegemos tu información de pago
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {MASKING_EXAMPLES.map((example) => (
                <div
                  key={example.methodId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-background shadow-sm flex-shrink-0">
                    {example.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{example.method}</p>
                    <p className="text-[10px] text-muted-foreground">{example.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <code className="text-xs font-mono bg-background px-2.5 py-1.5 rounded-lg border shadow-sm select-all">
                      {example.masked}
                    </code>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Enmascaramiento de datos
                  </p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
                    Tus datos financieros se almacenan con enmascaramiento. Solo tú puedes ver la información completa. Los vendedores y la plataforma solo ven los datos parcialmente ocultos.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Bancos de Nicaragua ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold font-[family-name:var(--font-poppins)]">
                Bancos y Billeteras de Nicaragua
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* BAC */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-orange-200 dark:border-orange-800 h-full"
                  onClick={() => window.open("https://www.baccredomatic.com/es-ni", "_blank")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                        <Building2 className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base">BAC Credomatic</h3>
                        <p className="text-xs text-muted-foreground">Banca personal y empresarial</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* BANPRO */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-emerald-200 dark:border-emerald-800 h-full"
                  onClick={() => window.open("https://www.banprogrupopromerica.com.ni/", "_blank")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                        <Building2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base">BANPRO</h3>
                        <p className="text-xs text-muted-foreground">Grupo Promerica Nicaragua</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* LAFISE */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-blue-200 dark:border-blue-800 h-full"
                  onClick={() => window.open("https://www.lafise.com/", "_blank")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base">LAFISE</h3>
                        <p className="text-xs text-muted-foreground">Banco centroamericano</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Billetera Móvil */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-purple-200 dark:border-purple-800 h-full"
                  onClick={() => window.open("https://www.kash.ni/", "_blank")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                        <Smartphone className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base">Billetera Móvil NI</h3>
                        <p className="text-xs text-muted-foreground">Kash / Pagos móviles Nicaragua</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              * Estos enlaces te redirigen a los sitios oficiales de cada banco/billetera para realizar tus pagos de forma segura.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Tus pagos están protegidos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todas las transacciones se procesan con encriptación SSL de 256 bits. Tus datos financieros nunca se almacenan en nuestros servidores. La comisión del 3% se aplica de forma transparente en cada transacción.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
