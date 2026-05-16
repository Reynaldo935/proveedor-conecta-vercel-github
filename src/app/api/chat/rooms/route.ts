import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const rooms = await db.chatRoom.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true, businessProfile: { select: { businessName: true, logo: true } } } },
        product: { select: { id: true, title: true, images: true, price: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: rooms.map(r => ({
        ...r,
        product: r.product ? { ...r.product, images: r.product.images ? JSON.parse(r.product.images) : [] } : null,
      })),
    })
  } catch (error) {
    console.error('Get chat rooms error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener chats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { sellerId, productId, message } = body

    if (!sellerId) {
      return NextResponse.json({ success: false, error: 'sellerId es requerido' }, { status: 400 })
    }

    // Check if room already exists
    let room = await db.chatRoom.findFirst({
      where: {
        buyerId: userId,
        sellerId,
        ...(productId ? { productId } : {}),
      },
    })

    if (!room) {
      room = await db.chatRoom.create({
        data: { buyerId: userId, sellerId, productId: productId || null },
      })
    }

    if (message) {
      await db.message.create({
        data: { chatRoomId: room.id, senderId: userId, content: message },
      })
      await db.chatRoom.update({
        where: { id: room.id },
        data: { lastMessage: message, lastMessageAt: new Date() },
      })
    }

    return NextResponse.json({ success: true, data: room })
  } catch (error) {
    console.error('Create chat room error:', error)
    return NextResponse.json({ success: false, error: 'Error al crear chat' }, { status: 500 })
  }
}
