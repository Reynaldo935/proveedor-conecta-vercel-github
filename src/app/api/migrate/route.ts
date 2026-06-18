import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    const tursoUrl = process.env.TURSO_DATABASE_URL
    const tursoToken = process.env.TURSO_AUTH_TOKEN

    if (!tursoUrl || !tursoToken) {
      return NextResponse.json({
        success: false,
        error: 'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set',
        hint: 'POST /api/migrate to run migration against Turso',
      }, { status: 200 })
    }

    // Try to connect directly via libsql client
    const { createClient } = await import('@libsql/client')
    const client = createClient({ url: tursoUrl, authToken: tursoToken })

    // Check if tables already exist
    try {
      const r = await client.execute("SELECT count(*) as c FROM User")
      return NextResponse.json({
        success: true,
        message: `DB already initialized. ${r.rows[0]?.c ?? 0} users.`,
        alreadySeeded: true,
      })
    } catch {
      // Tables don't exist — proceed
    }

    // Read the migration SQL file
    const sqlPath = path.join(process.cwd(), 'prisma', 'migrations', '20260618100830_init', 'migration.sql')
    if (!fs.existsSync(sqlPath)) {
      return NextResponse.json({
        success: false,
        error: 'Migration file not found: ' + sqlPath,
      }, { status: 500 })
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // Execute the entire migration as a batch
    const result = await client.execute(sql)

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully.',
      rowsAffected: result.rowsAffected ?? 0,
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
    }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'POST to /api/migrate to run database migration',
  })
}
