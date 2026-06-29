/**
 * POST /api/export/admin-backup
 * 
 * Admin-only full database backup export.
 * Returns all tables as JSON with download capability.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

async function verifyAdmin(request: NextRequest): Promise<{ authorized: boolean; userId?: string }> {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return { authorized: false }
  await setAuthCookie(userId)
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!user || user.role !== 'ADMIN') return { authorized: false }
  return { authorized: true, userId }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized } = await verifyAdmin(request)
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Acceso denegado - Solo administrador' }, { status: 200 })
    }

    const body = await request.json()
    const { format = 'json', scope = 'full' } = body

    const backupData: Record<string, unknown[]> = {}
    let totalRecords = 0

    const tables: { name: string; query: () => Promise<unknown[]> }[] = [
      { name: 'users', query: () => db.user.findMany({ select: { id: true, email: true, name: true, role: true, phone: true, department: true, address: true, bio: true, avatar: true, balance: true, isVerified: true, createdAt: true, updatedAt: true } }) },
      { name: 'businessProfiles', query: () => db.businessProfile.findMany() },
      { name: 'products', query: () => db.product.findMany() },
      { name: 'transactions', query: () => db.transaction.findMany() },
      { name: 'messages', query: () => db.message.findMany({ take: scope === 'full' ? 10000 : 1000 }) },
      { name: 'chatRooms', query: () => db.chatRoom.findMany() },
      { name: 'cotizaciones', query: () => db.cotizacion.findMany() },
      { name: 'cotizacionResponses', query: () => db.cotizacionResponse.findMany() },
      { name: 'notifications', query: () => db.notification.findMany() },
      { name: 'follows', query: () => db.follow.findMany() },
      { name: 'likes', query: () => db.like.findMany() },
      { name: 'savedProducts', query: () => db.savedProduct.findMany() },
      { name: 'auditLogs', query: () => db.auditLog.findMany() },
      { name: 'commissionLogs', query: () => db.commissionLog.findMany() },
      { name: 'reviews', query: () => db.review.findMany() },
    ]

    for (const table of tables) {
      try {
        const records = await table.query()
        backupData[table.name] = JSON.parse(JSON.stringify(records))
        totalRecords += records.length
      } catch (err) {
        console.error(`Error backing up ${table.name}:`, err)
        backupData[table.name] = []
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: 'system',
        action: 'ADMIN_BACKUP',
        entity: 'Backup',
        entityId: `backup-${Date.now()}`,
        details: `Respaldo administrativo: ${totalRecords} registros, ${tables.length} tablas`,
      },
    })

    if (format === 'csv') {
      // Build multi-table CSV
      const csvParts: string[] = [`# ProveedorConecta Nicaragua — Full Backup — ${new Date().toISOString()}`, '']
      for (const table of tables) {
        const records = backupData[table.name] as Record<string, unknown>[]
        if (records.length > 0) {
          csvParts.push(`# TABLE: ${table.name} (${records.length} records)`)
          csvParts.push(Object.keys(records[0]).join(','))
          csvParts.push(...records.map(r =>
            Object.values(r).map(v => {
              if (v === null || v === undefined) return ''
              const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
              return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s
            }).join(',')
          ))
          csvParts.push('')
        }
      }
      return new NextResponse(csvParts.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="proveedorconecta-admin-backup-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        totalRecords,
        tables: Object.keys(backupData).length,
        backup: backupData,
      },
    })
  } catch (error) {
    console.error('Admin backup error:', error)
    return NextResponse.json({ success: false, message: 'Error al crear respaldo administrativo' }, { status: 200 })
  }
}
