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
      }, { status: 200 })
    }

    // ── Convert libsql:// URL to https:// for @libsql/client v0.6 ──────
    let httpUrl = tursoUrl
    if (tursoUrl.startsWith('libsql://')) {
      httpUrl = tursoUrl.replace('libsql://', 'https://')
    }

    // Try to connect directly via libsql client
    const { createClient } = await import('@libsql/client')
    const client = createClient({ url: httpUrl, authToken: tursoToken })

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
      return NextResponse.json({ success: false, error: 'Migration file not found' }, { status: 500 })
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // Build batched SQL: disable FK checks, run all, re-enable
    const batchedSql = 'PRAGMA foreign_keys = OFF;\n' + sql + '\nPRAGMA foreign_keys = ON;'

    try {
      await client.execute(batchedSql)
      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully.',
      })
    } catch (batchErr) {
      // Batch failed — try statement by statement
      const statements = sql
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      // Disable foreign keys for individual execution too
      await client.execute('PRAGMA foreign_keys = OFF')

      let executed = 0
      for (const stmt of statements) {
        try {
          await client.execute(stmt)
          executed++
        } catch (err) {
          // Log but continue - some statements may fail due to ordering
          console.error(`Stmt ${executed + 1} failed: ${(err as Error).message}`)
        }
      }

      await client.execute('PRAGMA foreign_keys = ON')

      return NextResponse.json({
        success: true,
        message: `Migration complete. ${executed}/${statements.length} statements executed.`,
      })
    }
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
