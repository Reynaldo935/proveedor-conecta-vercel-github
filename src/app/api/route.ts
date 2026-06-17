// ============================================================================
// ProveedorConecta Nicaragua — API Root / Health Check
// ============================================================================
// Public endpoint: returns API status + infrastructure configuration
// Used by Vercel monitoring, uptime checks, and CDN health probes
// ============================================================================

import { NextResponse } from 'next/server'

export async function GET() {
  const tursoConfigured = !!(
    process.env.TURSO_DATABASE_URL &&
    process.env.TURSO_AUTH_TOKEN
  )
  const pusherConfigured = !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET
  )
  const emailConfigured = !!process.env.RESEND_API_KEY
  const aiConfigured = !!(
    process.env.OPENAI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.GEMINI_API_KEY
  )
  const mapsConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const paymentsConfigured = !!(
    process.env.PIXELPAY_API_KEY ||
    process.env.PAYPAL_CLIENT_ID
  )
  const uploadConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.BLOB_READ_WRITE_TOKEN
  )

  return NextResponse.json({
    success: true,
    data: {
      // ── API Identity ───────────────────────────────────────────────
      name: 'ProveedorConecta Nicaragua API',
      version: '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      region: process.env.VERCEL_REGION ?? 'unknown',
      runtime: 'Node.js (Vercel Serverless)',

      // ── Infrastructure Status ──────────────────────────────────────
      infra: {
        database: tursoConfigured ? 'Turso Cloud (libSQL)' : 'Local SQLite',
        realtime: pusherConfigured ? 'Pusher Channels' : 'Disabled',
        email: emailConfigured ? 'Resend' : 'Disabled',
        ai: aiConfigured ? 'Multi-provider AI (OpenAI/DeepSeek/Gemini)' : 'Disabled',
        maps: mapsConfigured ? 'Google Maps JS API' : 'Disabled (Leaflet fallback)',
        payments: paymentsConfigured ? 'PixelPay / PayPal' : 'Simulation mode',
        uploads: uploadConfigured ? 'Cloudinary / Vercel Blob' : 'Local fallback',
        cdn: 'Vercel Edge Network',
        security: 'CORS + CSP + Rate Limiting',
        backup: 'Turso Cloud Snapshots',
      },

      // ── Live Services ──────────────────────────────────────────────
      services: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage ? Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB' : 'N/A',
        uptime: process.uptime ? Math.round(process.uptime()) + 's' : 'N/A',
      },

      // ── API Routes ─────────────────────────────────────────────────
      endpoints: {
        auth: '/api/auth/*',
        products: '/api/products',
        payments: '/api/payments/gateways',
        chat: '/api/chat/*',
        weather: '/api/weather',
        calendar: '/api/calendar',
        reviews: '/api/reviews',
        admin: '/api/admin/*',
        export: '/api/export/*',
        backup: '/api/backup',
        ai: '/api/ai',
        cron: '/api/cron/commission-payout',
        health: '/api (this endpoint)',
      },
    },
  })
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
