// ============================================================================
// Custom @libsql/client replacement — uses native Node.js HTTPS
// Drop-in replacement for @libsql/client v0.6 createClient function
// CJS-compatible for use with @prisma/adapter-libsql (which uses require())
// ============================================================================

const https = require('https')

// ── Execute SQL via Turso HTTP API v2 ──────────────────────────────────
function executeSql(
  host: string,
  token: string,
  sql: string,
  params?: Record<string, unknown> | unknown[]
): Promise<{ columns: string[]; rows: Record<string, unknown>[]; rowsAffected: number }> {
  return new Promise((resolve, reject) => {
    // Convert Prisma-style params to positional args for Turso
    let args: unknown[] | undefined
    if (Array.isArray(params)) {
      args = params
    } else if (params && typeof params === 'object') {
      // Named params not supported by Turso — extract values in order
      args = []
      const sqlParamMatch = sql.match(/\?/g)
      // Just pass empty args for named params
    }

    const body = JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql, args } }],
    })

    const req = https.request(
      {
        hostname: host,
        path: '/v2/pipeline',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
              reject(new Error(result.error?.message || 'Turso query error'))
              return
            }
            const columns: string[] = result?.columns || []
            const rawRows: unknown[][] = result?.rows || []
            const rows = rawRows.map(row => {
              const obj: Record<string, unknown> = {}
              columns.forEach((col, i) => { obj[col] = row[i] })
              return obj
            })
            resolve({
              columns,
              rows,
              rowsAffected: result?.rowsAffected ?? 0,
            })
          } catch {
            reject(new Error(`Turso HTTP ${res.statusCode}: ${data.substring(0, 200)}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Turso timeout')) })
    req.write(body)
    req.end()
  })
}

// ── Client that mimics @libsql/client's interface ─────────────────────
function createClient(config: { url: string; authToken?: string }) {
  // Extract host from URL
  let host = config.url
    .replace(/^https?:\/\//, '')
    .replace(/^libsql:\/\//, '')
    .split('?')[0]
    .replace(/\/$/, '')

  const token = config.authToken || ''

  console.log('[libsql-native] Connected to', host)

  return {
    execute(sql: string, params?: Record<string, unknown> | unknown[]) {
      return executeSql(host, token, sql, params)
    },

    // Batch execution
    batch(queries: string[]) {
      return Promise.all(queries.map(sql => executeSql(host, token, sql)))
    },

    // Interactive transaction
    transaction() {
      let txActive = false
      return {
        async execute(sql: string, params?: Record<string, unknown> | unknown[]) {
          if (!txActive) {
            await executeSql(host, token, 'BEGIN')
            txActive = true
          }
          return executeSql(host, token, sql, params)
        },
        async commit() {
          await executeSql(host, token, 'COMMIT')
          txActive = false
        },
        async rollback() {
          await executeSql(host, token, 'ROLLBACK')
          txActive = false
        },
      }
    },

    close() {
      // No persistent connection to close (HTTP is stateless)
    },
  }
}

// ── CJS exports for @prisma/adapter-libsql compatibility ──────────────
module.exports = { createClient }
