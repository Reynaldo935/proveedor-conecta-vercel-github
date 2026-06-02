/**
 * Script to push Prisma schema to Turso cloud database
 * Uses @libsql/client directly since Prisma CLI doesn't support libsql:// URLs
 */
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'

const TURSO_URL = process.env.TURSO_DATABASE_URL!
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set')
  process.exit(1)
}

async function main() {
  console.log('📡 Connecting to Turso...')
  console.log(`   URL: ${TURSO_URL}`)

  const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  })

  // Read the generated SQL
  const sql = readFileSync('/tmp/turso-schema.sql', 'utf-8')

  // Split by statements and execute each one
  // Remove comment lines but keep the actual SQL
  const statements = sql
    .split(';')
    .map(s => {
      // Remove comment-only lines, keep SQL
      return s.split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    })
    .filter(s => s.length > 0)

  console.log(`📋 Executing ${statements.length} SQL statements...`)

  let success = 0
  let skipped = 0
  let failed = 0

  for (const stmt of statements) {
    try {
      await client.execute(stmt)
      success++
      // Show progress for table creation
      if (stmt.includes('CREATE TABLE')) {
        const tableName = stmt.match(/CREATE TABLE "(\w+)"/)?.[1]
        console.log(`  ✅ Table: ${tableName}`)
      }
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        skipped++
      } else {
        failed++
        console.error(`  ❌ Error: ${error.message?.substring(0, 100)}`)
        console.error(`     SQL: ${stmt.substring(0, 80)}...`)
      }
    }
  }

  console.log(`\n📊 Results: ${success} executed, ${skipped} already existed, ${failed} failed`)

  // Verify by listing tables
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  console.log(`\n🗄️ Tables in Turso (${tables.rows.length}):`)
  for (const row of tables.rows) {
    console.log(`   - ${row.name}`)
  }

  client.close()
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
