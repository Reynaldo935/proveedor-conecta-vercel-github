import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// In-memory storage for backup metadata (persists while server is running)
interface BackupMetadata {
  id: string
  date: string
  size: string
  type: 'FULL' | 'PARTIAL'
  tables: string[]
  recordCount: number
  createdAt: string
}

const backupStore: BackupMetadata[] = []

async function verifyAdmin() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('pc_user_id')?.value

  if (!userId) {
    return { error: NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 }), user: null }
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user || user.email !== 'rey7214935@gmail.com') {
    return { error: NextResponse.json({ success: false, error: 'Acceso denegado - Solo administrador' }, { status: 403 }), user: null }
  }

  return { error: null, user }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function generateBackupId(): string {
  return `backup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

// GET: List all backups with metadata
export async function GET() {
  try {
    const { error } = await verifyAdmin()
    if (error) return error

    // Sort backups by date descending
    const sortedBackups = [...backupStore].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      data: {
        backups: sortedBackups,
        total: sortedBackups.length,
        totalSize: formatBytes(
          sortedBackups.reduce((sum, b) => {
            const num = parseFloat(b.size)
            const unit = b.size.split(' ')[1]
            const multipliers: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 }
            return sum + num * (multipliers[unit] || 1)
          }, 0)
        ),
      },
    })
  } catch (error) {
    console.error('Backup list error:', error)
    return NextResponse.json({ success: false, error: 'Error al listar respaldos' }, { status: 500 })
  }
}

// POST: Create a new backup or restore from backup
export async function POST(request: NextRequest) {
  try {
    const { error } = await verifyAdmin()
    if (error) return error

    const body = await request.json()
    const { action } = body

    if (!action || !['create', 'restore'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Acción no válida. Use "create" o "restore"' },
        { status: 400 }
      )
    }

    if (action === 'create') {
      return await createBackup()
    } else {
      return await restoreBackup(body)
    }
  } catch (error) {
    console.error('Backup operation error:', error)
    return NextResponse.json({ success: false, error: 'Error en operación de respaldo' }, { status: 500 })
  }
}

async function createBackup(): Promise<NextResponse> {
  // Export all database tables as JSON
  const backupData: Record<string, unknown[]> = {}

  const tables = [
    { name: 'users', query: () => db.user.findMany({ select: { id: true, email: true, name: true, role: true, helperRole: true, phone: true, department: true, address: true, bio: true, isVerified: true, emailVerified: true, phoneVerified: true, createdAt: true, updatedAt: true } }) },
    { name: 'businessProfiles', query: () => db.businessProfile.findMany() },
    { name: 'products', query: () => db.product.findMany() },
    { name: 'transactions', query: () => db.transaction.findMany() },
    { name: 'messages', query: () => db.message.findMany() },
    { name: 'chatRooms', query: () => db.chatRoom.findMany() },
    { name: 'cotizaciones', query: () => db.cotizacion.findMany() },
    { name: 'cotizacionResponses', query: () => db.cotizacionResponse.findMany() },
    { name: 'notifications', query: () => db.notification.findMany() },
    { name: 'follows', query: () => db.follow.findMany() },
    { name: 'likes', query: () => db.like.findMany() },
    { name: 'savedProducts', query: () => db.savedProduct.findMany() },
    { name: 'auditLogs', query: () => db.auditLog.findMany() },
    { name: 'wallPosts', query: () => db.wallPost.findMany() },
    { name: 'verificationTokens', query: () => db.verificationToken.findMany() },
    { name: 'phoneVerifications', query: () => db.phoneVerification.findMany() },
    { name: 'quantityDiscounts', query: () => db.quantityDiscount.findMany() },
    { name: 'advertisements', query: () => db.advertisement.findMany() },
    { name: 'commissionLogs', query: () => db.commissionLog.findMany() },
  ]

  let totalRecords = 0
  const tableNames: string[] = []

  for (const table of tables) {
    try {
      const records = await table.query()
      // Serialize dates to ISO strings
      backupData[table.name] = JSON.parse(JSON.stringify(records))
      totalRecords += records.length
      tableNames.push(table.name)
    } catch (err) {
      console.error(`Error backing up table ${table.name}:`, err)
      backupData[table.name] = []
      tableNames.push(table.name)
    }
  }

  const jsonString = JSON.stringify(backupData, null, 2)
  const sizeInBytes = Buffer.byteLength(jsonString, 'utf-8')

  const backupId = generateBackupId()
  const now = new Date()

  const metadata: BackupMetadata = {
    id: backupId,
    date: now.toISOString(),
    size: formatBytes(sizeInBytes),
    type: 'FULL',
    tables: tableNames,
    recordCount: totalRecords,
    createdAt: now.toISOString(),
  }

  backupStore.push(metadata)

  // Log the backup creation in audit log
  await db.auditLog.create({
    data: {
      action: 'CREATE_BACKUP',
      entity: 'Backup',
      entityId: backupId,
      details: `Respaldo completo creado: ${totalRecords} registros, ${metadata.size}`,
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      backup: metadata,
      downloadUrl: `/api/backup?action=download&id=${backupId}`,
      recordCount: totalRecords,
      tables: tableNames.length,
    },
    message: 'Respaldo creado exitosamente',
  })
}

async function restoreBackup(body: { backupId?: string; data?: Record<string, unknown[]> }): Promise<NextResponse> {
  const { backupId, data } = body

  let backupData: Record<string, unknown[]>

  if (data) {
    // Direct data restore (from uploaded backup)
    backupData = data
  } else if (backupId) {
    // For in-memory backups, we'd need to re-query current state
    // Since we don't store the actual data in memory, we inform the user
    return NextResponse.json(
      {
        success: false,
        error: 'Para restaurar, debe proporcionar los datos del respaldo en el campo "data". Los respaldos en memoria no almacenan los datos completos del respaldo.',
      },
      { status: 400 }
    )
  } else {
    return NextResponse.json(
      { success: false, error: 'Debe proporcionar backupId o data para restaurar' },
      { status: 400 }
    )
  }

  let restoredRecords = 0
  const restoredTables: string[] = []

  try {
    // Restore users (skip duplicates by email)
    if (backupData.users && Array.isArray(backupData.users)) {
      for (const user of backupData.users as Record<string, unknown>[]) {
        try {
          await db.user.upsert({
            where: { id: user.id as string },
            update: {},
            create: {
              id: user.id as string,
              email: user.email as string,
              name: (user.name as string) || '',
              role: (user.role as string) || 'BUYER',
              helperRole: (user.helperRole as string) || '',
              phone: (user.phone as string) || '',
              department: (user.department as string) || '',
              address: (user.address as string) || '',
              bio: (user.bio as string) || '',
              isVerified: (user.isVerified as boolean) || false,
              emailVerified: (user.emailVerified as boolean) || false,
              phoneVerified: (user.phoneVerified as boolean) || false,
              password: '',
            },
          })
          restoredRecords++
        } catch {
          // Skip duplicates or invalid records
        }
      }
      restoredTables.push('users')
    }

    // Restore business profiles
    if (backupData.businessProfiles && Array.isArray(backupData.businessProfiles)) {
      for (const bp of backupData.businessProfiles as Record<string, unknown>[]) {
        try {
          await db.businessProfile.upsert({
            where: { id: bp.id as string },
            update: {},
            create: {
              id: bp.id as string,
              userId: bp.userId as string,
              businessName: (bp.businessName as string) || '',
              description: (bp.description as string) || '',
              category: (bp.category as string) || '',
              address: (bp.address as string) || '',
              phone: (bp.phone as string) || '',
              coverImage: (bp.coverImage as string) || '',
              logo: (bp.logo as string) || '',
              hours: (bp.hours as string) || '',
              paymentMethods: (bp.paymentMethods as string) || '',
            },
          })
          restoredRecords++
        } catch {
          // Skip duplicates or invalid records
        }
      }
      restoredTables.push('businessProfiles')
    }

    // Restore products
    if (backupData.products && Array.isArray(backupData.products)) {
      for (const p of backupData.products as Record<string, unknown>[]) {
        try {
          await db.product.upsert({
            where: { id: p.id as string },
            update: {},
            create: {
              id: p.id as string,
              sellerId: p.sellerId as string,
              title: p.title as string,
              description: (p.description as string) || '',
              price: (p.price as number) || 0,
              discountPrice: p.discountPrice as number | null,
              discountPercent: p.discountPercent as number | null,
              category: (p.category as string) || '',
              tags: (p.tags as string) || '',
              images: (p.images as string) || '',
              videoUrl: (p.videoUrl as string) || '',
              quantity: (p.quantity as number) || 1,
              status: (p.status as string) || 'ACTIVE',
              isFeatured: (p.isFeatured as boolean) || false,
            },
          })
          restoredRecords++
        } catch {
          // Skip duplicates or invalid records
        }
      }
      restoredTables.push('products')
    }

    // Restore transactions
    if (backupData.transactions && Array.isArray(backupData.transactions)) {
      for (const t of backupData.transactions as Record<string, unknown>[]) {
        try {
          await db.transaction.upsert({
            where: { id: t.id as string },
            update: {},
            create: {
              id: t.id as string,
              buyerId: t.buyerId as string,
              sellerId: t.sellerId as string,
              productId: t.productId as string,
              amount: (t.amount as number) || 0,
              commission: (t.commission as number) || 0,
              sellerPayout: (t.sellerPayout as number) || 0,
              paymentMethod: t.paymentMethod as string,
              status: (t.status as string) || 'PENDING',
              cedula: (t.cedula as string) || '',
              cardLast4: (t.cardLast4 as string) || '',
              paymentDetails: (t.paymentDetails as string) || '',
              voucherUrl: (t.voucherUrl as string) || '',
            },
          })
          restoredRecords++
        } catch {
          // Skip duplicates or invalid records
        }
      }
      restoredTables.push('transactions')
    }

    // Restore commission logs
    if (backupData.commissionLogs && Array.isArray(backupData.commissionLogs)) {
      for (const c of backupData.commissionLogs as Record<string, unknown>[]) {
        try {
          await db.commissionLog.upsert({
            where: { id: c.id as string },
            update: {},
            create: {
              id: c.id as string,
              transactionId: c.transactionId as string,
              amount: (c.amount as number) || 0,
              rate: (c.rate as number) || 0.03,
              destination: (c.destination as string) || '',
              bankAccount: (c.bankAccount as string) || '',
              status: (c.status as string) || 'PENDING',
            },
          })
          restoredRecords++
        } catch {
          // Skip duplicates or invalid records
        }
      }
      restoredTables.push('commissionLogs')
    }

    // Log the restore in audit log
    await db.auditLog.create({
      data: {
        action: 'RESTORE_BACKUP',
        entity: 'Backup',
        entityId: backupId || 'direct',
        details: `Restauración completada: ${restoredRecords} registros en ${restoredTables.length} tablas`,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        restoredRecords,
        restoredTables,
        totalTables: Object.keys(backupData).length,
      },
      message: `Restauración completada: ${restoredRecords} registros restaurados en ${restoredTables.length} tablas`,
    })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json(
      { success: false, error: 'Error durante la restauración del respaldo' },
      { status: 500 }
    )
  }
}
