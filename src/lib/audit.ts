import { db } from './db'

type AuditAction = 
  | 'LOGIN' | 'LOGOUT' | 'REGISTER' 
  | 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT'
  | 'PAYMENT' | 'COMMISSION' | 'REFUND'
  | 'CREATE_CHAT' | 'SEND_MESSAGE'
  | 'CREATE_COTIZACION' | 'RESPOND_COTIZACION'
  | 'CREATE_AD' | 'APPROVE_AD' | 'REJECT_AD'
  | 'UPDATE_USER' | 'UPDATE_BALANCE'
  | 'REVIEW' | 'FOLLOW' | 'LIKE'
  | 'BACKUP' | 'EXPORT'

interface AuditLogData {
  userId?: string
  action: AuditAction | string
  entity: string
  entityId?: string
  details?: string
  ip?: string
  userAgent?: string
}

/**
 * Create an audit log entry. Non-blocking — errors are logged but don't throw.
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId || '',
        details: data.details || '',
        ip: data.ip || '',
        userAgent: data.userAgent || '',
      },
    })
  } catch (error) {
    console.error('[Audit] Failed to create audit log:', error)
  }
}

/**
 * Extract IP address from a Next.js request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return 'unknown'
}

/**
 * Extract user agent from a Next.js request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown'
}
