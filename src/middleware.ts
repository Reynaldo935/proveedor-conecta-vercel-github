/**
 * Next.js Middleware for ProveedorConecta Nicaragua
 * Provides security headers, rate limiting, and malicious request detection
 * for all API routes.
 *
 * Edge Runtime compatible — no external dependencies or Node.js-specific APIs
 */

import { NextRequest, NextResponse } from 'next/server'

// ─── In-Memory Rate Limit Store ─────────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Maximum number of rate limit entries to prevent memory exhaustion
const MAX_STORE_SIZE = 10_000

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
let lastCleanup = Date.now()

function cleanupExpiredEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(key)
  }
}

function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupExpiredEntries()

  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // No existing entry or window has expired — create new entry
  if (!entry || now > entry.resetAt) {
    // Enforce max store size
    if (rateLimitStore.size >= MAX_STORE_SIZE) {
      // Remove oldest entries (approximate — delete first 10%)
      const keysToDelete = Array.from(rateLimitStore.keys()).slice(0, Math.ceil(MAX_STORE_SIZE * 0.1))
      for (const key of keysToDelete) rateLimitStore.delete(key)
    }

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

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim())
    if (ips[0]) return ips[0]
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP

  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) return cfIP

  return 'unknown'
}

// ─── Malicious Pattern Detection ────────────────────────────────────────────────

// SQL injection patterns (require 2+ matches to reduce false positives)
const SQL_PATTERNS = [
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b/i,
  /(--|\/\*|\*\/|xp_|sp_)/i,
  /('\s*(OR|AND)\s+.*[=<>])/i,
  /(\bOR\b\s+1\s*=\s*1)/i,
  /(\bAND\b\s+1\s*=\s*1)/i,
  /('\s*;\s*(DROP|DELETE|UPDATE|INSERT))/i,
  /(\bWAITFOR\b\s+\bDELAY\b)/i,
  /(\bBENCHMARK\b\s*\()/i,
  /(\bSLEEP\b\s*\()/i,
  /(\bLOAD_FILE\b\s*\()/i,
  /(\bINTO\s+(OUTFILE|DUMPFILE)\b)/i,
]

// XSS patterns (single match is enough — these are very specific)
const XSS_PATTERNS = [
  /<script\b/i,
  /javascript\s*:/i,
  /on(error|load|click|mouseover|focus|blur|submit|change)\s*=\s*['"]/i,
  /on(error|load|click|mouseover|focus|blur|submit|change)\s*=\s*[^'"\s>]+/i,
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i,
  /<applet\b/i,
  /expression\s*\(/i,
  /vbscript\s*:/i,
  /document\.(cookie|domain|write)/i,
  /eval\s*\(/i,
]

function detectMaliciousContent(input: string): { isSQL: boolean; isXSS: boolean } {
  if (!input || input.length < 4) return { isSQL: false, isXSS: false }

  let sqlMatches = 0
  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(input)) {
      sqlMatches++
      if (sqlMatches >= 2) break
    }
  }

  let isXSS = false
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      isXSS = true
      break
    }
  }

  return { isSQL: sqlMatches >= 2, isXSS }
}

/**
 * Extract all text content from a request for pattern analysis.
 * Checks URL, search params, and common body field names.
 * Does NOT attempt to parse JSON body (expensive in middleware).
 */
function extractRequestText(request: NextRequest): string {
  const parts: string[] = []

  // URL pathname and search params
  parts.push(request.nextUrl.pathname)
  parts.push(request.nextUrl.search)

  // Check for query string values
  request.nextUrl.searchParams.forEach((value) => {
    if (value.length > 2) parts.push(value)
  })

  return parts.join(' ')
}

// ─── Security Headers ───────────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

// ─── CORS Configuration ─────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_APP_URL,
  'https://proveedorconecta.com',
  'https://www.proveedorconecta.com',
  'https://proveedorconecta.com.ni',
].filter(Boolean) as string[])

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : (ALLOWED_ORIGINS.values().next().value || '')

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

// ─── Proxy Main ─────────────────────────────────────────────────────────────────

/**
 * Next.js 16 proxy handler.
 * Replaces the deprecated `middleware` named export with a default export
 * following the new proxy convention.
 */
export function middleware(request: NextRequest) {
  // Only process API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    const response = new NextResponse(null, { status: 204 })
    const corsHeaders = getCorsHeaders(origin)
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value)
    }
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value)
    }
    return response
  }

  // 1. Get client IP for rate limiting
  const clientIP = getClientIP(request)

  // 2. Check rate limit (60 requests per minute per IP)
  const rateLimitResult = checkRateLimit(clientIP, 60, 60_000)

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
    const response = NextResponse.json(
      {
        success: false,
        error: 'Demasiadas solicitudes. Por favor intente de nuevo más tarde.',
        retryAfter,
      },
      {
        status: 200,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetAt / 1000)),
        },
      }
    )

    // Add security and CORS headers to 429 response
    const origin = request.headers.get('origin')
    const corsHeaders = getCorsHeaders(origin)
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value)
    }
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value)
    }

    return response
  }

  // 3. Check for malicious patterns in URL/query string
  const requestText = extractRequestText(request)
  const maliciousCheck = detectMaliciousContent(requestText)

  if (maliciousCheck.isSQL || maliciousCheck.isXSS) {
    // Log suspicious request
    console.warn('[Security] Blocked malicious request:', {
      ip: clientIP,
      method: request.method,
      path: request.nextUrl.pathname,
      search: request.nextUrl.search,
      type: maliciousCheck.isSQL ? 'SQL_INJECTION' : 'XSS',
      timestamp: new Date().toISOString(),
    })

    const response = NextResponse.json(
      {
        success: false,
        error: 'Solicitud bloqueada por seguridad.',
      },
      { status: 200 }
    )

    const origin = request.headers.get('origin')
    const corsHeaders = getCorsHeaders(origin)
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value)
    }
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value)
    }

    return response
  }

  // 4. Allow the request with security headers
  const response = NextResponse.next()

  // Add rate limit headers for client awareness
  response.headers.set('X-RateLimit-Limit', '60')
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimitResult.resetAt / 1000)))

  // Add security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  // Add CORS headers
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value)
  }

  return response
}

// ─── Middleware Config ──────────────────────────────────────────────────────────

export const config = {
  matcher: '/api/:path*',
}
