/**
 * Validadores para datos nicaragüenses
 * ProveedorConecta Nicaragua
 */

// Cédula de Identidad Nicaragüense
// Formato: 001-251285-0001U (3digits-6digits-4digits+1letter)
export function validateCedula(cedula: string): { valid: boolean; message: string } {
  const cleaned = cedula.trim()
  
  // Format: XXX-XXXXXX-XXXXX where last char can be a letter
  const cedulaRegex = /^\d{3}-\d{6}-\d{4}[A-Za-z]$/
  
  if (!cedulaRegex.test(cleaned)) {
    return { 
      valid: false, 
      message: 'Formato inválido. Use: 001-251285-0001U (3 dígitos - 6 dígitos - 4 dígitos + 1 letra)' 
    }
  }
  
  return { valid: true, message: 'Cédula válida' }
}

// Algoritmo de Luhn para tarjetas de crédito/débito
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

// Validar número de tarjeta
export function validateCardNumber(cardNumber: string): { valid: boolean; message: string } {
  const cleaned = cardNumber.replace(/\D/g, '')
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return { valid: false, message: 'Número de tarjeta inválido (13-19 dígitos)' }
  }
  
  if (!luhnCheck(cleaned)) {
    return { valid: false, message: 'Número de tarjeta inválido (falló verificación Luhn)' }
  }
  
  return { valid: true, message: 'Número de tarjeta válido' }
}

// Validar fecha de expiración de tarjeta
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

// Validar CVV
export function validateCVV(cvv: string): { valid: boolean; message: string } {
  const regex = /^\d{3,4}$/
  
  if (!regex.test(cvv)) {
    return { valid: false, message: 'CVV inválido (3-4 dígitos)' }
  }
  
  return { valid: true, message: 'CVV válido' }
}

// Validar número de teléfono nicaragüense
// Formato: 8XXX-XXXX o +505 8XXX-XXXX
export function validatePhoneNicaragua(phone: string): { valid: boolean; message: string } {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // Nicaraguan mobile: 8 digits starting with 7 or 8
  const phoneRegex = /^(\+505)?[78]\d{7}$/
  
  if (!phoneRegex.test(cleaned)) {
    return { 
      valid: false, 
      message: 'Número inválido. Formato: 8XXX-XXXX o +505 8XXX-XXXX' 
    }
  }
  
  return { valid: true, message: 'Teléfono válido' }
}

// Validar email con verificación de dominio MX
export function validateEmail(email: string): { valid: boolean; message: string } {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Formato de correo inválido' }
  }
  
  // Lista de dominios desechables conocidos
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', 'mailinator.com', 
    'guerrillamail.com', 'yopmail.com', 'sharklasers.com',
    'trashmail.com', 'dispostable.com', 'maildrop.cc'
  ]
  
  const domain = email.split('@')[1]?.toLowerCase()
  if (domain && disposableDomains.includes(domain)) {
    return { valid: false, message: 'No se permiten correos de dominios desechables' }
  }
  
  return { valid: true, message: 'Correo válido' }
}

// Validar número de cuenta bancaria (genérico, 10-20 dígitos)
export function validateBankAccount(account: string): { valid: boolean; message: string } {
  const cleaned = account.replace(/\D/g, '')
  
  if (cleaned.length < 10 || cleaned.length > 20) {
    return { valid: false, message: 'Número de cuenta inválido (10-20 dígitos)' }
  }
  
  return { valid: true, message: 'Número de cuenta válido' }
}

// Validar cuenta específica por banco nicaragüense
export function validateBankAccountByBank(account: string, bank: string): { valid: boolean; message: string } {
  const cleaned = account.replace(/\D/g, '')
  
  switch (bank) {
    case 'BANPRO':
      // Banpro: 14-16 dígitos, empieza con 1, 2 o 3
      if (cleaned.length < 14 || cleaned.length > 16) {
        return { valid: false, message: 'Cuenta Banpro: 14-16 dígitos' }
      }
      if (!/^[1-3]/.test(cleaned)) {
        return { valid: false, message: 'Cuenta Banpro debe iniciar con 1, 2 o 3' }
      }
      return { valid: true, message: 'Cuenta Banpro válida' }
      
    case 'BAC':
      // BAC Credomatic: 14-16 dígitos, empieza con 4, 5 o 6
      if (cleaned.length < 14 || cleaned.length > 16) {
        return { valid: false, message: 'Cuenta BAC: 14-16 dígitos' }
      }
      if (!/^[4-6]/.test(cleaned)) {
        return { valid: false, message: 'Cuenta BAC debe iniciar con 4, 5 o 6' }
      }
      return { valid: true, message: 'Cuenta BAC válida' }
      
    case 'LAFISE':
      // Lafise: 12-14 dígitos, empieza con 7 u 8
      if (cleaned.length < 12 || cleaned.length > 14) {
        return { valid: false, message: 'Cuenta Lafise: 12-14 dígitos' }
      }
      if (!/^[78]/.test(cleaned)) {
        return { valid: false, message: 'Cuenta Lafise debe iniciar con 7 u 8' }
      }
      return { valid: true, message: 'Cuenta Lafise válida' }
      
    default:
      return validateBankAccount(account)
  }
}

// Validar Billetera Móvil (teléfono nicaragüense con proveedor)
export function validateBilleteraMovil(phone: string, provider?: string): { valid: boolean; message: string } {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+505/, '')
  
  // Nicaraguan mobile: 8 digits starting with 7 or 8
  const phoneRegex = /^[78]\d{7}$/
  
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, message: 'Número inválido. Formato: 8XXX-XXXX' }
  }
  
  // Provider prefixes (optional validation)
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

// Identificar tipo de tarjeta por BIN
export function identifyCardType(cardNumber: string): { type: string; brand: string } {
  const cleaned = cardNumber.replace(/\D/g, '')
  
  if (/^4/.test(cleaned)) return { type: 'VISA', brand: 'Visa' }
  if (/^5[1-5]/.test(cleaned)) return { type: 'MASTERCARD', brand: 'Mastercard' }
  if (/^3[47]/.test(cleaned)) return { type: 'AMEX', brand: 'American Express' }
  if (/^6(?:011|5)/.test(cleaned)) return { type: 'DISCOVER', brand: 'Discover' }
  
  return { type: 'UNKNOWN', brand: 'Desconocida' }
}

// Formatear cédula mientras se escribe
export function formatCedula(value: string): string {
  const digits = value.replace(/[^0-9A-Za-z]/g, '')
  
  if (digits.length <= 3) return digits
  if (digits.length <= 9) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 9)}-${digits.slice(9)}`
}

// Formatear número de tarjeta mientras se escribe
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  const groups = digits.match(/.{1,4}/g)
  return groups ? groups.join(' ') : digits
}

// Formatear teléfono nicaragüense
export function formatPhoneNicaragua(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^505/, '')
  
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`
}

// Categorías de productos para Nicaragua
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

// Departamentos de Nicaragua
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

// Métodos de pago
export const PAYMENT_METHODS = [
  { id: 'PIXELPAY', name: 'PixelPay', icon: '💳' },
  { id: 'PAGADITO', name: 'Pagadito', icon: '💳' },
  { id: 'PAYPAL', name: 'PayPal', icon: '💳' },
  { id: 'GOOGLE_PAY', name: 'Google Pay', icon: '📱' },
  { id: 'BANPRO', name: 'Banpro Transferencia', icon: '🏦' },
  { id: 'BANPRO_BILLETERA', name: 'Banpro Billetera', icon: '📱' },
  { id: 'BAC', name: 'BAC Credomatic', icon: '🏦' },
  { id: 'LAFISE', name: 'LAFISE', icon: '🏦' },
  { id: 'KASH', name: 'Kash', icon: '📱' },
  { id: 'BILLETERA', name: 'Billetera Móvil', icon: '📱' },
  { id: 'WESTERN_UNION', name: 'Western Union', icon: '💸' },
] as const

// Validar número de referencia de Western Union
export function validateWesternUnionRef(ref: string): { valid: boolean; message: string } {
  const cleaned = ref.trim()
  if (cleaned.length < 8 || cleaned.length > 20) {
    return { valid: false, message: 'Número de referencia inválido (8-20 caracteres)' }
  }
  return { valid: true, message: 'Referencia válida' }
}

// Validar teléfono Kash (mismo formato que Billetera Móvil)
export function validateKashPhone(phone: string): { valid: boolean; message: string } {
  return validateBilleteraMovil(phone)
}
