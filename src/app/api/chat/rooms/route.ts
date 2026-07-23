import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const rooms = await db.chatRoom.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true, logo: true } } } },
        product: { select: { id: true, title: true, images: true, price: true, discountPrice: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, content: true, senderId: true, createdAt: true, isRead: true },
        },
        _count: {
          select: { messages: { where: { isRead: false, senderId: { not: userId } } } },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: rooms.map(r => ({
        ...r,
        product: r.product ? { ...r.product, images: (() => { try { return r.product.images ? JSON.parse(r.product.images) : [] } catch { return [] } })() } : null,
        unreadCount: r._count.messages,
        _count: undefined,
        otherUser: r.buyerId === userId
          ? { id: r.seller.id, name: r.seller.name, avatar: r.seller.avatar, businessName: r.seller.businessProfile?.businessName, logo: r.seller.businessProfile?.logo }
          : { id: r.buyer.id, name: r.buyer.name, avatar: r.buyer.avatar },
      })),
    })
  } catch (error) {
    console.error('Get chat rooms error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener chats' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const body = await request.json()
    const { participantId, productId, message } = body
    // Also support legacy `sellerId` parameter
    const legacySellerId: string | undefined = body.sellerId

    // Support both old `sellerId` and new `participantId` params
    const otherUserId = participantId || legacySellerId

    if (!otherUserId) {
      return NextResponse.json({ success: false, error: 'ID de usuario requerido' }, { status: 200 })
    }

    if (otherUserId === userId) {
      return NextResponse.json({ success: false, error: 'No puedes iniciar un chat contigo mismo' }, { status: 200 })
    }

    // Verify other user exists
    const otherUser = await db.user.findUnique({ where: { id: otherUserId } })
    if (!otherUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 200 })
    }

    // Determine buyer/seller roles for the room
    const buyerId = userId // initiator is always buyer
    const roomSellerId = otherUserId // other user is seller role

    // If productId provided, verify it exists
    if (productId) {
      const product = await db.product.findUnique({ where: { id: productId } })
      if (!product || product.status === 'DELETED') {
        return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 200 })
      }
    }

    // Check if room already exists (bidirectional check)
    let room = await db.chatRoom.findFirst({
      where: {
        OR: [
          { buyerId: userId, sellerId: otherUserId },
          { buyerId: otherUserId, sellerId: userId },
        ],
        ...(productId ? { productId } : {}),
      },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true, logo: true } } } },
        product: { select: { id: true, title: true, images: true, price: true } },
      },
    })

    if (!room) {
      room = await db.chatRoom.create({
        data: { buyerId, sellerId: roomSellerId, productId: productId || null },
        include: {
          buyer: { select: { id: true, name: true, avatar: true } },
          seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true, logo: true } } } },
          product: { select: { id: true, title: true, images: true, price: true } },
        },
      })
    }

    if (message) {
      const msg = await db.message.create({
        data: { chatRoomId: room.id, senderId: userId, content: message },
      })
      await db.chatRoom.update({
        where: { id: room.id },
        data: { lastMessage: message, lastMessageAt: new Date() },
      })

      // Notify the other user
      await db.notification.create({
        data: {
          userId: otherUserId,
          type: 'MESSAGE',
          title: 'Nuevo mensaje',
          message: `Tienes un nuevo mensaje de ${otherUser.name || 'un usuario'}`,
          link: `/chat/${room.id}`,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          ...room,
          product: room.product ? { ...room.product, images: (() => { try { return room.product.images ? JSON.parse(room.product.images) : [] } catch { return [] } })() } : null,
          newMessage: msg,
          otherUser: {
            id: room.seller.id, name: room.seller.name, avatar: room.seller.avatar,
            businessName: room.seller.businessProfile?.businessName, logo: room.seller.businessProfile?.logo,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...room,
        product: room.product ? { ...room.product, images: (() => { try { return room.product.images ? JSON.parse(room.product.images) : [] } catch { return [] } })() } : null,
        otherUser: {
          id: room.seller.id, name: room.seller.name, avatar: room.seller.avatar,
          businessName: room.seller.businessProfile?.businessName, logo: room.seller.businessProfile?.logo,
        },
      },
    })
  } catch (error) {
    console.error('Create chat room error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear chat' }, { status: 200 })
  }
}
