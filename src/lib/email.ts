/**
 * Email Service
 * ProveedorConecta Nicaragua
 *
 * Provides email sending capabilities using nodemailer (SMTP).
 * Falls back to simulation mode when SMTP credentials are not configured.
 *
 * Vercel serverless compatible — creates transport per invocation.
 */

import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

interface EmailResult {
  success: boolean
  error?: string
}

/**
 * Check if SMTP is configured
 */
function isSMTPConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}

/**
 * Create a nodemailer transport using environment variables
 */
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

/**
 * Send email using nodemailer (SMTP)
 * If SMTP is not configured, logs the email and returns success (simulation mode)
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const fromAddress = options.from || process.env.EMAIL_FROM || 'noreply@proveedorconecta.com.ni'

  // Simulation mode when SMTP is not configured
  if (!isSMTPConfigured()) {
    console.log('[Email] Simulation mode (SMTP not configured)')
    console.log('[Email] From:', fromAddress)
    console.log('[Email] To:', options.to)
    console.log('[Email] Subject:', options.subject)
    console.log('[Email] HTML length:', options.html.length, 'chars')
    return { success: true }
  }

  try {
    const transport = createTransport()
    const result = await transport.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    console.log('[Email] Sent successfully:', result.messageId)
    return { success: true }
  } catch (error) {
    console.error('[Email] Send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

/**
 * Send verification email with a token/code
 */
export async function sendVerificationEmail(email: string, token: string): Promise<EmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const verifyUrl = `${appUrl}/verify-email?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifica tu cuenta - ProveedorConecta Nicaragua</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1A5276, #2E86C1); padding: 32px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">ProveedorConecta</h1>
                  <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Nicaragua</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #1a1a1a; margin: 0 0 16px; font-size: 20px;">Verifica tu cuenta</h2>
                  <p style="color: #525252; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
                    Gracias por registrarte en ProveedorConecta Nicaragua. Para completar tu registro, por favor verifica tu dirección de correo electrónico.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #1A5276, #2E86C1); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                          Verificar mi cuenta
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #737373; margin: 24px 0 0; font-size: 14px; line-height: 1.6;">
                    O copia y pega el siguiente código en la página de verificación:
                  </p>
                  <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
                    <span style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #1A5276;">${token}</span>
                  </div>
                  <p style="color: #a3a3a3; margin: 24px 0 0; font-size: 13px; line-height: 1.5;">
                    Si no creaste una cuenta en ProveedorConecta Nicaragua, puedes ignorar este correo.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f4f4f5; padding: 24px 40px; text-align: center;">
                  <p style="color: #a3a3a3; margin: 0; font-size: 12px;">
                    © ${new Date().getFullYear()} ProveedorConecta Nicaragua. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Verifica tu cuenta - ProveedorConecta Nicaragua',
    html,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<EmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Restablecer contraseña - ProveedorConecta Nicaragua</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1A5276, #2E86C1); padding: 32px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">ProveedorConecta</h1>
                  <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Nicaragua</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #1a1a1a; margin: 0 0 16px; font-size: 20px;">Restablecer tu contraseña</h2>
                  <p style="color: #525252; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón a continuación para crear una nueva contraseña.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #1A5276, #2E86C1); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                          Restablecer contraseña
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #737373; margin: 24px 0 0; font-size: 14px; line-height: 1.6;">
                    Este enlace expirará en 1 hora por seguridad.
                  </p>
                  <p style="color: #a3a3a3; margin: 16px 0 0; font-size: 13px; line-height: 1.5;">
                    Si no solicitaste restablecer tu contraseña, puedes ignorar este correo. Tu contraseña actual seguirá siendo la misma.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f4f4f5; padding: 24px 40px; text-align: center;">
                  <p style="color: #a3a3a3; margin: 0; font-size: 12px;">
                    © ${new Date().getFullYear()} ProveedorConecta Nicaragua. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Restablecer contraseña - ProveedorConecta Nicaragua',
    html,
  })
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceipt(
  email: string,
  transactionDetails: {
    amount: number
    productName: string
    transactionId: string
    date: string
    paymentMethod: string
  }
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recibo de pago - ProveedorConecta Nicaragua</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1A5276, #2E86C1); padding: 32px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">ProveedorConecta</h1>
                  <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Recibo de Pago</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #1a1a1a; margin: 0 0 24px; font-size: 20px;">¡Pago exitoso!</h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #737373; font-size: 14px;">Producto</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right; color: #1a1a1a; font-size: 14px; font-weight: 500;">${transactionDetails.productName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #737373; font-size: 14px;">Monto</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right; color: #1a1a1a; font-size: 14px; font-weight: 600;">C$ ${transactionDetails.amount.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #737373; font-size: 14px;">Método de pago</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right; color: #1a1a1a; font-size: 14px;">${transactionDetails.paymentMethod}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #737373; font-size: 14px;">ID Transacción</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right; color: #1a1a1a; font-size: 14px; font-family: monospace;">${transactionDetails.transactionId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #737373; font-size: 14px;">Fecha</td>
                      <td style="padding: 12px 0; text-align: right; color: #1a1a1a; font-size: 14px;">${transactionDetails.date}</td>
                    </tr>
                  </table>
                  <p style="color: #a3a3a3; margin: 32px 0 0; font-size: 13px; line-height: 1.5;">
                    Guarda este correo como comprobante de tu pago. Si tienes alguna pregunta, contacta a soporte@proveedorconecta.com.ni
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f4f4f5; padding: 24px 40px; text-align: center;">
                  <p style="color: #a3a3a3; margin: 0; font-size: 12px;">
                    © ${new Date().getFullYear()} ProveedorConecta Nicaragua. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `Recibo de pago - ${transactionDetails.productName} - ProveedorConecta`,
    html,
  })
}
