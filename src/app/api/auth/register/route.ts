import { NextResponse } from 'next/server'

/**
 * POST /api/auth/register — DEPRECATED
 * Registration is now handled by Clerk.
 * Clients should use /sign-up instead.
 */
export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'El registro ahora se maneja a través de Clerk.',
    redirect: '/sign-up',
  })
}
