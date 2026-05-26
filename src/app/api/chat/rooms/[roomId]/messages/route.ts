import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    await setAuthCookie(userId)

    // Verify user is part of the room
    const room = await db.chatRoom.findUnique({ where: { id: roomId } })
    if (!room) {
      return NextResponse.json({ success: false, error: 'Sala de chat no encontrada' }, { status: 404 })
    }

    if (room.buyerId !== userId && room.sellerId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = { chatRoomId: roomId }
    if (cursor) where.createdAt = { lt: new Date(cursor) }

    const messages = await db.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    })

    const hasMore = messages.length > limit
    const items = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null

    // Mark unread messages as read
    await db.message.updateMany({
      where: { chatRoomId: roomId, isRead: false, senderId: { not: userId } },
      data: { isRead: true },
    })

    return NextResponse.json({
      success: true,
      data: items.reverse(),
      nextCursor,
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener mensajes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    await setAuthCookie(userId)

    // Verify user is part of the room
    const room = await db.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    })
    if (!room) {
      return NextResponse.json({ success: false, error: 'Sala de chat no encontrada' }, { status: 404 })
    }

    if (room.buyerId !== userId && room.sellerId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { content, imageUrl, messageType, mediaUrl, locationLat, locationLng, locationName } = body

    if (!content && !imageUrl && !mediaUrl && !locationLat) {
      return NextResponse.json({ success: false, error: 'Mensaje, imagen o ubicación requerido' }, { status: 400 })
    }

    const msgType = messageType || (imageUrl ? 'image' : 'text')

    const message = await db.message.create({
      data: {
        chatRoomId: roomId,
        senderId: userId,
        content: content || '',
        imageUrl: imageUrl || mediaUrl || '',
        messageType: msgType,
        mediaUrl: mediaUrl || '',
        locationLat: locationLat || null,
        locationLng: locationLng || null,
        locationName: locationName || '',
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Determine display text for last message
    let lastMsgDisplay = content || ''
    if (msgType === 'image' && !content) lastMsgDisplay = '📷 Imagen'
    else if (msgType === 'video') lastMsgDisplay = content || '🎥 Video'
    else if (msgType === 'audio') lastMsgDisplay = content || '🎵 Audio'
    else if (msgType === 'location') lastMsgDisplay = content || '📍 Ubicación'

    await db.chatRoom.update({
      where: { id: roomId },
      data: { lastMessage: lastMsgDisplay, lastMessageAt: new Date() },
    })

    // Notify the other user
    const otherUserId = room.buyerId === userId ? room.sellerId : room.buyerId
    await db.notification.create({
      data: {
        userId: otherUserId,
        type: 'MESSAGE',
        title: 'Nuevo mensaje',
        message: `Tienes un nuevo mensaje de ${room.buyerId === userId ? room.buyer.name : room.seller.name}`,
        link: `/chat/${roomId}`,
      },
    })

    return NextResponse.json({ success: true, data: message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ success: false, error: 'Error al enviar mensaje' }, { status: 500 })
  }
}
