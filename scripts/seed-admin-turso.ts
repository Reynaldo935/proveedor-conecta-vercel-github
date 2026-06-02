/**
 * Seed Admin User to Turso Cloud Database
 *
 * This script connects directly to the Turso Cloud database using @libsql/client
 * and ensures the admin user exists with a properly hashed password.
 *
 * Usage: cd /home/z/my-project && bun run scripts/seed-admin-turso.ts
 */

import { createClient, type Client } from '@libsql/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

// ─── Turso Cloud Configuration ───────────────────────────────────────────────
const TURSO_URL = 'libsql://proveedor-conecta-reynaldo935.aws-us-east-1.turso.io'
const TURSO_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAwMzcxMzAsImlkIjoiMDE5ZTcyNzktYTcwMS03MThmLTk5YmYtYzNiY2I2OTA3MjgzIiwicmlkIjoiMTQ0YjU2OTAtNjA0Mi00YjIxLTk2NjctYTkwMThkM2RkMzg3In0.2ZpYlSGPYeemAI3ra752LPvBF0HW60-5k5cwXrg0VdUghuwnWH50K4SIa9vn4IouYO3oi2iuK0Bo6JC4HWKpBA'

// ─── Admin User Configuration ────────────────────────────────────────────────
const ADMIN_EMAIL = 'rey7214935@gmail.com'
const ADMIN_NAME = 'Reynaldo Admin'
const ADMIN_PASSWORD = 'admin123'
const ADMIN_ROLE = 'ADMIN'

async function main() {
  console.log('🚀 Connecting to Turso Cloud database...')
  console.log(`   URL: ${TURSO_URL}`)

  const client: Client = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  })

  try {
    // ─── Step 1: Check if admin user already exists ───────────────────────
    console.log(`\n🔍 Checking if admin user exists (${ADMIN_EMAIL})...`)

    const existingUser = await client.execute({
      sql: 'SELECT id, email, name, role FROM User WHERE email = ?',
      args: [ADMIN_EMAIL],
    })

    if (existingUser.rows.length > 0) {
      const row = existingUser.rows[0]
      console.log('✅ Admin user already exists in Turso Cloud:')
      console.log(`   ID:    ${row.id}`)
      console.log(`   Email: ${row.email}`)
      console.log(`   Name:  ${row.name}`)
      console.log(`   Role:  ${row.role}`)

      // Verify the role is ADMIN
      if (row.role !== ADMIN_ROLE) {
        console.log(`\n⚠️  Admin user exists but role is "${row.role}", updating to "${ADMIN_ROLE}"...`)
        await client.execute({
          sql: 'UPDATE User SET role = ?, updatedAt = CURRENT_TIMESTAMP WHERE email = ?',
          args: [ADMIN_ROLE, ADMIN_EMAIL],
        })
        console.log('✅ Role updated to ADMIN')
      }

      // Check if business profile exists
      const existingProfile = await client.execute({
        sql: 'SELECT id, businessName FROM BusinessProfile WHERE userId = ?',
        args: [String(row.id)],
      })

      if (existingProfile.rows.length > 0) {
        console.log(`   Business Profile: ${existingProfile.rows[0].businessName}`)
      } else {
        console.log('\n⚠️  Admin user has no business profile. Creating one...')
        await createBusinessProfile(client, String(row.id))
      }

      // Verify password works by re-hashing and updating if needed
      console.log('\n🔐 Updating admin password to ensure correct hash...')
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
      await client.execute({
        sql: 'UPDATE User SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE email = ?',
        args: [passwordHash, ADMIN_EMAIL],
      })
      console.log('✅ Password hash updated successfully')

      return
    }

    // ─── Step 2: Admin user doesn't exist, create it ─────────────────────
    console.log('❌ Admin user not found. Creating new admin user...')

    // Generate password hash
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    console.log(`🔐 Password hashed (bcrypt, 12 rounds)`)

    // Generate unique ID (using cuid-like format)
    const adminId = `cl${randomUUID().replace(/-/g, '').slice(0, 22)}`
    console.log(`   Generated ID: ${adminId}`)

    // Insert admin user
    await client.execute({
      sql: `INSERT INTO User (
        id, email, name, password, role, helperRole, avatar, coverPhoto,
        phone, department, address, bio, website, isVerified, emailVerified,
        phoneVerified, balance, googleId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [
        adminId,
        ADMIN_EMAIL,
        ADMIN_NAME,
        passwordHash,
        ADMIN_ROLE,
        'FULLSTACK',       // helperRole
        '',                 // avatar
        '',                 // coverPhoto
        '8999-0000',        // phone
        'Managua',          // department
        'Managua, Nicaragua', // address
        'Administrador principal de ProveedorConecta Nicaragua', // bio
        '',                 // website
        1,                  // isVerified (SQLite uses 1/0)
        1,                  // emailVerified
        0,                  // phoneVerified
        100000,             // balance (NIO)
        null,               // googleId
      ],
    })

    console.log('✅ Admin user created successfully!')
    console.log(`   ID:    ${adminId}`)
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(`   Name:  ${ADMIN_NAME}`)
    console.log(`   Role:  ${ADMIN_ROLE}`)

    // ─── Step 3: Create Business Profile for admin ───────────────────────
    await createBusinessProfile(client, adminId)

    // ─── Step 4: Verify the insertion ────────────────────────────────────
    console.log('\n🔍 Verifying admin user in database...')
    const verifyUser = await client.execute({
      sql: 'SELECT id, email, name, role, isVerified, emailVerified, balance FROM User WHERE email = ?',
      args: [ADMIN_EMAIL],
    })

    if (verifyUser.rows.length > 0) {
      const v = verifyUser.rows[0]
      console.log('✅ Verification successful:')
      console.log(`   ID:            ${v.id}`)
      console.log(`   Email:         ${v.email}`)
      console.log(`   Name:          ${v.name}`)
      console.log(`   Role:          ${v.role}`)
      console.log(`   isVerified:    ${v.isVerified}`)
      console.log(`   emailVerified: ${v.emailVerified}`)
      console.log(`   Balance:       C$${v.balance}`)
    } else {
      console.log('❌ ERROR: Admin user not found after insertion!')
    }

    console.log('\n📧 Admin credentials:')
    console.log(`   Email:    ${ADMIN_EMAIL}`)
    console.log(`   Password: ${ADMIN_PASSWORD}`)
  } catch (error) {
    console.error('❌ Error seeding admin to Turso:', error)
    process.exit(1)
  } finally {
    client.close()
  }
}

async function createBusinessProfile(client: Client, userId: string) {
  const profileId = `cl${randomUUID().replace(/-/g, '').slice(0, 22)}`

  console.log(`\n🏢 Creating business profile for admin (${profileId})...`)

  await client.execute({
    sql: `INSERT INTO BusinessProfile (
      id, userId, businessName, description, category, address,
      latitude, longitude, phone, coverImage, logo, hours,
      paymentMethods, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [
      profileId,
      userId,
      'ProveedorConecta Nicaragua - Admin',                    // businessName
      'Administrador principal de la plataforma ProveedorConecta Nicaragua', // description
      'Tecnología y Electrónica',                                // category
      'Managua, Nicaragua',                                      // address
      12.1364,                                                    // latitude
      -86.2514,                                                   // longitude
      '8999-0000',                                               // phone
      '',                                                         // coverImage
      '',                                                         // logo
      '',                                                         // hours
      JSON.stringify(['PAYPAL', 'BANPRO', 'BAC', 'LAFISE', 'BILLETERA']), // paymentMethods
    ],
  })

  console.log('✅ Business profile created:')
  console.log(`   Business: ProveedorConecta Nicaragua - Admin`)
  console.log(`   Category: Tecnología y Electrónica`)
  console.log(`   Address:  Managua, Nicaragua`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
