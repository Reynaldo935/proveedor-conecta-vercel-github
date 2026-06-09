/**
 * Validadores para datos nicaragüenses
 * ProveedorConecta Nicaragua
 * ACTUALIZADO: Tarjetas 16 dígitos, Cuentas bancarias 9-16 dígitos, Billetera móvil 8 dígitos, CVV 3 dígitos
 * Cédula: soporta formato completo (001-251285-0001U) y 13 dígitos simple
 * Teléfono: 8 dígitos, inicia con 5/7/8
 */

// ─── Luhn Algorithm ────────────────────────────────────────────────────────────

/**
 * Luhn algorithm for validating credit/debit card numbers.
 * Returns true if the card number passes the Luhn check.
 */
export function luhnCheck(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, '')
  if (cleaned.length < 13 || cleaned.length > 19) return false
  let sum = 0
  let isEven = false
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10)
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }
  return sum % 10 === 0
}

// ─── Nicaragua Cédula Validation ───────────────────────────────────────────────

/**
 * Validate Nicaragua cédula de identidad.
 * Supports two formats:
 *   1. Full format: 001-251285-0001U (3digits-6digits-4digits+1letter)
 *   2. Simple format: 13 digits starting with specific patterns (001-580)
 */
export function validateCedula(cedula: string): { valid: boolean; message: string } {
  const cleaned = cedula.trim()

  // Full format: 001-251285-0001U
  const fullFormatRegex = /^\d{3}-\d{6}-\d{4}[A-Za-z]$/
  if (fullFormatRegex.test(cleaned)) {
    return { valid: true, message: 'Cédula válida' }
  }

  // Simple format: 13 digits
  const simpleFormatRegex = /^\d{13}$/
  if (simpleFormatRegex.test(cleaned)) {
    // Validate that the first 3 digits correspond to a valid municipality code (001-580)
    const municipalityCode = parseInt(cleaned.slice(0, 3), 10)
    if (municipalityCode >= 1 && municipalityCode <= 580) {
      return { valid: true, message: 'Cédula válida' }
    }
    return { valid: false, message: 'Código de municipio inválido (debe ser 001-580)' }
  }

  return {
    valid: false,
    message: 'Formato inválido. Use: 001-251285-0001U o 13 dígitos',
  }
}

// ─── Card Number Validation ────────────────────────────────────────────────────

/**
 * Validate card number: exactly 16 digits + Luhn check.
 */
export function validateCardNumber(cardNumber: string): { valid: boolean; message: string } {
  const cleaned = cardNumber.replace(/\D/g, '')
  if (cleaned.length !== 16) {
    return { valid: false, message: 'Número de tarjeta debe tener exactamente 16 dígitos' }
  }
  if (!luhnCheck(cleaned)) {
    return { valid: false, message: 'Número de tarjeta inválido (falló verificación Luhn)' }
  }
  return { valid: true, message: 'Número de tarjeta válido' }
}

// ─── Card Expiry Validation ────────────────────────────────────────────────────

/**
 * Validate card expiry date: MM/YY format, must be a future date.
 */
export function validateCardExpiry(expiry: string): { valid: boolean; message: string } {
  const regex = /^(0[1-9]|1[0-2])\/\d{2}$/
  if (!regex.test(expiry)) {
    return { valid: false, message: 'Formato inválido. Use MM/AA' }
  }
  const [month, year] = expiry.split('/').map(Number)
  const now = new Date()
  const currentYear = now.getFullYear() % 100
  const currentMonth = now.getMonth() + 1
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, message: 'La tarjeta ha expirado' }
  }
  return { valid: true, message: 'Fecha válida' }
}

// ─── CVV Validation ────────────────────────────────────────────────────────────

/**
 * Validate CVV: exactly 3 digits.
 */
export function validateCVV(cvv: string): { valid: boolean; message: string } {
  const regex = /^\d{3}$/
  if (!regex.test(cvv)) {
    return { valid: false, message: 'CVV debe tener exactamente 3 dígitos' }
  }
  return { valid: true, message: 'CVV válido' }
}

// ─── Nicaragua Phone Validation ────────────────────────────────────────────────

/**
 * Validate Nicaragua phone number: exactly 8 digits, starts with 5, 7, or 8.
 * Accepts optional +505 country code prefix.
 */
export function validatePhoneNicaragua(phone: string): { valid: boolean; message: string } {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  // 8 digits starting with 5, 7, or 8 — with optional +505 prefix
  const phoneRegex = /^(\+505)?[578]\d{7}$/
  if (!phoneRegex.test(cleaned)) {
    return {
      valid: false,
      message: 'Número inválido. Formato: 5XXX-XXXX, 7XXX-XXXX o 8XXX-XXXX (8 dígitos) o +505 seguido del número',
    }
  }
  return { valid: true, message: 'Teléfono válido' }
}

// ─── Email Validation ──────────────────────────────────────────────────────────

/**
 * Validate email with disposable domain check.
 */
export function validateEmail(email: string): { valid: boolean; message: string } {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Formato de correo inválido' }
  }
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', 'mailinator.com',
    'guerrillamail.com', 'yopmail.com', 'sharklasers.com',
    'trashmail.com', 'dispostable.com', 'maildrop.cc',
  ]
  const domain = email.split('@')[1]?.toLowerCase()
  if (domain && disposableDomains.includes(domain)) {
    return { valid: false, message: 'No se permiten correos de dominios desechables' }
  }
  return { valid: true, message: 'Correo válido' }
}

// ─── Bank Account Validation ───────────────────────────────────────────────────

/**
 * Validate bank account number: 9 to 16 digits.
 * Different Nicaraguan banks have different account number lengths:
 *   - Banpro: typically 9 digits
 *   - BAC: 9-14 digits
 *   - LAFISE: 9-12 digits
 *   - General: 9-16 digits range
 */
export function validateBankAccount(account: string): { valid: boolean; message: string } {
  const cleaned = account.replace(/\D/g, '')
  if (cleaned.length < 9 || cleaned.length > 16) {
    return { valid: false, message: 'Número de cuenta debe tener entre 9 y 16 dígitos' }
  }
  return { valid: true, message: 'Número de cuenta válido' }
}

/**
 * Validate bank account specific to a Nicaraguan bank.
 */
export function validateBankAccountByBank(account: string, bank: string): { valid: boolean; message: string } {
  const cleaned = account.replace(/\D/g, '')

  switch (bank) {
    case 'BANPRO':
      if (cleaned.length < 9 || cleaned.length > 12) {
        return { valid: false, message: 'Cuenta Banpro debe tener entre 9 y 12 dígitos' }
      }
      return { valid: true, message: 'Cuenta Banpro válida' }

    case 'BAC':
      if (cleaned.length < 9 || cleaned.length > 14) {
        return { valid: false, message: 'Cuenta BAC debe tener entre 9 y 14 dígitos' }
      }
      return { valid: true, message: 'Cuenta BAC válida' }

    case 'LAFISE':
      if (cleaned.length < 9 || cleaned.length > 12) {
        return { valid: false, message: 'Cuenta LAFISE debe tener entre 9 y 12 dígitos' }
      }
      return { valid: true, message: 'Cuenta LAFISE válida' }

    default:
      return validateBankAccount(account)
  }
}

// ─── Billetera Móvil Validation ────────────────────────────────────────────────

/**
 * Validate Billetera Móvil phone number: exactly 8 digits, starts with 5/7/8.
 */
export function validateBilleteraMovil(phone: string, provider?: string): { valid: boolean; message: string } {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+505/, '')
  const phoneRegex = /^[578]\d{7}$/
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, message: 'Número inválido. Debe tener exactamente 8 dígitos (formato: 5XXX-XXXX, 7XXX-XXXX o 8XXX-XXXX)' }
  }
  if (provider) {
    const providerPrefixes: Record<string, string[]> = {
      'CLARO': ['8', '3'],
      'MOVISTAR': ['7'],
      'CooTel': ['6'],
    }
    const prefixes = providerPrefixes[provider.toUpperCase()]
    if (prefixes && !prefixes.some(p => cleaned.startsWith(p))) {
      return { valid: false, message: `Número no corresponde a ${provider}` }
    }
  }
  return { valid: true, message: 'Número de Billetera Móvil válido' }
}

// ─── Card Type Identification ──────────────────────────────────────────────────

/**
 * Identify card type by BIN (Bank Identification Number).
 */
export function identifyCardType(cardNumber: string): { type: string; brand: string } {
  const cleaned = cardNumber.replace(/\D/g, '')
  if (/^4/.test(cleaned)) return { type: 'VISA', brand: 'Visa' }
  if (/^5[1-5]/.test(cleaned)) return { type: 'MASTERCARD', brand: 'Mastercard' }
  if (/^3[47]/.test(cleaned)) return { type: 'AMEX', brand: 'American Express' }
  if (/^6(?:011|5)/.test(cleaned)) return { type: 'DISCOVER', brand: 'Discover' }
  return { type: 'UNKNOWN', brand: 'Desconocida' }
}

// ─── Formatting Helpers ────────────────────────────────────────────────────────

/**
 * Format cédula while typing: 001-251285-0001U
 */
export function formatCedula(value: string): string {
  const digits = value.replace(/[^0-9A-Za-z]/g, '')
  if (digits.length <= 3) return digits
  if (digits.length <= 9) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 9)}-${digits.slice(9)}`
}

/**
 * Format card number while typing (groups of 4).
 */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  const groups = digits.match(/.{1,4}/g)
  return groups ? groups.join(' ') : digits
}

/**
 * Format Nicaragua phone number (8 digits).
 */
export function formatPhoneNicaragua(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^505/, '').slice(0, 8)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`
}

/**
 * Format card expiry date MM/YY.
 */
export function formatCardExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
}

/**
 * Format CVV (3 digits only).
 */
export function formatCVV(value: string): string {
  return value.replace(/\D/g, '').slice(0, 3)
}

// ─── Masking Helpers ───────────────────────────────────────────────────────────

/**
 * Mask card number for display: **** **** **** 1234
 */
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  if (cleaned.length < 4) return cardNumber
  const last4 = cleaned.slice(-4)
  return `**** **** **** ${last4}`
}

/**
 * Mask account number: *****6789
 */
export function maskAccountNumber(account: string): string {
  const cleaned = account.replace(/\D/g, '')
  if (cleaned.length < 4) return account
  const last4 = cleaned.slice(-4)
  return `${'*'.repeat(cleaned.length - 4)}${last4}`
}

/**
 * Mask phone: ****1234
 */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+505/, '')
  if (cleaned.length < 4) return phone
  const last4 = cleaned.slice(-4)
  return `${'*'.repeat(cleaned.length - 4)}${last4}`
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * Product categories for Nicaragua
 */
export const PRODUCT_CATEGORIES = [
  'Alimentos y Bebidas',
  'Agricultura y Ganadería',
  'Construcción y Ferretería',
  'Textil y Calzado',
  'Tecnología y Electrónica',
  'Salud y Farmacia',
  'Educación y Papelería',
  'Transporte y Logística',
  'Servicios Profesionales',
  'Artesanías y Manualidades',
  'Hogar y Muebles',
  'Belleza y Cuidado Personal',
  'Deportes y Recreación',
  'Energía y Combustible',
  'Impresión y Diseño',
  'Otros',
] as const

/**
 * Departments of Nicaragua
 */
export const NICARAGUA_DEPARTMENTS = [
  'Managua',
  'León',
  'Granada',
  'Masaya',
  'Carazo',
  'Rivas',
  'Chinandega',
  'Estelí',
  'Matagalpa',
  'Jinotega',
  'Nueva Segovia',
  'Madriz',
  'Boaco',
  'Chontales',
  'Río San Juan',
  'Región Autónoma Caribe Norte',
  'Región Autónoma Caribe Sur',
] as const

/**
 * Payment methods with logos and categories
 */
export const PAYMENT_METHODS = [
  { id: 'PIXELPAY', name: 'PixelPay', icon: '💳', type: 'card' as const, color: 'from-blue-500 to-blue-700' },
  { id: 'PAGADITO', name: 'Pagadito', icon: '💳', type: 'card' as const, color: 'from-green-500 to-green-700' },
  { id: 'PAYPAL', name: 'PayPal', icon: '🅿️', type: 'digital' as const, color: 'from-blue-400 to-blue-600' },
  { id: 'GOOGLE_PAY', name: 'Google Pay', icon: '📱', type: 'digital' as const, color: 'from-gray-600 to-gray-800' },
  { id: 'BANPRO', name: 'Banpro Transferencia', icon: '🏦', type: 'bank' as const, color: 'from-red-500 to-red-700' },
  { id: 'BANPRO_BILLETERA', name: 'Banpro Billetera', icon: '📱', type: 'wallet' as const, color: 'from-red-400 to-red-600' },
  { id: 'BAC', name: 'BAC Credomatic', icon: '🏦', type: 'card' as const, color: 'from-blue-600 to-blue-800' },
  { id: 'LAFISE', name: 'LAFISE', icon: '🏦', type: 'bank' as const, color: 'from-emerald-500 to-emerald-700' },
  { id: 'KASH', name: 'Kash', icon: '📱', type: 'wallet' as const, color: 'from-purple-500 to-purple-700' },
  { id: 'BILLETERA', name: 'Billetera Móvil', icon: '📱', type: 'wallet' as const, color: 'from-orange-500 to-orange-700' },
  { id: 'WESTERN_UNION', name: 'Western Union', icon: '💸', type: 'transfer' as const, color: 'from-yellow-500 to-yellow-700' },
] as const

/**
 * Payment method types for form rendering
 */
export type PaymentMethodType = 'card' | 'bank' | 'wallet' | 'digital' | 'transfer'

/**
 * Validate Western Union reference number
 */
export function validateWesternUnionRef(ref: string): { valid: boolean; message: string } {
  const cleaned = ref.trim()
  if (cleaned.length < 8 || cleaned.length > 20) {
    return { valid: false, message: 'Número de referencia inválido (8-20 caracteres)' }
  }
  return { valid: true, message: 'Referencia válida' }
}

/**
 * Validate Kash phone number (same as Billetera Móvil — 8 digits, starts with 5/7/8)
 */
export function validateKashPhone(phone: string): { valid: boolean; message: string } {
  return validateBilleteraMovil(phone)
}
