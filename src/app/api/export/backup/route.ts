import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeApiHandler } from '@/lib/api-utils'
import { getAuthenticatedUserId } from '@/lib/auth'

async function handleGet(request: NextRequest) {
  try {
    // Authentication check
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const [users, products, transactions, businessProfiles, chatRooms, messages, cotizaciones, notifications, likes, savedProducts, follows, auditLogs, advertisements, quantityDiscounts, commissionLogs] = await Promise.all([
      db.user.findMany({ select: { id: true, email: true, name: true, role: true, phone: true, department: true, address: true, isVerified: true, createdAt: true } }),
      db.product.findMany({ select: { id: true, title: true, price: true, discountPrice: true, category: true, status: true, sellerId: true, createdAt: true } }),
      db.transaction.findMany({ select: { id: true, amount: true, commission: true, sellerPayout: true, paymentMethod: true, status: true, buyerId: true, sellerId: true, productId: true, createdAt: true } }),
      db.businessProfile.findMany({ select: { id: true, businessName: true, category: true, address: true, phone: true, userId: true } }),
      db.chatRoom.findMany({ select: { id: true, buyerId: true, sellerId: true, lastMessage: true, lastMessageAt: true } }),
      db.message.findMany({ select: { id: true, chatRoomId: true, senderId: true, content: true, isRead: true, createdAt: true }, take: 500 }),
      db.cotizacion.findMany({ select: { id: true, title: true, category: true, status: true, buyerId: true, createdAt: true } }),
      db.notification.findMany({ select: { id: true, type: true, title: true, isRead: true, userId: true, createdAt: true }, take: 500 }),
      db.like.findMany({ select: { id: true, userId: true, productId: true, createdAt: true } }),
      db.savedProduct.findMany({ select: { id: true, userId: true, productId: true, createdAt: true } }),
      db.follow.findMany({ select: { id: true, followerId: true, followingId: true, createdAt: true } }),
      db.auditLog.findMany({ select: { id: true, action: true, entity: true, createdAt: true }, take: 500 }),
      db.advertisement.findMany({ select: { id: true, title: true, type: true, plan: true, status: true, sellerId: true, createdAt: true } }),
      db.quantityDiscount.findMany({ select: { id: true, productId: true, minQty: true, discountPercent: true } }),
      db.commissionLog.findMany({ select: { id: true, transactionId: true, amount: true, rate: true, status: true, createdAt: true } }),
    ])

    const backup = {
      metadata: {
        platform: 'ProveedorConecta Nicaragua',
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        hackathon: 'Hackathon Nicaragua 2026 - 10ma Edición',
      },
      summary: {
        users: users.length,
        products: products.length,
        transactions: transactions.length,
        businessProfiles: businessProfiles.length,
        chatRooms: chatRooms.length,
        messages: messages.length,
        cotizaciones: cotizaciones.length,
        likes: likes.length,
        savedProducts: savedProducts.length,
        follows: follows.length,
        advertisements: advertisements.length,
      },
      data: {
        users,
        products,
        transactions,
        businessProfiles,
        chatRooms,
        messages,
        cotizaciones,
        notifications,
        likes,
        savedProducts,
        follows,
        auditLogs,
        advertisements,
        quantityDiscounts,
        commissionLogs,
      },
    }

    const dateStr = new Date().toISOString().split('T')[0]
    const jsonStr = JSON.stringify(backup, null, 2)

    return new NextResponse(jsonStr, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename=backup_proveedorconecta_${dateStr}.json`,
      },
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ success: false, error: 'Error creating backup' }, { status: 500 })
  }
}

export const GET = safeApiHandler(handleGet)
