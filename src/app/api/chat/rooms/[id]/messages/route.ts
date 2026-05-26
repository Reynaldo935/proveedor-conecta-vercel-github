import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser, setAuthCookie } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    await setAuthCookie(user.id as string);
    const userId = user.id as string;

    const { id } = await params;

    // Verify user is part of this chat room
    const room = await db.chatRoom.findUnique({ where: { id } });
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Chat room not found' },
        { status: 404 }
      );
    }

    if (room.buyerId !== userId && room.sellerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { chatRoomId: id };

    if (cursor) {
      where.id = { lt: cursor };
    }

    const messages = await db.message.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // Mark unread messages as read
    await db.message.updateMany({
      where: {
        chatRoomId: id,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      data: items,
      pagination: { nextCursor, hasMore },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    await setAuthCookie(user.id as string);
    const userId = user.id as string;

    const { id } = await params;

    // Verify user is part of this chat room
    const room = await db.chatRoom.findUnique({ where: { id } });
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Chat room not found' },
        { status: 404 }
      );
    }

    if (room.buyerId !== userId && room.sellerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, imageUrl } = body;

    if (!content && !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Message content or image is required' },
        { status: 400 }
      );
    }

    const message = await db.message.create({
      data: {
        chatRoomId: id,
        senderId: userId,
        content: content || '',
        imageUrl: imageUrl || '',
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update chat room's last message
    await db.chatRoom.update({
      where: { id },
      data: {
        lastMessage: content || '[Image]',
        lastMessageAt: new Date(),
      },
    });

    // Create notification for the other user
    const recipientId = room.buyerId === userId ? room.sellerId : room.buyerId;
    await db.notification.create({
      data: {
        userId: recipientId,
        type: 'MESSAGE',
        title: 'Nuevo mensaje',
        message: `${(user as Record<string, unknown>).name || 'Usuario'}: ${content || '[Image]'}`,
        link: `/chat/${id}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
