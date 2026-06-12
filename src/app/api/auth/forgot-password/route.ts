import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // --- ACTION: request reset (user submits email) ---
    if (!action || action === 'request') {
      const { email } = body

      if (!email) {
        return NextResponse.json(
          { success: false, error: 'El correo electrónico es requerido' },
          { status: 200 }
        )
      }

      // Check if user exists
      const user = await db.user.findUnique({ where: { email } })

      if (!user) {
        // Return success even if user doesn't exist to prevent email enumeration
        return NextResponse.json({
          success: true,
          message: 'Si el correo está registrado, recibirás un enlace de restablecimiento',
        })
      }

      // Delete any existing reset tokens for this email
      await db.verificationToken.deleteMany({
        where: { email },
      })

      // Generate reset token
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await db.verificationToken.create({
        data: {
          email,
          token,
          expiresAt,
        },
      })

      // Simulated email: return the token directly in the response
      // In production, this would be sent via email
      const resetLink = `/api/auth/forgot-password?action=verify&token=${token}`

      return NextResponse.json({
        success: true,
        message: 'Si el correo está registrado, recibirás un enlace de restablecimiento',
        data: {
          token,
          resetLink,
          email,
          expiresAt: expiresAt.toISOString(),
        },
      })
    }

    // --- ACTION: reset password (user submits token + new password) ---
    if (action === 'reset') {
      const { token, password } = body

      if (!token || !password) {
        return NextResponse.json(
          { success: false, error: 'Token y nueva contraseña son requeridos' },
          { status: 200 }
        )
      }

      // Validate password strength
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 200 }
        )
      }

      // Find the token
      const verificationToken = await db.verificationToken.findUnique({
        where: { token },
      })

      if (!verificationToken) {
        return NextResponse.json(
          { success: false, error: 'Token inválido o expirado' },
          { status: 200 }
        )
      }

      // Check if token has expired
      if (verificationToken.expiresAt < new Date()) {
        // Clean up expired token
        await db.verificationToken.delete({ where: { token } })
        return NextResponse.json(
          { success: false, error: 'El token ha expirado. Solicita uno nuevo.', expired: true },
          { status: 200 }
        )
      }

      // Find the user by email from the token
      const user = await db.user.findUnique({
        where: { email: verificationToken.email },
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Usuario no encontrado' },
          { status: 200 }
        )
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 4)

      // Update user password
      await db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })

      // Delete the used token
      await db.verificationToken.delete({ where: { token } })

      // Also delete any other reset tokens for this email
      await db.verificationToken.deleteMany({
        where: { email: verificationToken.email },
      })

      return NextResponse.json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
      })
    }

    // --- ACTION: verify token (check if token is still valid) ---
    if (action === 'verify') {
      const { token } = body

      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Token es requerido' },
          { status: 200 }
        )
      }

      const verificationToken = await db.verificationToken.findUnique({
        where: { token },
      })

      if (!verificationToken) {
        return NextResponse.json(
          { success: false, error: 'Token inválido', valid: false },
          { status: 200 }
        )
      }

      if (verificationToken.expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, error: 'El token ha expirado', valid: false, expired: true },
          { status: 200 }
        )
      }

      return NextResponse.json({
        success: true,
        valid: true,
        data: {
          email: verificationToken.email,
          expiresAt: verificationToken.expiresAt.toISOString(),
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 200 }
    )
  }
}
