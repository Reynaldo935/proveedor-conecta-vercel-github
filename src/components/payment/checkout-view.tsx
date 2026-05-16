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
import { validateCedula, validateCardNumber, validateCardExpiry, validateCVV, validateBankAccount, validatePhoneNicaragua, formatCedula, formatCardNumber, formatPhoneNicaragua, PAYMENT_METHODS } from "@/lib/validators"
import { CreditCard, Building2, Smartphone, ChevronLeft, Check, AlertCircle, Loader2 } from "lucide-react"

interface ProductData { id: string; title: string; price: number; discountPrice: number | null; images: string[] }

export function CheckoutView() {
  const { selectedProductId, navigate } = useAppStore()
  const { user } = useAuthStore()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    cedula: "", fullName: user?.name || "",
    // Card fields
    cardNumber: "", cardExpiry: "", cardCVV: "",
    // Bank account
    accountNumber: "",
    // PayPal
    paypalEmail: "",
    // Billetera
    phone: "",
  })

  useEffect(() => {
    if (!selectedProductId) return
    fetch(`/api/products/${selectedProductId}`).then(r => r.json()).then(d => { if (d.success) setProduct(d.data) }).catch(() => toast.error("Error al cargar producto"))
  }, [selectedProductId])

  const formatPrice = (p: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(p)
  const amount = product ? (product.discountPrice || product.price) : 0

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!paymentMethod) { errs.method = "Selecciona un método de pago"; setErrors(errs); return false }

    // Common validations for bank methods
    if (["BANPRO", "BAC", "LAFISE", "BILLETERA"].includes(paymentMethod)) {
      if (!formData.fullName.trim()) errs.fullName = "Nombre requerido"
      const cedulaCheck = validateCedula(formData.cedula)
      if (!cedulaCheck.valid) errs.cedula = cedulaCheck.message
    }

    // Card-specific
    if (["BAC", "LAFISE"].includes(paymentMethod)) {
      const cardCheck = validateCardNumber(formData.cardNumber)
      if (!cardCheck.valid) errs.cardNumber = cardCheck.message
      const expiryCheck = validateCardExpiry(formData.cardExpiry)
      if (!expiryCheck.valid) errs.cardExpiry = expiryCheck.message
      const cvvCheck = validateCVV(formData.cardCVV)
      if (!cvvCheck.valid) errs.cardCVV = cvvCheck.message
    }

    // Bank account
    if (["BANPRO", "LAFISE"].includes(paymentMethod)) {
      if (!formData.accountNumber) errs.accountNumber = "Número de cuenta requerido"
      else {
        const acctCheck = validateBankAccount(formData.accountNumber)
        if (!acctCheck.valid) errs.accountNumber = acctCheck.message
      }
    }

    // PayPal
    if (paymentMethod === "PAYPAL") {
      if (!formData.paypalEmail.trim()) errs.paypalEmail = "Email de PayPal requerido"
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.paypalEmail)) errs.paypalEmail = "Email inválido"
    }

    // Billetera
    if (paymentMethod === "BILLETERA") {
      const phoneCheck = validatePhoneNicaragua(formData.phone)
      if (!phoneCheck.valid) errs.phone = phoneCheck.message
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePayment = async () => {
    if (!validateForm()) return
    setProcessing(true)

    const cardLast4 = formData.cardNumber ? formData.cardNumber.replace(/\D/g, "").slice(-4) : ""

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
          paymentDetails: JSON.stringify({ fullName: formData.fullName, method: paymentMethod }),
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

  if (!product) return <div className="text-center py-16"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>

  if (completed) return (
    <div className="max-w-md mx-auto text-center py-16 space-y-4">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto"><Check className="h-10 w-10 text-green-600" /></div>
      <h2 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">¡Pago Exitoso!</h2>
      <p className="text-muted-foreground">Tu pago de {formatPrice(amount)} por &quot;{product.title}&quot; ha sido procesado.</p>
      <p className="text-sm text-muted-foreground">El vendedor ha sido notificado y recibirás confirmación pronto.</p>
      <div className="flex gap-3 justify-center mt-4">
        <Button variant="outline" onClick={() => navigate("buyer-dashboard")}>Mis Compras</Button>
        <Button className="bg-primary" onClick={() => navigate("home")}>Seguir Comprando</Button>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("product-detail", { productId: product.id })}><ChevronLeft className="h-4 w-4 mr-1" /> Volver al producto</Button>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">Checkout</h1>

      {/* Order Summary */}
      <Card>
        <CardContent className="p-4 flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">📦</div>}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{product.title}</h3>
            <div className="flex items-baseline gap-2 mt-1">
              {product.discountPrice ? (
                <>
                  <span className="text-xl font-bold text-volcan">{formatPrice(product.discountPrice)}</span>
                  <span className="line-through text-muted-foreground text-sm">{formatPrice(product.price)}</span>
                </>
              ) : (
                <span className="text-xl font-bold text-primary">{formatPrice(product.price)}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Método de Pago</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            {PAYMENT_METHODS.map(m => (
              <div key={m.id}>
                <RadioGroupItem value={m.id} id={m.id} className="peer sr-only" />
                <Label htmlFor={m.id} className="flex items-center gap-3 p-3 rounded-lg border-2 border-muted cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  <span className="text-xl">{m.icon}</span>
                  <span className="font-medium">{m.name}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.method && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.method}</p>}

          {/* PayPal Form */}
          {paymentMethod === "PAYPAL" && (
            <div className="space-y-3 mt-4 p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" /> Datos de PayPal</h4>
              <div className="space-y-2">
                <Label>Email de PayPal</Label>
                <Input type="email" placeholder="tu@paypal.com" value={formData.paypalEmail} onChange={(e) => setFormData(f => ({ ...f, paypalEmail: e.target.value }))} />
                {errors.paypalEmail && <p className="text-xs text-destructive">{errors.paypalEmail}</p>}
              </div>
            </div>
          )}

          {/* Banpro Form */}
          {paymentMethod === "BANPRO" && (
            <div className="space-y-3 mt-4 p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-medium flex items-center gap-2"><Building2 className="h-4 w-4" /> Datos de Cuenta Banpro</h4>
              <div className="space-y-2">
                <Label>Nombre completo del titular</Label>
                <Input value={formData.fullName} onChange={(e) => setFormData(f => ({ ...f, fullName: e.target.value }))} placeholder="Juan Pérez" />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label>Cédula de identidad</Label>
                <Input value={formData.cedula} onChange={(e) => setFormData(f => ({ ...f, cedula: formatCedula(e.target.value) }))} placeholder="001-251285-0001U" />
                {errors.cedula && <p className="text-xs text-destructive">{errors.cedula}</p>}
              </div>
              <div className="space-y-2">
                <Label>Número de cuenta Banpro</Label>
                <Input value={formData.accountNumber} onChange={(e) => setFormData(f => ({ ...f, accountNumber: e.target.value }))} placeholder="100234567890" />
                {errors.accountNumber && <p className="text-xs text-destructive">{errors.accountNumber}</p>}
              </div>
            </div>
          )}

          {/* BAC Form */}
          {paymentMethod === "BAC" && (
            <div className="space-y-3 mt-4 p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" /> Datos de Tarjeta BAC Credomatic</h4>
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input value={formData.fullName} onChange={(e) => setFormData(f => ({ ...f, fullName: e.target.value }))} placeholder="Juan Pérez" />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label>Cédula de identidad</Label>
                <Input value={formData.cedula} onChange={(e) => setFormData(f => ({ ...f, cedula: formatCedula(e.target.value) }))} placeholder="001-251285-0001U" />
                {errors.cedula && <p className="text-xs text-destructive">{errors.cedula}</p>}
              </div>
              <div className="space-y-2">
                <Label>Número de tarjeta</Label>
                <Input value={formData.cardNumber} onChange={(e) => setFormData(f => ({ ...f, cardNumber: formatCardNumber(e.target.value) }))} placeholder="4242 4242 4242 4242" maxLength={19} />
                {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fecha de expiración</Label>
                  <Input value={formData.cardExpiry} onChange={(e) => setFormData(f => ({ ...f, cardExpiry: e.target.value }))} placeholder="MM/AA" maxLength={5} />
                  {errors.cardExpiry && <p className="text-xs text-destructive">{errors.cardExpiry}</p>}
                </div>
                <div className="space-y-2">
                  <Label>CVV</Label>
                  <Input type="password" value={formData.cardCVV} onChange={(e) => setFormData(f => ({ ...f, cardCVV: e.target.value }))} placeholder="123" maxLength={4} />
                  {errors.cardCVV && <p className="text-xs text-destructive">{errors.cardCVV}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Lafise Form */}
          {paymentMethod === "LAFISE" && (
            <div className="space-y-3 mt-4 p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-medium flex items-center gap-2"><Building2 className="h-4 w-4" /> Datos de Cuenta/Tarjeta Lafise</h4>
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input value={formData.fullName} onChange={(e) => setFormData(f => ({ ...f, fullName: e.target.value }))} placeholder="Juan Pérez" />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label>Cédula de identidad</Label>
                <Input value={formData.cedula} onChange={(e) => setFormData(f => ({ ...f, cedula: formatCedula(e.target.value) }))} placeholder="001-251285-0001U" />
                {errors.cedula && <p className="text-xs text-destructive">{errors.cedula}</p>}
              </div>
              <div className="space-y-2">
                <Label>Número de tarjeta o cuenta</Label>
                <Input value={formData.cardNumber || formData.accountNumber} onChange={(e) => setFormData(f => ({ ...f, cardNumber: e.target.value, accountNumber: e.target.value }))} placeholder="Tarjeta o número de cuenta" />
                {(errors.cardNumber || errors.accountNumber) && <p className="text-xs text-destructive">{errors.cardNumber || errors.accountNumber}</p>}
              </div>
            </div>
          )}

          {/* Billetera Móvil Form */}
          {paymentMethod === "BILLETERA" && (
            <div className="space-y-3 mt-4 p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-medium flex items-center gap-2"><Smartphone className="h-4 w-4" /> Datos de Billetera Móvil</h4>
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input value={formData.fullName} onChange={(e) => setFormData(f => ({ ...f, fullName: e.target.value }))} placeholder="Juan Pérez" />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label>Cédula de identidad</Label>
                <Input value={formData.cedula} onChange={(e) => setFormData(f => ({ ...f, cedula: formatCedula(e.target.value) }))} placeholder="001-251285-0001U" />
                {errors.cedula && <p className="text-xs text-destructive">{errors.cedula}</p>}
              </div>
              <div className="space-y-2">
                <Label>Número de teléfono móvil</Label>
                <Input value={formData.phone} onChange={(e) => setFormData(f => ({ ...f, phone: formatPhoneNicaragua(e.target.value) }))} placeholder="8XXX-XXXX" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total & Pay */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-medium">Total a pagar:</span>
            <span className="text-2xl font-bold text-primary">{formatPrice(amount)}</span>
          </div>
          <Button className="w-full h-12 text-lg bg-primary hover:bg-primary/90" onClick={handlePayment} disabled={processing || !paymentMethod}>
            {processing ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Procesando...</> : `Pagar ${formatPrice(amount)}`}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">Tu información está encriptada y protegida</p>
        </CardContent>
      </Card>
    </div>
  )
}
