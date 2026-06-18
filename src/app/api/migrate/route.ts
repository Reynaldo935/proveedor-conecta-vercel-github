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

    // ── Convert to Turso HTTP API endpoint ────────────────────────────
    // libsql://dunddy-xxx.turso.io → https://dunddy-xxx.turso.io
    const httpBase = tursoUrl
      .replace('libsql://', 'https://')
      .replace('.aws-us-east-1.turso.io', '') + '.aws-us-east-1.turso.io'

    // Ensure we have the full host
    const host = httpBase.startsWith('https://') ? httpBase.replace('https://', '') : httpBase

    // Turso HTTP API v3 endpoint
    const apiUrl = `https://${host}/v3/pipeline`

    async function tursoQuery(sql: string): Promise<void> {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tursoToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            { type: 'execute', stmt: { sql } },
          ],
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Turso HTTP ${res.status}: ${text.substring(0, 200)}`)
      }

      const data = await res.json()
      // Check for errors in response
      if (data.results?.[0]?.type === 'error') {
        throw new Error(`Turso error: ${data.results[0].error?.message || 'unknown'}`)
      }
    }

    // Check if tables already exist
    try {
      await tursoQuery('SELECT count(*) FROM "User"')
      return NextResponse.json({
        success: true,
        message: 'Database already initialized.',
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

    // Split into individual statements (SQLite CREATE TABLE etc)
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    // Execute each statement
    let ok = 0
    let failed = 0
    for (const stmt of statements) {
      try {
        await tursoQuery(stmt)
        ok++
      } catch (err) {
        failed++
        // If the error is just "table already exists", continue
        const msg = (err as Error).message
        if (msg.includes('already exists') || msg.includes('duplicate')) {
          ok++
          continue
        }
        console.error(`Stmt failed: ${msg.substring(0, 100)}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration: ${ok} ok, ${failed} failed out of ${statements.length}`,
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
