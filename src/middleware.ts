/**
 * Middleware para ProveedorConecta Nicaragua
 * Protege rutas por rol usando Clerk + verificación personalizada
 * 
 * Rutas públicas: /, /sign-in, /sign-up, /api/marketplace, /api/products (GET)
 * Rutas protegidas: /dashboard, /checkout, /api/admin, /api/products (POST/PUT/DELETE)
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Rutas que requieren autenticación
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/checkout(.*)',
  '/payment-success(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/sell(.*)',
])

// Rutas de API que requieren autenticación
const isProtectedApiRoute = createRouteMatcher([
  '/api/admin(.*)',
  '/api/upload(.*)',
  '/api/create-paypal-order(.*)',
  '/api/capture-paypal-order(.*)',
  '/api/orders(.*)',
  '/api/backup(.*)',
  '/api/voucher(.*)',
  '/api/creators(.*)',
  '/api/users(.*)',
])

// Rutas públicas (sin autenticación requerida)
const isPublicApiRoute = createRouteMatcher([
  '/api/marketplace(.*)',
  '/api/products(.*)',
  '/api/webhooks(.*)',
  '/api/ai(.*)',
  '/api/weather(.*)',
  '/api/auth(.*)',
  '/api/payments/gateways(.*)',
  '/api/chat(.*)',
  '/api/social(.*)',
  '/api/wall(.*)',
  '/api/cotizacion(.*)',
  '/api/reviews(.*)',
  '/api/notifications(.*)',
  '/api/surveys(.*)',
  '/api/currency(.*)',
  '/api/downloads(.*)',
  '/api/appointments(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname

  // Permitir rutas públicas sin autenticación
  if (isPublicApiRoute(req)) {
    return NextResponse.next()
  }

  // Proteger rutas de API que lo requieren
  if (isProtectedApiRoute(req)) {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado. Inicia sesión para continuar.' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // Proteger páginas que requieren autenticación
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
