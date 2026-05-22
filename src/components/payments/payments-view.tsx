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
} from "lucide-react"
import { motion } from "framer-motion"

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
                    {/* Icon/Emoji */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className={`p-3 rounded-xl ${typeInfo.bg} group-hover:scale-110 transition-transform duration-300`}>
                        <span className={typeInfo.text}>{method.icon}</span>
                      </div>
                      <span className="text-xl">{method.emoji}</span>
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
                              className="text-[10px] px-1.5 py-0 rounded-md"
                            >
                              {cur}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
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
