import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/setup — Check the database setup status.
 */
export async function GET() {
  try {
    const userCount = await db.user.count()
    const productCount = await db.product.count()

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        hasData: userCount > 0,
        userCount,
        productCount,
        tursoConfigured: !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN),
        needsSetup: userCount === 0,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      success: false,
      data: {
        connected: false,
        hasData: false,
        userCount: 0,
        productCount: 0,
        tursoConfigured: !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN),
        needsSetup: true,
        error: msg,
      },
    }, { status: 200 })
  }
}

/**
 * POST /api/setup — Trigger database setup (auto-seed if empty).
 */
export async function POST() {
  try {
    const userCount = await db.user.count()

    if (userCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Database is empty. Run seed script.',
        hint: 'Run "bun run db:push && bun run db:seed" locally, or set up Turso and redeploy.',
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database has data. No seeding needed.',
      data: {
        userCount: await db.user.count(),
        productCount: await db.product.count(),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      success: false,
      error: `Setup failed: ${msg}`,
    }, { status: 500 })
  }
}
