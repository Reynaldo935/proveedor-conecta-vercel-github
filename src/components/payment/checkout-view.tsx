"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import {
  validateCedula,
  validateCardNumber,
  validateCardExpiry,
  validateCVV,
  validateBankAccountByBank,
  validateBilleteraMovil,
  identifyCardType,
  formatCedula,
  formatCardNumber,
  formatPhoneNicaragua,
  PAYMENT_METHODS,
} from "@/lib/validators"
import {
  CreditCard,
  Building2,
  Smartphone,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
  Shield,
  Lock,
  Package,
  PartyPopper,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ProductData {
  id: string
  title: string
  price: number
  discountPrice: number | null
  images: string[]
}

export function CheckoutView() {
  const { selectedProductId, navigate } = useAppStore()
  const { user } = useAuthStore()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    cedula: "",
    fullName: user?.name || "",
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
    accountNumber: "",
    paypalEmail: "",
    phone: "",
  })

  useEffect(() => {
    if (!selectedProductId) return
    fetch(`/api/products/${selectedProductId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProduct(d.data)
      })
      .catch(() => toast.error("Error al cargar producto"))
  }, [selectedProductId])

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)
  const amount = product ? product.discountPrice || product.price : 0

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!paymentMethod) {
      errs.method = "Selecciona un método de pago"
      setErrors(errs)
      return false
    }

    if (["BANPRO", "BAC", "LAFISE", "BILLETERA"].includes(paymentMethod)) {
      if (!formData.fullName.trim()) errs.fullName = "Nombre requerido"
      const cedulaCheck = validateCedula(formData.cedula)
      if (!cedulaCheck.valid) errs.cedula = cedulaCheck.message
    }

    if (["BAC", "LAFISE"].includes(paymentMethod)) {
      const cardCheck = validateCardNumber(formData.cardNumber)
      if (!cardCheck.valid) errs.cardNumber = cardCheck.message
      const expiryCheck = validateCardExpiry(formData.cardExpiry)
      if (!expiryCheck.valid) errs.cardExpiry = expiryCheck.message
      const cvvCheck = validateCVV(formData.cardCVV)
      if (!cvvCheck.valid) errs.cardCVV = cvvCheck.message
    }

    if (["BANPRO", "LAFISE"].includes(paymentMethod)) {
      if (!formData.accountNumber)
        errs.accountNumber = "Número de cuenta requerido"
      else {
        const acctCheck = validateBankAccountByBank(formData.accountNumber, paymentMethod)
        if (!acctCheck.valid) errs.accountNumber = acctCheck.message
      }
    }

    if (paymentMethod === "PAYPAL") {
      if (!formData.paypalEmail.trim())
        errs.paypalEmail = "Email de PayPal requerido"
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.paypalEmail))
        errs.paypalEmail = "Email inválido"
    }

    if (paymentMethod === "BILLETERA") {
      const phoneCheck = validateBilleteraMovil(formData.phone)
      if (!phoneCheck.valid) errs.phone = phoneCheck.message
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePayment = async () => {
    if (!validateForm()) return
    setProcessing(true)

    const cardLast4 = formData.cardNumber
      ? formData.cardNumber.replace(/\D/g, "").slice(-4)
      : ""

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product?.id,
          paymentMethod,
          cedula: formData.cedula,
          cardLast4,
          amount,
          paymentDetails: JSON.stringify({
            fullName: formData.fullName,
            method: paymentMethod,
          }),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCompleted(true)
        toast.success("¡Pago procesado exitosamente!")
      } else {
        toast.error(data.error || "Error al procesar pago")
      }
    } catch {
      toast.error("Error de conexión al procesar pago")
    } finally {
      setProcessing(false)
    }
  }

  if (!product)
    return (
      <div className="text-center py-16">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    )

  // Completed state
  if (completed)
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <Check className="h-12 w-12 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold font-[family-name:var(--font-poppins)] flex items-center justify-center gap-2">
            ¡Pago Exitoso! <PartyPopper className="h-6 w-6" />
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mt-4">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{product.title}</p>
                  <p className="text-lg font-bold text-primary">
                    {formatPrice(amount)}
                  </p>
                </div>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                El vendedor ha sido notificado y recibirás confirmación pronto.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3 justify-center mt-4"
        >
          <Button variant="outline" onClick={() => navigate("buyer-dashboard")}>
            Mis Compras
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => navigate("home")}
          >
            Seguir Comprando
          </Button>
        </motion.div>
      </div>
    )

  // Payment processing overlay
  const ProcessingOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl shadow-2xl p-8 max-w-sm text-center space-y-4 border"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary mx-auto"
        />
        <h3 className="text-lg font-bold">Procesando pago...</h3>
        <p className="text-sm text-muted-foreground">
          Verificando tu información de pago
        </p>
        <div className="space-y-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "linear" }}
            className="h-1 bg-primary rounded-full"
          />
        </div>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" /> Conexión segura encriptada
        </p>
      </motion.div>
    </motion.div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {processing && <ProcessingOverlay />}

      <Button
        variant="ghost"
        onClick={() =>
          navigate("product-detail", { productId: product.id })
        }
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Volver al producto
      </Button>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">
        Checkout
      </h1>

      {/* Order Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              Resumen del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex gap-4">
              <motion.div
                className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0"
                whileHover={{ scale: 1.05 }}
              >
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    📦
                  </div>
                )}
              </motion.div>
              <div className="flex-1">
                <h3 className="font-medium">{product.title}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  {product.discountPrice ? (
                    <>
                      <span className="text-xl font-bold text-volcan">
                        {formatPrice(product.discountPrice)}
                      </span>
                      <span className="line-through text-muted-foreground text-sm">
                        {formatPrice(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="font-medium">Total a pagar</span>
              <motion.span
                key={amount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-primary"
              >
                {formatPrice(amount)}
              </motion.span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Method Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Método de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <motion.div
                    key={m.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <RadioGroupItem
                        value={m.id}
                        id={m.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={m.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === m.id
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-xl">{m.icon}</span>
                        <span className="font-medium text-sm">{m.name}</span>
                        {paymentMethod === m.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto"
                          >
                            <Check className="h-4 w-4 text-primary" />
                          </motion.div>
                        )}
                      </Label>
                    </div>
                  </motion.div>
                ))}
              </div>
            </RadioGroup>
            {errors.method && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.method}
              </p>
            )}

            {/* PayPal Form */}
            <AnimatePresence mode="wait">
              {paymentMethod === "PAYPAL" && (
                <motion.div
                  key="paypal"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 mt-4 p-4 rounded-lg bg-muted/30 border">
                    <h4 className="font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Datos de PayPal
                    </h4>
                    <div className="space-y-2">
                      <Label>Email de PayPal</Label>
                      <Input
                        type="email"
                        placeholder="tu@paypal.com"
                        value={formData.paypalEmail}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            paypalEmail: e.target.value,
                          }))
                        }
                      />
                      {errors.paypalEmail && (
                        <p className="text-xs text-destructive">
                          {errors.paypalEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Banpro Form */}
              {paymentMethod === "BANPRO" && (
                <motion.div
                  key="banpro"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 mt-4 p-4 rounded-lg bg-muted/30 border">
                    <h4 className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Datos de Cuenta Banpro
                    </h4>
                    <div className="space-y-2">
                      <Label>Nombre completo del titular</Label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            fullName: e.target.value,
                          }))
                        }
                        placeholder="Juan Pérez"
                      />
                      {errors.fullName && (
                        <p className="text-xs text-destructive">
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Cédula de identidad</Label>
                      <Input
                        value={formData.cedula}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            cedula: formatCedula(e.target.value),
                          }))
                        }
                        placeholder="001-251285-0001U"
                      />
                      {errors.cedula && (
                        <p className="text-xs text-destructive">
                          {errors.cedula}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Número de cuenta Banpro</Label>
                      <Input
                        value={formData.accountNumber}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            accountNumber: e.target.value,
                          }))
                        }
                        placeholder="100234567890"
                      />
                      {errors.accountNumber && (
                        <p className="text-xs text-destructive">
                          {errors.accountNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* BAC Form */}
              {paymentMethod === "BAC" && (
                <motion.div
                  key="bac"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 mt-4 p-4 rounded-lg bg-muted/30 border">
                    <h4 className="font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Datos de Tarjeta BAC
                      Credomatic
                    </h4>
                    <div className="space-y-2">
                      <Label>Nombre completo</Label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            fullName: e.target.value,
                          }))
                        }
                        placeholder="Juan Pérez"
                      />
                      {errors.fullName && (
                        <p className="text-xs text-destructive">
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Cédula de identidad</Label>
                      <Input
                        value={formData.cedula}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            cedula: formatCedula(e.target.value),
                          }))
                        }
                        placeholder="001-251285-0001U"
                      />
                      {errors.cedula && (
                        <p className="text-xs text-destructive">
                          {errors.cedula}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Número de tarjeta</Label>
                      <Input
                        value={formData.cardNumber}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            cardNumber: formatCardNumber(e.target.value),
                          }))
                        }
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                      />
                      {errors.cardNumber && (
                        <p className="text-xs text-destructive">
                          {errors.cardNumber}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Fecha de expiración</Label>
                        <Input
                          value={formData.cardExpiry}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              cardExpiry: e.target.value,
                            }))
                          }
                          placeholder="MM/AA"
                          maxLength={5}
                        />
                        {errors.cardExpiry && (
                          <p className="text-xs text-destructive">
                            {errors.cardExpiry}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>CVV</Label>
                        <Input
                          type="password"
                          value={formData.cardCVV}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              cardCVV: e.target.value,
                            }))
                          }
                          placeholder="123"
                          maxLength={4}
                        />
                        {errors.cardCVV && (
                          <p className="text-xs text-destructive">
                            {errors.cardCVV}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Lafise Form */}
              {paymentMethod === "LAFISE" && (
                <motion.div
                  key="lafise"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 mt-4 p-4 rounded-lg bg-muted/30 border">
                    <h4 className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Datos de
                      Cuenta/Tarjeta Lafise
                    </h4>
                    <div className="space-y-2">
                      <Label>Nombre completo</Label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            fullName: e.target.value,
                          }))
                        }
                        placeholder="Juan Pérez"
                      />
                      {errors.fullName && (
                        <p className="text-xs text-destructive">
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Cédula de identidad</Label>
                      <Input
                        value={formData.cedula}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            cedula: formatCedula(e.target.value),
                          }))
                        }
                        placeholder="001-251285-0001U"
                      />
                      {errors.cedula && (
                        <p className="text-xs text-destructive">
                          {errors.cedula}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Número de tarjeta o cuenta</Label>
                      <Input
                        value={formData.cardNumber || formData.accountNumber}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            cardNumber: e.target.value,
                            accountNumber: e.target.value,
                          }))
                        }
                        placeholder="Tarjeta o número de cuenta"
                      />
                      {(errors.cardNumber || errors.accountNumber) && (
                        <p className="text-xs text-destructive">
                          {errors.cardNumber || errors.accountNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Billetera Móvil Form */}
              {paymentMethod === "BILLETERA" && (
                <motion.div
                  key="billetera"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 mt-4 p-4 rounded-lg bg-muted/30 border">
                    <h4 className="font-medium flex items-center gap-2">
                      <Smartphone className="h-4 w-4" /> Datos de Billetera
                      Móvil
                    </h4>
                    <div className="space-y-2">
                      <Label>Nombre completo</Label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            fullName: e.target.value,
                          }))
                        }
                        placeholder="Juan Pérez"
                      />
                      {errors.fullName && (
                        <p className="text-xs text-destructive">
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Cédula de identidad</Label>
                      <Input
                        value={formData.cedula}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            cedula: formatCedula(e.target.value),
                          }))
                        }
                        placeholder="001-251285-0001U"
                      />
                      {errors.cedula && (
                        <p className="text-xs text-destructive">
                          {errors.cedula}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Número de teléfono móvil</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            phone: formatPhoneNicaragua(e.target.value),
                          }))
                        }
                        placeholder="8XXX-XXXX"
                      />
                      {errors.phone && (
                        <p className="text-xs text-destructive">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Total & Pay */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium">Total a pagar:</span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(amount)}
              </span>
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
                onClick={handlePayment}
                disabled={processing || !paymentMethod}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  `Pagar ${formatPrice(amount)}`
                )}
              </Button>
            </motion.div>
            <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Tu información está encriptada y protegida
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
