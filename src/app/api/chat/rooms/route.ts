import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
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
        product: r.product ? { ...r.product, images: r.product.images ? JSON.parse(r.product.images) : [] } : null,
        unreadCount: r._count.messages,
        _count: undefined,
        otherUser: r.buyerId === userId
          ? { id: r.seller.id, name: r.seller.name, avatar: r.seller.avatar, businessName: r.seller.businessProfile?.businessName, logo: r.seller.businessProfile?.logo }
          : { id: r.buyer.id, name: r.buyer.name, avatar: r.buyer.avatar },
      })),
    })
  } catch (error) {
    console.error('Get chat rooms error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener chats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    await setAuthCookie(userId)

    const body = await request.json()
    const { sellerId, productId, message } = body

    if (!sellerId) {
      return NextResponse.json({ success: false, error: 'sellerId es requerido' }, { status: 400 })
    }

    if (sellerId === userId) {
      return NextResponse.json({ success: false, error: 'No puedes iniciar un chat contigo mismo' }, { status: 400 })
    }

    // Verify seller exists
    const seller = await db.user.findUnique({ where: { id: sellerId } })
    if (!seller) {
      return NextResponse.json({ success: false, error: 'Vendedor no encontrado' }, { status: 404 })
    }

    // If productId provided, verify it exists and belongs to seller
    if (productId) {
      const product = await db.product.findUnique({ where: { id: productId } })
      if (!product || product.status === 'DELETED') {
        return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 })
      }
    }

    // Check if room already exists
    let room = await db.chatRoom.findFirst({
      where: {
        buyerId: userId,
        sellerId,
        ...(productId ? { productId } : { productId: null }),
      },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true, logo: true } } } },
        product: { select: { id: true, title: true, images: true, price: true } },
      },
    })

    if (!room) {
      room = await db.chatRoom.create({
        data: { buyerId: userId, sellerId, productId: productId || null },
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
          userId: sellerId,
          type: 'MESSAGE',
          title: 'Nuevo mensaje',
          message: `Tienes un nuevo mensaje de ${seller.name || 'un usuario'}`,
          link: `/chat/${room.id}`,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          ...room,
          product: room.product ? { ...room.product, images: room.product.images ? JSON.parse(room.product.images) : [] } : null,
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
        product: room.product ? { ...room.product, images: room.product.images ? JSON.parse(room.product.images) : [] } : null,
        otherUser: {
          id: room.seller.id, name: room.seller.name, avatar: room.seller.avatar,
          businessName: room.seller.businessProfile?.businessName, logo: room.seller.businessProfile?.logo,
        },
      },
    })
  } catch (error) {
    console.error('Create chat room error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear chat' }, { status: 500 })
  }
}
