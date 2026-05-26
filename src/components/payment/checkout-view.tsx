"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { authFetch } from "@/lib/client-auth"
import {
  validateCedula,
  validateCardNumber,
  validateCardExpiry,
  validateCVV,
  validateBankAccountByBank,
  validateBilleteraMovil,
  validateKashPhone,
  validateWesternUnionRef,
  identifyCardType,
  formatCedula,
  formatCardNumber,
  formatPhoneNicaragua,
  formatCardExpiry,
  formatCVV,
  maskCardNumber,
  maskAccountNumber,
  maskPhone,
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
  Lock,
  Package,
  PartyPopper,
  Wallet,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types ───────────────────────────────────────────────────────────

interface ProductData {
  id: string
  title: string
  price: number
  discountPrice: number | null
  images: string[]
}

interface FormState {
  fullName: string
  cedula: string
  cardNumber: string
  cardExpiry: string
  cardCVV: string
  accountNumber: string
  paypalEmail: string
  phone: string
  westernRef: string
}

type FieldKey = keyof FormState

// ─── Helpers ─────────────────────────────────────────────────────────

const CARD_METHODS = new Set(["BAC", "PIXELPAY", "PAGADITO"])
const BANK_METHODS = new Set(["BANPRO", "LAFISE"])
const WALLET_METHODS = new Set(["BILLETERA", "BANPRO_BILLETERA", "KASH"])
const DIGITAL_METHODS = new Set(["PAYPAL", "GOOGLE_PAY"])

function needsName(m: string) {
  return (
    BANK_METHODS.has(m) ||
    WALLET_METHODS.has(m) ||
    CARD_METHODS.has(m) ||
    m === "WESTERN_UNION"
  )
}
function needsCedula(m: string) {
  return needsName(m)
}
function needsCard(m: string) {
  return CARD_METHODS.has(m)
}
function needsBankAccount(m: string) {
  return BANK_METHODS.has(m)
}
function needsPhone(m: string) {
  return WALLET_METHODS.has(m)
}
function needsEmail(m: string) {
  return DIGITAL_METHODS.has(m)
}

// ─── Confetti Particle ───────────────────────────────────────────────

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const x = Math.random() * 400 - 200
  const y = -(Math.random() * 600 + 200)
  const r = Math.random() * 360

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color, left: "50%", top: "50%" }}
      initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
      animate={{ x, y, rotate: r, opacity: 0 }}
      transition={{ duration: 2 + Math.random(), delay, ease: "easeOut" }}
    />
  )
}

const CONFETTI_COLORS = [
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
]

function ConfettiBurst() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => (
        <ConfettiParticle
          key={i}
          delay={i * 0.03}
          color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
        />
      ))}
    </div>
  )
}

// ─── Validation Field Helper ─────────────────────────────────────────

function ValidationMessage({
  error,
  valid,
}: {
  error?: string
  valid?: boolean
}) {
  if (!error && valid === undefined) return null
  if (valid && !error) {
    return (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1"
      >
        <Check className="h-3 w-3" /> Válido
      </motion.p>
    )
  }
  if (error) {
    return (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-destructive flex items-center gap-1 mt-1"
      >
        <AlertCircle className="h-3 w-3" /> {error}
      </motion.p>
    )
  }
  return null
}

// ─── Main Component ──────────────────────────────────────────────────

export function CheckoutView() {
  const { selectedProductId, navigate } = useAppStore()
  const { user, setUser } = useAuthStore()

  const [product, setProduct] = useState<ProductData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showCVV, setShowCVV] = useState(false)
  const [touched, setTouched] = useState<Set<FieldKey>>(new Set())
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>(
    {}
  )
  const [fieldValid, setFieldValid] = useState<
    Partial<Record<FieldKey, boolean>>
  >({})
  const [formData, setFormData] = useState<FormState>({
    fullName: user?.name || "",
    cedula: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
    accountNumber: "",
    paypalEmail: "",
    phone: "",
    westernRef: "",
  })

  // ── Load product ─────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedProductId) return
    fetch(`/api/products/${selectedProductId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProduct(d.data)
      })
      .catch(() => toast.error("Error al cargar producto"))
  }, [selectedProductId])

  // ── Price formatting ─────────────────────────────────────────────

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(p)

  const amount = product ? product.discountPrice || product.price : 0
  const userBalance = user?.balance ?? 50000
  const hasSufficientFunds = userBalance >= amount

  // ── Card type detection ──────────────────────────────────────────

  const cardType = useMemo(() => {
    if (!formData.cardNumber) return null
    const cleaned = formData.cardNumber.replace(/\D/g, "")
    if (cleaned.length < 1) return null
    return identifyCardType(formData.cardNumber)
  }, [formData.cardNumber])

  // ── Real-time field validation ───────────────────────────────────

  const validateField = useCallback(
    (field: FieldKey, value: string, method: string) => {
      let error = ""
      let valid = false

      switch (field) {
        case "fullName":
          if (!value.trim()) {
            error = "Nombre completo requerido"
          } else {
            valid = true
          }
          break

        case "cedula": {
          if (!value.trim()) {
            error = "Cédula requerida"
          } else {
            const check = validateCedula(value)
            if (!check.valid) error = check.message
            else valid = true
          }
          break
        }

        case "cardNumber": {
          if (!value.trim()) {
            error = "Número de tarjeta requerido"
          } else {
            const cleaned = value.replace(/\D/g, "")
            if (cleaned.length < 16) {
              error = `Faltan ${16 - cleaned.length} dígitos`
            } else {
              const check = validateCardNumber(value)
              if (!check.valid) error = check.message
              else valid = true
            }
          }
          break
        }

        case "cardExpiry": {
          if (!value.trim()) {
            error = "Fecha requerida"
          } else {
            const check = validateCardExpiry(value)
            if (!check.valid) error = check.message
            else valid = true
          }
          break
        }

        case "cardCVV": {
          if (!value.trim()) {
            error = "CVV requerido"
          } else {
            const check = validateCVV(value)
            if (!check.valid) error = check.message
            else valid = true
          }
          break
        }

        case "accountNumber": {
          if (method === "WESTERN_UNION") {
            // Not used for WU — use westernRef instead
            break
          }
          if (!value.trim()) {
            error = "Número de cuenta requerido"
          } else {
            const check = validateBankAccountByBank(value, method)
            if (!check.valid) error = check.message
            else valid = true
          }
          break
        }

        case "paypalEmail": {
          if (!value.trim()) {
            error = "Email requerido"
          } else if (
            !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
          ) {
            error = "Email inválido"
          } else {
            valid = true
          }
          break
        }

        case "phone": {
          if (!value.trim()) {
            error = "Teléfono requerido"
          } else {
            const check =
              method === "KASH"
                ? validateKashPhone(value)
                : validateBilleteraMovil(value)
            if (!check.valid) error = check.message
            else valid = true
          }
          break
        }

        case "westernRef": {
          if (!value.trim()) {
            error = "Número de referencia requerido"
          } else {
            const check = validateWesternUnionRef(value)
            if (!check.valid) error = check.message
            else valid = true
          }
          break
        }
      }

      return { error, valid }
    },
    []
  )

  // ── Update field with validation ─────────────────────────────────

  const updateField = useCallback(
    (field: FieldKey, rawValue: string, formattedValue?: string) => {
      const val = formattedValue ?? rawValue
      setFormData((prev) => ({ ...prev, [field]: val }))

      if (touched.has(field)) {
        const { error, valid } = validateField(field, val, paymentMethod)
        setErrors((prev) => ({ ...prev, [field]: error }))
        setFieldValid((prev) => ({ ...prev, [field]: valid }))
      }
    },
    [touched, paymentMethod, validateField]
  )

  // ── Blur handler — mark as touched and validate ──────────────────

  const handleBlur = useCallback(
    (field: FieldKey) => {
      setTouched((prev) => new Set(prev).add(field))
      const { error, valid } = validateField(
        field,
        formData[field],
        paymentMethod
      )
      setErrors((prev) => ({ ...prev, [field]: error }))
      setFieldValid((prev) => ({ ...prev, [field]: valid }))
    },
    [formData, paymentMethod, validateField]
  )

  // ── Reset form on method change ──────────────────────────────────

  const handleMethodChange = useCallback(
    (method: string) => {
      setPaymentMethod(method)
      setErrors({})
      setFieldValid({})
      setTouched(new Set())
    },
    []
  )

  // ── Full form validation ─────────────────────────────────────────

  const validateForm = useCallback((): boolean => {
    const errs: Partial<Record<FieldKey, string>> = {}
    const valids: Partial<Record<FieldKey, boolean>> = {}
    const allTouched = new Set(touched)

    if (!paymentMethod) {
      toast.error("Selecciona un método de pago")
      return false
    }

    // Full name
    if (needsName(paymentMethod)) {
      allTouched.add("fullName")
      const r = validateField("fullName", formData.fullName, paymentMethod)
      if (r.error) errs.fullName = r.error
      else valids.fullName = true
    }

    // Cédula
    if (needsCedula(paymentMethod)) {
      allTouched.add("cedula")
      const r = validateField("cedula", formData.cedula, paymentMethod)
      if (r.error) errs.cedula = r.error
      else valids.cedula = true
    }

    // Card fields
    if (needsCard(paymentMethod)) {
      allTouched.add("cardNumber")
      const cn = validateField("cardNumber", formData.cardNumber, paymentMethod)
      if (cn.error) errs.cardNumber = cn.error
      else valids.cardNumber = true

      allTouched.add("cardExpiry")
      const ce = validateField(
        "cardExpiry",
        formData.cardExpiry,
        paymentMethod
      )
      if (ce.error) errs.cardExpiry = ce.error
      else valids.cardExpiry = true

      allTouched.add("cardCVV")
      const cv = validateField("cardCVV", formData.cardCVV, paymentMethod)
      if (cv.error) errs.cardCVV = cv.error
      else valids.cardCVV = true
    }

    // Bank account
    if (needsBankAccount(paymentMethod)) {
      allTouched.add("accountNumber")
      const r = validateField(
        "accountNumber",
        formData.accountNumber,
        paymentMethod
      )
      if (r.error) errs.accountNumber = r.error
      else valids.accountNumber = true
    }

    // Phone (wallets)
    if (needsPhone(paymentMethod)) {
      allTouched.add("phone")
      const r = validateField("phone", formData.phone, paymentMethod)
      if (r.error) errs.phone = r.error
      else valids.phone = true
    }

    // Email (digital wallets)
    if (needsEmail(paymentMethod)) {
      allTouched.add("paypalEmail")
      const r = validateField(
        "paypalEmail",
        formData.paypalEmail,
        paymentMethod
      )
      if (r.error) errs.paypalEmail = r.error
      else valids.paypalEmail = true
    }

    // Western Union reference
    if (paymentMethod === "WESTERN_UNION") {
      allTouched.add("fullName")
      const fn = validateField("fullName", formData.fullName, paymentMethod)
      if (fn.error) errs.fullName = fn.error
      else valids.fullName = true

      allTouched.add("cedula")
      const cd = validateField("cedula", formData.cedula, paymentMethod)
      if (cd.error) errs.cedula = cd.error
      else valids.cedula = true

      allTouched.add("westernRef")
      const wr = validateField(
        "westernRef",
        formData.westernRef,
        paymentMethod
      )
      if (wr.error) errs.westernRef = wr.error
      else valids.westernRef = true
    }

    setTouched(allTouched)
    setErrors(errs)
    setFieldValid(valids)
    return Object.keys(errs).length === 0
  }, [paymentMethod, formData, touched, validateField])

  // ── Handle payment submission ────────────────────────────────────

  const handlePayment = useCallback(async () => {
    if (!validateForm()) return

    if (!hasSufficientFunds) {
      toast.error(
        "💸 Sin fondos — Tu saldo es de " +
          formatPrice(userBalance) +
          " y necesitas " +
          formatPrice(amount) +
          ". Recarga tu cuenta desde Mi Perfil.",
        { duration: 6000 }
      )
      return
    }

    setProcessing(true)

    const cardLast4 = formData.cardNumber
      ? formData.cardNumber.replace(/\D/g, "").slice(-4)
      : formData.accountNumber
        ? formData.accountNumber.replace(/\D/g, "").slice(-4)
        : formData.phone
          ? formData.phone.replace(/\D/g, "").slice(-4)
          : ""

    try {
      const res = await authFetch("/api/transactions", {
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
            maskedCard:
              needsCard(paymentMethod) && formData.cardNumber
                ? maskCardNumber(formData.cardNumber)
                : needsBankAccount(paymentMethod) && formData.accountNumber
                  ? maskAccountNumber(formData.accountNumber)
                  : needsPhone(paymentMethod) && formData.phone
                    ? maskPhone(formData.phone)
                    : undefined,
          }),
        }),
      })
      const data = await res.json()

      if (data.success) {
        // Update user balance in store if returned
        if (data.data && user) {
          const newBalance = userBalance - amount
          setUser({ ...user, balance: newBalance })
        }
        setCompleted(true)
        toast.success("¡Pago procesado exitosamente!")
      } else {
        if (data.errorCode === "INSUFFICIENT_FUNDS") {
          toast.error(
            "💸 Sin fondos — Dinero insuficiente en tu cuenta. Recarga o intenta con otro método de pago.",
            { duration: 6000 }
          )
        } else if (data.errorCode === "BANK_DECLINED") {
          toast.error(
            "🏦 Transacción rechazada por el banco. Verifica tus datos e intenta de nuevo.",
            { duration: 6000 }
          )
        } else {
          toast.error(data.error || "Error al procesar pago")
        }
      }
    } catch {
      toast.error("Error de conexión al procesar pago")
    } finally {
      setProcessing(false)
    }
  }, [
    validateForm,
    hasSufficientFunds,
    userBalance,
    amount,
    formatPrice,
    formData,
    paymentMethod,
    product,
    user,
    setUser,
    needsCard,
    needsBankAccount,
    needsPhone,
  ])

  // ── Loading state ────────────────────────────────────────────────

  if (!product)
    return (
      <div className="text-center py-16">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    )

  // ── Success state ────────────────────────────────────────────────

  if (completed)
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4 relative">
        <ConfettiBurst />

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
          <p className="text-muted-foreground mt-1">
            Tu transacción ha sido procesada correctamente
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mt-4">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold">{product.title}</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(amount)}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método de pago</span>
                  <span className="font-medium">
                    {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.name ||
                      paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo restante</span>
                  <span className="font-medium">
                    {formatPrice(Math.max(0, userBalance - amount))}
                  </span>
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
          className="flex gap-3 justify-center mt-6"
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

  // ── Processing overlay ───────────────────────────────────────────

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
            transition={{ duration: 2.5, ease: "linear" }}
            className="h-1.5 bg-gradient-to-r from-primary to-primary/60 rounded-full"
          />
        </div>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" /> Conexión segura encriptada
        </p>
      </motion.div>
    </motion.div>
  )

  // ── Shared field input helper ────────────────────────────────────

  const FieldInput = ({
    field,
    label,
    placeholder,
    type = "text",
    maxLength,
    icon,
    formatValue,
    rightElement,
  }: {
    field: FieldKey
    label: string
    placeholder: string
    type?: string
    maxLength?: number
    icon?: React.ReactNode
    formatValue?: (v: string) => string
    rightElement?: React.ReactNode
  }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {icon ? (
          <span className="inline-flex items-center gap-1.5">
            {icon} {label}
          </span>
        ) : (
          label
        )}
      </Label>
      <div className="relative">
        <Input
          type={type}
          placeholder={placeholder}
          value={formData[field]}
          maxLength={maxLength}
          onChange={(e) => {
            const formatted = formatValue
              ? formatValue(e.target.value)
              : e.target.value
            updateField(field, e.target.value, formatted)
          }}
          onBlur={() => handleBlur(field)}
          className={
            errors[field]
              ? "border-destructive focus-visible:ring-destructive"
              : fieldValid[field]
                ? "border-green-500 focus-visible:ring-green-500"
                : ""
          }
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      <ValidationMessage error={errors[field]} valid={fieldValid[field]} />
    </div>
  )

  // ── Dynamic payment form ─────────────────────────────────────────

  const renderPaymentForm = () => {
    if (!paymentMethod) return null

    const methodMeta = PAYMENT_METHODS.find((m) => m.id === paymentMethod)

    const formContent = (
      <div className="space-y-4">
        {/* Full name */}
        {needsName(paymentMethod) && (
          <FieldInput
            field="fullName"
            label="Nombre completo del titular"
            placeholder="Juan Pérez"
          />
        )}

        {/* Cédula */}
        {needsCedula(paymentMethod) && (
          <FieldInput
            field="cedula"
            label="Cédula de identidad"
            placeholder="001-251285-0001U"
            formatValue={formatCedula}
            icon={<Badge variant="outline" className="text-[10px] px-1 py-0">NI</Badge>}
          />
        )}

        {/* Card number — for card methods */}
        {needsCard(paymentMethod) && (
          <>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                Número de tarjeta
                {cardType && cardType.type !== "UNKNOWN" && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Badge
                      className={`text-[10px] ${
                        cardType.type === "VISA"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : cardType.type === "MASTERCARD"
                            ? "bg-orange-500 hover:bg-orange-600 text-white"
                            : cardType.type === "AMEX"
                              ? "bg-blue-400 hover:bg-blue-500 text-white"
                              : "bg-gray-500 hover:bg-gray-600 text-white"
                      }`}
                    >
                      {cardType.brand}
                    </Badge>
                  </motion.span>
                )}
              </Label>
              <div className="relative">
                <Input
                  placeholder="4242 4242 4242 4242"
                  value={formData.cardNumber}
                  maxLength={19}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value)
                    updateField("cardNumber", e.target.value, formatted)
                  }}
                  onBlur={() => handleBlur("cardNumber")}
                  className={
                    errors.cardNumber
                      ? "border-destructive focus-visible:ring-destructive"
                      : fieldValid.cardNumber
                        ? "border-green-500 focus-visible:ring-green-500"
                        : ""
                  }
                />
                {fieldValid.cardNumber && formData.cardNumber && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {maskCardNumber(formData.cardNumber)}
                    </Badge>
                  </motion.div>
                )}
              </div>
              <ValidationMessage
                error={errors.cardNumber}
                valid={fieldValid.cardNumber}
              />
            </div>

            {/* Expiry + CVV row */}
            <div className="grid grid-cols-2 gap-4">
              <FieldInput
                field="cardExpiry"
                label="Fecha de expiración"
                placeholder="MM/AA"
                maxLength={5}
                formatValue={formatCardExpiry}
              />
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">CVV</Label>
                <div className="relative">
                  <Input
                    type={showCVV ? "text" : "password"}
                    placeholder="123"
                    value={formData.cardCVV}
                    maxLength={3}
                    onChange={(e) => {
                      const formatted = formatCVV(e.target.value)
                      updateField("cardCVV", e.target.value, formatted)
                    }}
                    onBlur={() => handleBlur("cardCVV")}
                    className={
                      errors.cardCVV
                        ? "border-destructive focus-visible:ring-destructive pr-10"
                        : fieldValid.cardCVV
                          ? "border-green-500 focus-visible:ring-green-500 pr-10"
                          : "pr-10"
                    }
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowCVV((v) => !v)}
                    aria-label={showCVV ? "Ocultar CVV" : "Mostrar CVV"}
                  >
                    {showCVV ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <ValidationMessage
                  error={errors.cardCVV}
                  valid={fieldValid.cardCVV}
                />
              </div>
            </div>
          </>
        )}

        {/* Bank account — for bank transfer methods */}
        {needsBankAccount(paymentMethod) && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Número de cuenta {paymentMethod === "BANPRO" ? "Banpro" : "LAFISE"}
            </Label>
            <div className="relative">
              <Input
                placeholder="Ej: 100234567"
                value={formData.accountNumber}
                onChange={(e) =>
                  updateField("accountNumber", e.target.value)
                }
                onBlur={() => handleBlur("accountNumber")}
                className={
                  errors.accountNumber
                    ? "border-destructive focus-visible:ring-destructive"
                    : fieldValid.accountNumber
                      ? "border-green-500 focus-visible:ring-green-500"
                      : ""
                }
              />
              {fieldValid.accountNumber && formData.accountNumber && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {maskAccountNumber(formData.accountNumber)}
                  </Badge>
                </motion.div>
              )}
            </div>
            <ValidationMessage
              error={errors.accountNumber}
              valid={fieldValid.accountNumber}
            />
          </div>
        )}

        {/* LAFISE also shows card fields */}
        {paymentMethod === "LAFISE" && (
          <>
            <Separator className="my-2" />
            <p className="text-xs text-muted-foreground">
              También puedes pagar con tarjeta Lafise:
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                Número de tarjeta
                {cardType && cardType.type !== "UNKNOWN" && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <Badge
                      className={`text-[10px] ${
                        cardType.type === "VISA"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : cardType.type === "MASTERCARD"
                            ? "bg-orange-500 hover:bg-orange-600 text-white"
                            : "bg-gray-500 hover:bg-gray-600 text-white"
                      }`}
                    >
                      {cardType.brand}
                    </Badge>
                  </motion.span>
                )}
              </Label>
              <div className="relative">
                <Input
                  placeholder="4242 4242 4242 4242"
                  value={formData.cardNumber}
                  maxLength={19}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value)
                    updateField("cardNumber", e.target.value, formatted)
                  }}
                  onBlur={() => handleBlur("cardNumber")}
                  className={
                    errors.cardNumber
                      ? "border-destructive focus-visible:ring-destructive"
                      : fieldValid.cardNumber
                        ? "border-green-500 focus-visible:ring-green-500"
                        : ""
                  }
                />
                {fieldValid.cardNumber && formData.cardNumber && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-mono"
                    >
                      {maskCardNumber(formData.cardNumber)}
                    </Badge>
                  </motion.div>
                )}
              </div>
              <ValidationMessage
                error={errors.cardNumber}
                valid={fieldValid.cardNumber}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldInput
                field="cardExpiry"
                label="Fecha de expiración"
                placeholder="MM/AA"
                maxLength={5}
                formatValue={formatCardExpiry}
              />
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">CVV</Label>
                <div className="relative">
                  <Input
                    type={showCVV ? "text" : "password"}
                    placeholder="123"
                    value={formData.cardCVV}
                    maxLength={3}
                    onChange={(e) => {
                      const formatted = formatCVV(e.target.value)
                      updateField("cardCVV", e.target.value, formatted)
                    }}
                    onBlur={() => handleBlur("cardCVV")}
                    className={
                      errors.cardCVV
                        ? "border-destructive focus-visible:ring-destructive pr-10"
                        : fieldValid.cardCVV
                          ? "border-green-500 focus-visible:ring-green-500 pr-10"
                          : "pr-10"
                    }
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowCVV((v) => !v)}
                    aria-label={showCVV ? "Ocultar CVV" : "Mostrar CVV"}
                  >
                    {showCVV ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <ValidationMessage
                  error={errors.cardCVV}
                  valid={fieldValid.cardCVV}
                />
              </div>
            </div>
          </>
        )}

        {/* Phone — for wallet methods */}
        {needsPhone(paymentMethod) && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Número de teléfono móvil
            </Label>
            <div className="relative">
              <Input
                placeholder="8XXX-XXXX"
                value={formData.phone}
                maxLength={9}
                onChange={(e) => {
                  const formatted = formatPhoneNicaragua(e.target.value)
                  updateField("phone", e.target.value, formatted)
                }}
                onBlur={() => handleBlur("phone")}
                className={
                  errors.phone
                    ? "border-destructive focus-visible:ring-destructive"
                    : fieldValid.phone
                      ? "border-green-500 focus-visible:ring-green-500"
                      : ""
                }
              />
              {fieldValid.phone && formData.phone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {maskPhone(formData.phone)}
                  </Badge>
                </motion.div>
              )}
            </div>
            <ValidationMessage error={errors.phone} valid={fieldValid.phone} />
          </div>
        )}

        {/* Email — for digital methods */}
        {needsEmail(paymentMethod) && (
          <FieldInput
            field="paypalEmail"
            label={
              paymentMethod === "PAYPAL"
                ? "Email de PayPal"
                : "Email de Google Pay"
            }
            placeholder={
              paymentMethod === "PAYPAL" ? "tu@paypal.com" : "tu@gmail.com"
            }
            type="email"
          />
        )}

        {/* Western Union reference */}
        {paymentMethod === "WESTERN_UNION" && (
          <FieldInput
            field="westernRef"
            label="Número de referencia"
            placeholder="Ej: 1234567890"
          />
        )}

        {/* Extra info for specific methods */}
        {paymentMethod === "GOOGLE_PAY" && (
          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Se abrirá Google Pay para confirmar el pago de forma segura.
          </p>
        )}
        {paymentMethod === "WESTERN_UNION" && (
          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Ingresa el número de referencia que recibiste al realizar el giro
            por Western Union.
          </p>
        )}
      </div>
    )

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={paymentMethod}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="mt-4 p-4 sm:p-5 rounded-xl bg-muted/30 border space-y-1"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{methodMeta?.icon}</span>
            <h4 className="font-semibold text-sm">{methodMeta?.name}</h4>
            <Badge
              variant="outline"
              className="text-[10px] capitalize ml-auto"
            >
              {methodMeta?.type === "card"
                ? "Tarjeta"
                : methodMeta?.type === "bank"
                  ? "Transferencia"
                  : methodMeta?.type === "wallet"
                    ? "Billetera"
                    : methodMeta?.type === "digital"
                      ? "Digital"
                      : "Giro"}
            </Badge>
          </div>
          {formContent}
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── Main render ──────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {processing && <ProcessingOverlay />}

      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          navigate("product-detail", { productId: product.id })
        }
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Volver al producto
      </Button>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">
        Checkout
      </h1>

      {/* ─── Order Summary Card ──────────────────────────────────── */}
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
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{product.title}</h3>
                <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                  {product.discountPrice ? (
                    <>
                      <span className="text-xl font-bold text-primary">
                        {formatPrice(product.discountPrice)}
                      </span>
                      <span className="line-through text-muted-foreground text-sm">
                        {formatPrice(product.price)}
                      </span>
                      <Badge className="bg-green-600 text-[10px]">
                        -
                        {Math.round(
                          ((product.price - product.discountPrice) /
                            product.price) *
                            100
                        )}
                        %
                      </Badge>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

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

            {/* ─── Balance Check ────────────────────────────────── */}
            <div
              className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                hasSufficientFunds
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              }`}
            >
              <Wallet className="h-4 w-4 flex-shrink-0" />
              <span>
                Tu saldo:{" "}
                <strong>{formatPrice(userBalance)}</strong>
              </span>
              {!hasSufficientFunds && (
                <span className="ml-auto font-semibold text-right">
                  💸 Sin fondos — Dinero insuficiente
                </span>
              )}
              {hasSufficientFunds && (
                <span className="ml-auto text-xs">
                  Saldo después:{" "}
                  <strong>{formatPrice(userBalance - amount)}</strong>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Payment Method Selection ────────────────────────────── */}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const isSelected = paymentMethod === m.id
                return (
                  <motion.button
                    key={m.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleMethodChange(m.id)}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/30 hover:bg-muted/30"
                    }`}
                    aria-label={`Método de pago: ${m.name}`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="font-medium text-xs leading-tight">
                      {m.name}
                    </span>
                    <Badge
                      className={`text-[8px] bg-gradient-to-r ${m.color} text-white border-0 px-1.5 py-0`}
                    >
                      {m.type === "card"
                        ? "Tarjeta"
                        : m.type === "bank"
                          ? "Banco"
                          : m.type === "wallet"
                            ? "Móvil"
                            : m.type === "digital"
                              ? "Digital"
                              : "Giro"}
                    </Badge>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Dynamic payment form */}
            {renderPaymentForm()}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Sin Fondos Error Block ──────────────────────────────── */}
      {!hasSufficientFunds && paymentMethod && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">💸</span>
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300">
                    Sin fondos — Dinero insuficiente
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Tu saldo actual es de{" "}
                    <strong>{formatPrice(userBalance)}</strong> y necesitas{" "}
                    <strong>{formatPrice(amount)}</strong>. Recarga tu cuenta
                    desde Mi Perfil o intenta con otro método de pago.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
                    onClick={() => navigate("profile")}
                  >
                    Ir a Mi Perfil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Pay Button ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Button
          size="lg"
          className="w-full text-lg py-6 relative overflow-hidden"
          disabled={!paymentMethod || processing || !hasSufficientFunds}
          onClick={handlePayment}
        >
          {!hasSufficientFunds ? (
            <span className="flex items-center gap-2">
              💸 Sin fondos — No se puede procesar
            </span>
          ) : processing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Procesando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Pagar {formatPrice(amount)} con{" "}
              {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.name ||
                "método seleccionado"}
              <ArrowRight className="h-5 w-5" />
            </span>
          )}
        </Button>
      </motion.div>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pb-4">
        <Lock className="h-3 w-3" />
        <span>
          Pago seguro con encriptación SSL — ProveedorConecta Nicaragua
        </span>
      </div>
    </div>
  )
}
