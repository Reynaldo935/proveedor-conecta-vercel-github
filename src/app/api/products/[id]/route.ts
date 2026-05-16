import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, avatar: true, phone: true, address: true, businessProfile: true },
        },
        likes: { select: { userId: true } },
      },
    })

    if (!product || product.status === 'DELETED') {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        likeCount: product.likes.length,
        isLiked: false,
        likes: undefined,
      },
    })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener producto' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const product = await db.product.findUnique({ where: { id } })
    if (!product || product.sellerId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const updated = await db.product.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        price: body.price ? parseFloat(body.price) : undefined,
        discountPrice: body.discountPrice !== undefined ? (body.discountPrice ? parseFloat(body.discountPrice) : null) : undefined,
        discountPercent: body.discountPercent !== undefined ? (body.discountPercent ? parseFloat(body.discountPercent) : null) : undefined,
        category: body.category,
        tags: body.tags,
        images: body.images ? JSON.stringify(body.images) : undefined,
        videoUrl: body.videoUrl,
        quantity: body.quantity ? parseInt(body.quantity) : undefined,
        status: body.status,
        discountStart: body.discountStart ? new Date(body.discountStart) : null,
        discountEnd: body.discountEnd ? new Date(body.discountEnd) : null,
      },
    })

    await db.auditLog.create({
      data: { userId, action: 'UPDATE_PRODUCT', entity: 'Product', entityId: id, details: `Producto actualizado: ${updated.title}` },
    })

    return NextResponse.json({ success: true, data: { ...updated, images: JSON.parse(updated.images) } })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar producto' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const product = await db.product.findUnique({ where: { id } })
    if (!product || product.sellerId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    // Soft delete
    await db.product.update({ where: { id }, data: { status: 'DELETED' } })

    await db.auditLog.create({
      data: { userId, action: 'DELETE_PRODUCT', entity: 'Product', entityId: id, details: `Producto eliminado: ${product.title}` },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar producto' }, { status: 500 })
  }
}
