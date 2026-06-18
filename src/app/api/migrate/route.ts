import { NextResponse } from 'next/server'
import https from 'https'
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
        debug: { urlFirst20: tursoUrl?.substring(0, 20), tokenFirst20: tursoToken?.substring(0, 20) }
      }, { status: 200 })
    }

    // ── Convert libsql:// to https:// host ────────────────────────────
    let host = tursoUrl
      .replace(/^libsql:\/\//, '')
      .split('?')[0]
      .replace(/\/$/, '')
    const apiPath = '/v2/pipeline'

    const debugInfo = {
      urlFirst30: tursoUrl?.substring(0, 30),
      hostUsed: host,
      tokenFirst20: tursoToken?.substring(0, 20),
    }

    function tursoRequest(sql: string): Promise<{ success: boolean; error?: string }> {
      return new Promise((resolve) => {
        const body = JSON.stringify({
          requests: [{ type: 'execute', stmt: { sql } }],
        })
        const req = https.request(
          {
            hostname: host,
            path: apiPath,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tursoToken}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body),
            },
            timeout: 30000,
          },
          (res) => {
            let data = ''
            res.on('data', (chunk) => data += chunk)
            res.on('end', () => {
              try {
                const json = JSON.parse(data)
                const result = json.results?.[0]
                if (result?.type === 'error') {
                  resolve({ success: false, error: result.error?.message || 'Turso error' })
                } else {
                  resolve({ success: true })
                }
              } catch {
                resolve({ success: res.statusCode === 200, error: `HTTP ${res.statusCode}` })
              }
            })
          }
        )
        req.on('error', (err) => resolve({ success: false, error: err.message }))
        req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }) })
        req.write(body)
        req.end()
      })
    }

    // ── Read full Prisma migration SQL ────────────────────────────────
    const sqlPath = path.join(process.cwd(), 'prisma', 'migrations', '20260618100830_init', 'migration.sql')
    if (!fs.existsSync(sqlPath)) {
      return NextResponse.json({ success: false, error: 'Migration file not found' }, { status: 500 })
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8')
    
    // Split by ); followed by newline and -- (separates each CREATE TABLE)
    const normalized = sql.replace(/\r\n/g, '\n')
    // Strategy: extract each complete statement (CREATE TABLE ... ); or CREATE UNIQUE INDEX ... ;)
    const statements: string[] = []
    let current = ''
    const lines = normalized.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('--')) continue
      current += (current ? ' ' : '') + trimmed
      if (trimmed.endsWith(');') || trimmed.endsWith(';')) {
        statements.push(current)
        current = ''
      }
    }
    if (current.trim()) statements.push(current.trim())

    let created = 0
    let failed = 0
    let errorMsgs: string[] = []
    
    for (const stmt of statements) {
      const r = await tursoRequest(stmt)
      if (r.success) created++
      else {
        // "already exists" is OK
        if (r.error?.toLowerCase().includes('already exists')) {
          created++
        } else {
          failed++
          if (errorMsgs.length < 3) errorMsgs.push(r.error || 'unknown')
        }
      }
    }

    return NextResponse.json({
      success: failed === 0,
      message: `Migration: ${created} ok, ${failed} failed (${statements.length} total)`,
      debug: debugInfo,
      errors: errorMsgs.length > 0 ? errorMsgs : undefined,
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
    message: 'POST to /api/migrate to create core database tables',
  })
}
