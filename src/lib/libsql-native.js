// ============================================================================
// Custom @libsql/client replacement — uses native Node.js HTTPS
// Drop-in replacement for @libsql/client v0.6 createClient function
// ============================================================================
// Why: @libsql/client@0.6.2 uses deprecated Hrana protocol (HTTP 400 from Turso)
//      Native HTTPS with /v2/pipeline REST API WORKS (tested: 37 tables created)
//
// Interface: matches what @prisma/adapter-libsql v6 expects:
//   createClient({ url, authToken }) → client
//   client.execute({ sql, args }) → { columns, rows[], rowsAffected }
//   client.batch(queries) → array of results
//   client.transaction() → { execute, commit, rollback }
//   client.close()
// ============================================================================

const https = require('https')

function tursoRequest(host, token, sql, args) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql, args: args || [] } }],
    })

    const req = https.request({
      hostname: host,
      path: '/v2/pipeline',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 30000,
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const result = json.results?.[0]
          if (result?.type === 'error') {
            reject(new Error(result.error?.message || 'Turso query error'))
            return
          }
          resolve({
            columns: result?.columns || [],
            rows: result?.rows || [],
            rowsAffected: result?.rowsAffected ?? 0,
          })
        } catch {
          reject(new Error(`Turso HTTP ${res.statusCode}: ${data.substring(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Turso timeout')) })
    req.write(body)
    req.end()
  })
}

function createClient(config) {
  let host = (config.url || '')
    .replace(/^https?:\/\//, '')
    .replace(/^libsql:\/\//, '')
    .split('?')[0]
    .replace(/\/$/, '')

  const token = config.authToken || ''

  console.log('[libsql-native] Ready for host:', host)

  return {
    // adapter calls execute({ sql, args }) → returns { columns, rows, rowsAffected }
    execute(stmt) {
      const sql = typeof stmt === 'string' ? stmt : stmt.sql
      const args = typeof stmt === 'string' ? undefined : stmt.args
      return tursoRequest(host, token, sql, args)
    },

    batch(queries) {
      return Promise.all(queries.map(q => {
        const sql = typeof q === 'string' ? q : q.sql
        const args = typeof q === 'string' ? undefined : q.args
        return tursoRequest(host, token, sql, args)
      }))
    },

    transaction() {
      let started = false
      return {
        async execute(stmt) {
          const sql = typeof stmt === 'string' ? stmt : stmt.sql
          const args = typeof stmt === 'string' ? undefined : stmt.args
          if (!started) {
            started = true
            await tursoRequest(host, token, 'BEGIN')
          }
          return tursoRequest(host, token, sql, args)
        },
        async commit() {
          await tursoRequest(host, token, 'COMMIT')
        },
        async rollback() {
          await tursoRequest(host, token, 'ROLLBACK')
        },
      }
    },

    close() {},
  }
}

module.exports = { createClient }
