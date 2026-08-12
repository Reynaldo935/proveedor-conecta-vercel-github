"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, DollarSign, TrendingUp, TrendingDown, RefreshCw, CreditCard, Building2, Smartphone, Wallet, Globe, Shield, Clock, ArrowRightLeft, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"

interface ExchangeRate {
  currency: string
  code: string
  buyRate: number
  sellRate: number
  change: number
  flag: string
}

const EXCHANGE_RATES: ExchangeRate[] = [
  { currency: "Dólar EE.UU.", code: "USD", buyRate: 36.85, sellRate: 37.15, change: 0.12, flag: "🇺🇸" },
  { currency: "Córdoba", code: "NIO", buyRate: 1.00, sellRate: 1.00, change: 0, flag: "🇳🇮" },
]

const PAYMENT_METHODS = [
  {
    name: "PixelPay",
    type: "Gateway Digital",
    icon: CreditCard,
    description: "Pasarela de pago digital con tarjeta de crédito/débito",
    fee: "3.0% + C$15",
    status: "Activo",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  },
  {
    name: "Pagadito",
    type: "Gateway Regional",
    icon: Globe,
    description: "Pasarela de pagos centroamericana",
    fee: "2.5% + C$10",
    status: "Activo",
    color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  },
  {
    name: "PayPal",
    type: "Gateway Internacional",
    icon: Wallet,
    description: "Pagos internacionales con protección al comprador",
    fee: "4.4% + US$0.30",
    status: "Activo",
    color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  },
  {
    name: "Google Pay",
    type: "Billetera Digital",
    icon: Smartphone,
    description: "Pago rápido con cuenta Google",
    fee: "3.0%",
    status: "Activo",
    color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  },
  {
    name: "Banpro Billetera",
    type: "Banco Nacional",
    icon: Building2,
    description: "Transferencia desde cuenta Banpro",
    fee: "C$25 fijo",
    status: "Activo",
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  },
  {
    name: "BAC Credomatic",
    type: "Banco Regional",
    icon: Building2,
    description: "Transferencia BAC entre cuentas",
    fee: "C$20 fijo",
    status: "Activo",
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  },
  {
    name: "Kash",
    type: "Billetera Digital NI",
    icon: Smartphone,
    description: "Billetera móvil nicaragüense",
    fee: "1.5%",
    status: "Activo",
    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  },
  {
    name: "Transferencia Bancaria",
    type: "Transferencia",
    icon: Building2,
    description: "Transferencia directa entre bancos (BANPRO, BAC, LAFISE, BDF)",
    fee: "Gratis",
    status: "Activo",
    color: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400",
  },
  {
    name: "Western Union",
    type: "Remesas",
    icon: Globe,
    description: "Pago en efectivo vía agente Western Union",
    fee: "Variable",
    status: "Activo",
    color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  },
  {
    name: "Tigo Money",
    type: "Billetera Móvil",
    icon: Smartphone,
    description: "Pago móvil con Tigo Money Nicaragua",
    fee: "2.0%",
    status: "Activo",
    color: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400",
  },
  {
    name: "Efectivo / Contra Entrega",
    type: "Presencial",
    icon: DollarSign,
    description: "Pago en efectivo al momento de la entrega",
    fee: "Gratis",
    status: "Activo",
    color: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400",
  },
]

const CONVERTER_CURRENCIES = ["NIO", "USD", "EUR", "BRL", "MXN", "CRC"]

export function CurrenciesView() {
  const { navigate } = useAppStore()
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString("es-NI"))
  const [converterAmount, setConverterAmount] = useState<string>("1")
  const [converterFrom, setConverterFrom] = useState<string>("USD")
  const [converterTo, setConverterTo] = useState<string>("NIO")
  const [converterResult, setConverterResult] = useState<number | null>(null)

  const handleRefresh = () => {
    setLastUpdate(new Date().toLocaleTimeString("es-NI"))
  }

  const handleConvert = () => {
    const amount = parseFloat(converterAmount)
    if (isNaN(amount) || amount <= 0) {
      setConverterResult(null)
      return
    }
    const fromRate = EXCHANGE_RATES.find((r) => r.code === converterFrom)
    const toRate = EXCHANGE_RATES.find((r) => r.code === converterTo)
    if (!fromRate || !toRate) {
      setConverterResult(null)
      return
    }
    // Convert: FROM currency -> NIO (using buyRate), then NIO -> TO currency (using sellRate)
    const nioAmount = amount * fromRate.buyRate
    const result = nioAmount / toRate.sellRate
    setConverterResult(result)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate("home")}>
          <ChevronLeft className="h-4 w-4 mr-1" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" /> Divisas y Formas de Pago
          </h1>
          <p className="text-sm text-muted-foreground">Tipos de cambio y métodos de pago disponibles en Nicaragua</p>
        </div>
      </div>

      {/* Exchange Rates */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              📊 Tipos de Cambio - {new Date().toLocaleDateString("es-NI")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {lastUpdate}
              </span>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="h-7 text-xs gap-1">
                <RefreshCw className="h-3 w-3" /> Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXCHANGE_RATES.map((rate, i) => (
              <motion.div
                key={rate.code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{rate.flag}</span>
                  <div>
                    <p className="font-medium text-sm">{rate.code}</p>
                    <p className="text-[10px] text-muted-foreground">{rate.currency}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5">
                    {rate.change > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : rate.change < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : null}
                    <span className={`text-[10px] font-medium ${rate.change > 0 ? "text-green-600" : rate.change < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                      {rate.change !== 0 ? `${rate.change > 0 ? "+" : ""}${rate.change}` : "—"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-green-50 dark:bg-green-950/30 rounded p-1.5">
                    <p className="text-[9px] text-muted-foreground uppercase">Compra</p>
                    <p className="font-bold text-sm text-green-700 dark:text-green-400">
                      {rate.code === "NIO" ? "1.00" : rate.buyRate.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/30 rounded p-1.5">
                    <p className="text-[9px] text-muted-foreground uppercase">Venta</p>
                    <p className="font-bold text-sm text-red-700 dark:text-red-400">
                      {rate.code === "NIO" ? "1.00" : rate.sellRate.toFixed(2)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            * Tasas referenciales. Última actualización: {lastUpdate}. Comisión plataforma: 3% automática.
          </p>
        </CardContent>
      </Card>

      {/* Currency Converter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" /> Convertidor de Divisas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Monto</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Ingrese monto"
                  value={converterAmount}
                  onChange={(e) => setConverterAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">De</label>
                <Select value={converterFrom} onValueChange={setConverterFrom}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Moneda origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONVERTER_CURRENCIES.map((code) => {
                      const rate = EXCHANGE_RATES.find((r) => r.code === code)
                      return (
                        <SelectItem key={code} value={code}>
                          {rate?.flag} {code}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">A</label>
                <Select value={converterTo} onValueChange={setConverterTo}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Moneda destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONVERTER_CURRENCIES.map((code) => {
                      const rate = EXCHANGE_RATES.find((r) => r.code === code)
                      return (
                        <SelectItem key={code} value={code}>
                          {rate?.flag} {code}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleConvert} className="w-full">
              <ArrowRightLeft className="h-4 w-4 mr-2" /> Convertir
            </Button>
            {converterResult !== null && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border bg-primary/5 p-4 text-center"
              >
                <p className="text-xs text-muted-foreground mb-1">Resultado</p>
                <p className="text-2xl font-bold">
                  {EXCHANGE_RATES.find((r) => r.code === converterTo)?.flag}{" "}
                  {converterResult.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{" "}
                  {converterTo}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {converterAmount} {converterFrom} = {converterResult.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {converterTo}
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold font-[family-name:var(--font-poppins)]">
            Métodos de Pago Disponibles
          </h2>
          <Badge variant="secondary" className="ml-auto">{PAYMENT_METHODS.length} métodos</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PAYMENT_METHODS.map((method, i) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${method.color}`}>
                      <method.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{method.name}</h3>
                        <Badge variant="outline" className="text-[8px] px-1 py-0">{method.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{method.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-medium">Comisión: {method.fee}</span>
                        <Badge className="text-[8px] bg-green-600">{method.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Commission info */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Comisión de Plataforma: 3%</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                ProveedorConecta cobra una comisión del 3% por cada transacción completada. 
                Esta comisión incluye protección al comprador, validación HMAC-SHA256 de pagos 
                y soporte 24/7. Los pagos se acreditan al vendedor en un máximo de 48 horas hábiles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Bancos de Nicaragua ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold font-[family-name:var(--font-poppins)]">
            Bancos y Billeteras de Nicaragua
          </h2>
          <Badge variant="secondary" className="ml-auto">4 enlaces</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* BAC Credomatic */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-orange-200 dark:border-orange-800 h-full"
              onClick={() => window.open("https://www.baccredomatic.com/es-ni", "_blank")}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                    <Building2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">BAC Credomatic</h3>
                    <p className="text-xs text-muted-foreground">Banca personal y empresarial</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* BANPRO */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-emerald-200 dark:border-emerald-800 h-full"
              onClick={() => window.open("https://www.banprogrupopromerica.com.ni/", "_blank")}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Building2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">BANPRO</h3>
                    <p className="text-xs text-muted-foreground">Grupo Promerica Nicaragua</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* LAFISE */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-blue-200 dark:border-blue-800 h-full"
              onClick={() => window.open("https://www.lafise.com/", "_blank")}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">LAFISE</h3>
                    <p className="text-xs text-muted-foreground">Banco centroamericano</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Billetera Móvil */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-purple-200 dark:border-purple-800 h-full"
              onClick={() => window.open("https://www.kash.ni/", "_blank")}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <Smartphone className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">Billetera Móvil NI</h3>
                    <p className="text-xs text-muted-foreground">Kash / Pagos móviles Nicaragua</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          * Estos enlaces te redirigen a los sitios oficiales de cada banco/billetera para realizar tus pagos de forma segura.
        </p>
      </div>
    </div>
  )
}
