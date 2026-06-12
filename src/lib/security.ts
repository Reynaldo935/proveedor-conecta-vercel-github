/**
 * Security utilities for ProveedorConecta Nicaragua
 * Provides rate limiting, input validation, XSS/SQLi detection, and security headers
 * Compatible with Vercel Edge Runtime (no external dependencies)
 */

import { NextRequest, NextResponse } from 'next/server'

// ─── Rate Limiting ──────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) rateLimitStore.delete(key)
    }
  }, 5 * 60 * 1000)
}

/**
 * Check rate limit for a given identifier.
 * Returns whether the request is allowed, remaining requests, and reset time.
 *
 * @param identifier - Unique identifier (typically IP address)
 * @param maxRequests - Maximum requests allowed in the window (default: 60)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // No existing entry or window has expired — create new entry
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    rateLimitStore.set(identifier, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  // Entry exists and window is active
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

// ─── Client IP Extraction ───────────────────────────────────────────────────────

/**
 * Get client IP from request headers.
 * Handles proxies (Vercel, Cloudflare, Nginx) by checking forwarded headers.
 */
export function getClientIP(request: NextRequest): string {
  // Check common proxy headers first
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for may contain multiple IPs; the first is the client
    const ips = forwarded.split(',').map(ip => ip.trim())
    if (ips[0]) return ips[0]
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP

  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) return cfIP

  // Fallback — should not happen in production but provides a default
  return 'unknown'
}

// ─── Input Sanitization ─────────────────────────────────────────────────────────

/**
 * Sanitize input string by removing dangerous characters and normalizing whitespace.
 * Strips HTML tags, null bytes, and control characters.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \t \n \r
    .replace(/<[^>]*>/g, '')                               // Strip HTML tags
    .replace(/&[#\w]+;/g, '')                              // Strip HTML entities
    .replace(/\s+/g, ' ')                                  // Normalize whitespace
    .trim()
}

// ─── Email Validation ───────────────────────────────────────────────────────────

/** Disposable email domains to block */
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'throwaway.email', 'mailinator.com',
  'guerrillamail.com', 'yopmail.com', 'sharklasers.com',
  'trashmail.com', 'dispostable.com', 'maildrop.cc',
  'tempail.com', 'tempr.email', 'discard.email',
  'fakeinbox.com', 'mailcatch.com', 'mailexpire.com',
])

/**
 * Validate email format and check for disposable domains.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) return false

  const domain = email.split('@')[1]?.toLowerCase()
  if (domain && DISPOSABLE_DOMAINS.has(domain)) return false

  return true
}

// ─── Nicaraguan Cédula Validation ───────────────────────────────────────────────

/**
 * Validate Nicaraguan cédula de identidad.
 * Supports two formats:
 *   1. Full format: 000-000000-0000A (3digits-6digits-4digits+1letter)
 *   2. Simple format: 13 digits (municipality code 001-580)
 */
export function isValidCedula(cedula: string): boolean {
  const cleaned = cedula.trim()

  // Full format: 001-251285-0001U
  const fullFormatRegex = /^\d{3}-\d{6}-\d{4}[A-Za-z]$/
  if (fullFormatRegex.test(cleaned)) return true

  // Simple format: 13 digits with valid municipality code
  const simpleFormatRegex = /^\d{13}$/
  if (simpleFormatRegex.test(cleaned)) {
    const municipalityCode = parseInt(cleaned.slice(0, 3), 10)
    return municipalityCode >= 1 && municipalityCode <= 580
  }

  return false
}

// ─── Nicaraguan Phone Validation ────────────────────────────────────────────────

/**
 * Validate Nicaraguan phone number.
 * Must be 8 digits starting with 5, 7, or 8.
 * Accepts optional +505 country code prefix.
 */
export function isValidNicaraguanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  const phoneRegex = /^(\+505)?[578]\d{7}$/
  return phoneRegex.test(cleaned)
}

// ─── CORS Headers ───────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://proveedorconecta.com',
  'https://www.proveedorconecta.com',
  'https://proveedorconecta.com.ni',
].filter(Boolean)

/**
 * Get CORS headers for API responses.
 * Allows requests from configured origins.
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  let allowOrigin = ALLOWED_ORIGINS[0] || '*'

  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      if (!allowed) return false
      if (allowed === origin) return true
      try {
        const allowedHost = new URL(allowed).hostname
        return origin.endsWith(allowedHost)
      } catch {
        return false
      }
    })
    if (isAllowed) allowOrigin = origin
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-CSRF-Token, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

// ─── Security Headers ───────────────────────────────────────────────────────────

/**
 * Get security headers for API responses.
 * Follows OWASP recommended headers.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
  }
}

/**
 * Apply security headers to a NextResponse object.
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  const securityHeaders = getSecurityHeaders()
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value)
  }
  return response
}

// ─── Password Strength Validation ───────────────────────────────────────────────

/**
 * Validate password strength.
 * Requirements: minimum 8 characters, at least one letter, at least one number.
 */
export function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres')
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra')
  }
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
  }

  return { valid: errors.length === 0, errors }
}

// ─── CSRF Token Validation ──────────────────────────────────────────────────────

/**
 * Validate CSRF token from request.
 * Checks X-CSRF-Token header against cookie or provided token.
 * For stateless APIs, this provides basic CSRF protection.
 */
export function validateCSRFToken(request: NextRequest, token?: string): boolean {
  const headerToken = request.headers.get('x-csrf-token')
  const cookieToken = request.cookies.get('csrf_token')?.value

  // If a token is provided, check it matches
  if (token) {
    return headerToken === token
  }

  // If we have a cookie token, the header must match it
  if (cookieToken) {
    return headerToken === cookieToken
  }

  // For stateless requests without CSRF cookies, check that the request
  // has a custom header (which CSRF attacks cannot add)
  // X-Requested-With or X-CSRF-Token presence indicates intentional request
  return !!headerToken || !!request.headers.get('x-requested-with')
}

// ─── SQL Injection Detection ────────────────────────────────────────────────────

/** SQL injection patterns to detect */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
  /(--|;|\/\*|\*\/|xp_|sp_)/i,
  /('\s*(OR|AND)\s+.*[=<>])/i,
  /(\bOR\b\s+1\s*=\s*1)/i,
  /(\bAND\b\s+1\s*=\s*1)/i,
  /('\s*;\s*(DROP|DELETE|UPDATE|INSERT))/i,
  /(\bWAITFOR\b\s+\bDELAY\b)/i,
  /(\bBENCHMARK\b\s*\()/i,
  /(\bSLEEP\b\s*\()/i,
  /(\bLOAD_FILE\b\s*\()/i,
  /(\bINTO\s+OUTFILE\b)/i,
  /(\bINTO\s+DUMPFILE\b)/i,
]

/**
 * Detect potential SQL injection in input string.
 * Returns true if suspicious patterns are found.
 * Note: This is a basic check — parameterized queries are the real defense.
 */
export function hasSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false
  // Don't flag short, simple inputs
  if (input.length < 4) return false

  let patternMatches = 0
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      patternMatches++
      // Require at least 2 pattern matches to reduce false positives
      if (patternMatches >= 2) return true
    }
  }

  return false
}

// ─── XSS Detection ──────────────────────────────────────────────────────────────

/** XSS attack patterns to detect */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<script\b/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*['"]/i,           // onerror=", onclick=", etc.
  /on\w+\s*=\s*[^'"\s>]+/i,      // onerror=alert(1) without quotes
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i,
  /<applet\b/i,
  /<form\b/i,
  /expression\s*\(/i,             // CSS expression()
  /url\s*\(\s*javascript:/i,      // CSS url(javascript:)
  /data\s*:\s*text\/html/i,       // data:text/html
  /vbscript\s*:/i,
  /<link\b/i,
  /<meta\b[^>]*http-equiv/i,
  /<base\b/i,
  /document\.(cookie|domain|write)/i,
  /eval\s*\(/i,
  /setTimeout\s*\(\s*['"]/i,
  /setInterval\s*\(\s*['"]/i,
]

/**
 * Detect potential XSS attacks in input string.
 * Returns true if suspicious patterns are found.
 * Note: This is a basic check — proper output encoding is the real defense.
 */
export function hasXSS(input: string): boolean {
  if (!input || typeof input !== 'string') return false
  if (input.length < 4) return false

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) return true
  }

  return false
}

// ─── Comprehensive Input Validation ─────────────────────────────────────────────

/**
 * Comprehensive input validation that checks for multiple security threats.
 * Returns validation result with error message if invalid.
 */
export function validateInput(input: string, fieldName: string): { valid: boolean; error?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: `${fieldName} es requerido` }
  }

  // Check length limits
  if (input.length > 10000) {
    return { valid: false, error: `${fieldName} excede el límite de caracteres permitidos` }
  }

  // Check for SQL injection
  if (hasSQLInjection(input)) {
    return { valid: false, error: `${fieldName} contiene patrones no permitidos` }
  }

  // Check for XSS
  if (hasXSS(input)) {
    return { valid: false, error: `${fieldName} contiene contenido no permitido` }
  }

  // Check for null bytes
  if (input.includes('\0')) {
    return { valid: false, error: `${fieldName} contiene caracteres inválidos` }
  }

  // Check for path traversal
  if (/\.\.[\\/]/.test(input)) {
    return { valid: false, error: `${fieldName} contiene una ruta inválida` }
  }

  return { valid: true }
}

// ─── Rate Limit Helper for API Routes ───────────────────────────────────────────

/**
 * Apply rate limiting to an API route handler.
 * Returns a 429 response if rate limit is exceeded, null otherwise.
 *
 * Usage in API routes:
 *   const rateLimitResponse = applyRateLimit(request, 30, 60_000)
 *   if (rateLimitResponse) return rateLimitResponse
 */
export function applyRateLimit(
  request: NextRequest,
  maxRequests: number = 60,
  windowMs: number = 60_000
): NextResponse | null {
  const ip = getClientIP(request)
  const result = checkRateLimit(ip, maxRequests, windowMs)

  if (!result.allowed) {
    const response = NextResponse.json(
      {
        success: false,
        error: 'Demasiadas solicitudes. Por favor intente de nuevo más tarde.',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    )
    return withSecurityHeaders(response)
  }

  return null
}

/**
 * Create a success JSON response with security headers.
 */
export function secureJsonResponse(
  data: unknown,
  options?: { status?: number; headers?: Record<string, string> }
): NextResponse {
  const response = NextResponse.json(data, {
    status: options?.status || 200,
    headers: options?.headers,
  })
  return withSecurityHeaders(response)
}
