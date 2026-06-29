import { NextResponse } from 'next/server'

/**
 * POST /api/auth/login — DEPRECATED
 * Authentication is now handled by Clerk.
 * Redirect clients to use /sign-in instead.
 */
export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'La autenticación ahora se maneja a través de Clerk.',
    redirect: '/sign-in',
  })
}
