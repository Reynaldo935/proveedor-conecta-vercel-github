import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// POST /api/auth/verify/send — generate verification token and simulate sending email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Correo electrónico requerido' },
        { status: 200 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      // Don't reveal whether user exists — return success anyway
      return NextResponse.json({
        success: true,
        data: { message: 'Si existe una cuenta con este correo, se enviará un enlace de verificación.' },
      })
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Este correo ya está verificado' },
        { status: 200 }
      )
    }

    // Delete any existing verification tokens for this email
    await db.verificationToken.deleteMany({ where: { email } })

    // Generate a new verification token (UUID)
    const token = crypto.randomUUID()

    // Token expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await db.verificationToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    })

    // Simulated verification link (in production, this would be sent via email)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    const verificationLink = appUrl ? `${appUrl}/api/auth/verify?token=${token}` : `/api/auth/verify?token=${token}`

    // Simulated email sending
    console.log(`[EMAIL SIMULATION] Verification email for ${email}`)
    console.log(`[EMAIL SIMULATION] Link: ${verificationLink}`)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Se ha enviado un correo de verificación. Revisa tu bandeja de entrada.',
        // For demo purposes, include the verification link
        verificationLink,
        token,
      },
    })
  } catch (error) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al enviar correo de verificación' },
      { status: 200 }
    )
  }
}
