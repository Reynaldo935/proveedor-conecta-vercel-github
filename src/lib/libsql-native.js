// Custom @libsql/client replacement — uses native Node.js HTTPS
// Drop-in replacement for @libsql/client v0.6 createClient function
//
// Why: @libsql/client@0.6.2 uses deprecated Hrana protocol (HTTP 400 from Turso)
// This module talks the raw Turso HTTP API directly.
//
// Interface: matches what @prisma/adapter-libsql v6 expects:
//   { execute(sql, args) => Promise<{ rows: any[], columns: string[] }> }

const https = require('https')
const { URL } = require('url')

function tursoRequest(host, token, sql, args) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ statements: [{ sql, args }] })
    const url = new URL(`https://${host}/v2/pipeline`)
    
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 15000
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.error) {
            reject(new Error(result.error?.message || 'Turso query error'))
            return
          }
          const stmt = result.results?.[0]
          if (stmt?.response?.result) {
            resolve({
              rows: stmt.response.result.rows?.map(r => 
                r.map(c => c?.value ?? null)
              ) ?? [],
              columns: stmt.response.result.cols?.map(c => c.name) ?? []
            })
          } else {
            resolve({ rows: [], columns: [] })
          }
        } catch (e) {
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

module.exports = { createClient }
