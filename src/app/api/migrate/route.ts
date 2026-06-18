import { NextResponse } from 'next/server'
import https from 'https'

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

    // ── Convert libsql:// to https:// host ────────────────────────────
    // URL might be: libsql://host.turso.io OR libsql://host.turso.io?authToken=xxx
    let host = tursoUrl
    // Remove protocol
    host = host.replace(/^libsql:\/\//, '')
    // Remove authToken query param if present
    host = host.split('?')[0]
    // Remove trailing slash
    host = host.replace(/\/$/, '')
    const apiPath = '/v2/pipeline'

    // ── Core tables SQL (minimal set needed for the app) ──────────────
    const createTables = [
      `CREATE TABLE IF NOT EXISTS "User" ("id" TEXT PRIMARY KEY, "email" TEXT UNIQUE NOT NULL, "name" TEXT DEFAULT '', "password" TEXT, "role" TEXT DEFAULT 'BUYER', "helperRole" TEXT DEFAULT '', "avatar" TEXT DEFAULT '', "coverPhoto" TEXT DEFAULT '', "phone" TEXT DEFAULT '', "department" TEXT DEFAULT '', "address" TEXT DEFAULT '', "bio" TEXT DEFAULT '', "website" TEXT DEFAULT '', "isVerified" INTEGER DEFAULT 0, "googleId" TEXT, "emailVerified" INTEGER DEFAULT 0, "phoneVerified" INTEGER DEFAULT 0, "balance" REAL DEFAULT 50000, "createdAt" TEXT DEFAULT (datetime('now')), "updatedAt" TEXT DEFAULT (datetime('now')))`,
      `CREATE TABLE IF NOT EXISTS "BusinessProfile" ("id" TEXT PRIMARY KEY, "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "businessName" TEXT DEFAULT '', "description" TEXT DEFAULT '', "category" TEXT DEFAULT '', "address" TEXT DEFAULT '', "latitude" REAL, "longitude" REAL, "phone" TEXT DEFAULT '', "coverImage" TEXT DEFAULT '', "logo" TEXT DEFAULT '', "hours" TEXT DEFAULT '', "paymentMethods" TEXT DEFAULT '', "createdAt" TEXT DEFAULT (datetime('now')), "updatedAt" TEXT DEFAULT (datetime('now')))`,
      `CREATE TABLE IF NOT EXISTS "Product" ("id" TEXT PRIMARY KEY, "sellerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "title" TEXT NOT NULL, "description" TEXT DEFAULT '', "price" REAL NOT NULL, "discountPrice" REAL, "discountPercent" REAL, "category" TEXT DEFAULT '', "tags" TEXT DEFAULT '', "images" TEXT DEFAULT '', "videoUrl" TEXT DEFAULT '', "quantity" INTEGER DEFAULT 1, "status" TEXT DEFAULT 'ACTIVE', "isFeatured" INTEGER DEFAULT 0, "discountStart" TEXT, "discountEnd" TEXT, "publishedAt" TEXT DEFAULT (datetime('now')), "createdAt" TEXT DEFAULT (datetime('now')), "updatedAt" TEXT DEFAULT (datetime('now')))`,
    ]

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
                // If response is not JSON, check HTTP status
                if (res.statusCode === 200) {
                  resolve({ success: true })
                } else {
                  resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.substring(0, 100)}` })
                }
              }
            })
          }
        )

        req.on('error', (err) => resolve({ success: false, error: err.message }))
        req.on('timeout', () => {
          req.destroy()
          resolve({ success: false, error: 'Request timeout' })
        })
        req.write(body)
        req.end()
      })
    }

    let created = 0
    let errors: string[] = []
    for (const sql of createTables) {
      const r = await tursoRequest(sql)
      if (r.success) created++
      else {
        errors.push(r.error || 'unknown')
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: `Core tables: ${created}/${createTables.length} created`,
      errors: errors.length > 0 ? errors : undefined,
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
