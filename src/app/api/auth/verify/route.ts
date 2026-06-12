import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/auth/verify?token=xxx — verify email via link
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de verificación requerido' },
        { status: 200 }
      )
    }

    const verificationToken = await db.verificationToken.findFirst({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: 'Token de verificación inválido' },
        { status: 200 }
      )
    }

    if (verificationToken.expiresAt < new Date()) {
      // Clean up expired token
      await db.verificationToken.delete({ where: { id: verificationToken.id } })
      return NextResponse.json(
        { success: false, error: 'El token de verificación ha expirado. Solicita uno nuevo.', expired: true },
        { status: 200 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: verificationToken.email },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 200 }
      )
    }

    if (user.emailVerified) {
      // Already verified, just clean up
      await db.verificationToken.delete({ where: { id: verificationToken.id } })
      return NextResponse.json({
        success: true,
        data: { email: user.email, emailVerified: true, alreadyVerified: true },
      })
    }

    // Mark user as verified
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    })

    // Delete all verification tokens for this email
    await db.verificationToken.deleteMany({
      where: { email: verificationToken.email },
    })

    const { password: _, ...safeUser } = updatedUser
    return NextResponse.json({
      success: true,
      data: { ...safeUser, verified: true },
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al verificar correo' },
      { status: 200 }
    )
  }
}

// POST /api/auth/verify — verify email via JSON body
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de verificación requerido' },
        { status: 200 }
      )
    }

    const verificationToken = await db.verificationToken.findFirst({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: 'Token de verificación inválido' },
        { status: 200 }
      )
    }

    // If email provided, validate it matches
    if (email && verificationToken.email !== email) {
      return NextResponse.json(
        { success: false, error: 'El token no corresponde a este correo' },
        { status: 200 }
      )
    }

    if (verificationToken.expiresAt < new Date()) {
      await db.verificationToken.delete({ where: { id: verificationToken.id } })
      return NextResponse.json(
        { success: false, error: 'El token de verificación ha expirado. Solicita uno nuevo.', expired: true },
        { status: 200 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: verificationToken.email },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 200 }
      )
    }

    if (user.emailVerified) {
      await db.verificationToken.delete({ where: { id: verificationToken.id } })
      return NextResponse.json({
        success: true,
        data: { email: user.email, emailVerified: true, alreadyVerified: true },
      })
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    })

    await db.verificationToken.deleteMany({
      where: { email: verificationToken.email },
    })

    const { password: _, ...safeUser } = updatedUser
    return NextResponse.json({
      success: true,
      data: { ...safeUser, verified: true },
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al verificar correo' },
      { status: 200 }
    )
  }
}
