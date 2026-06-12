import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)
    if (userId) await setAuthCookie(userId)

    const product = await db.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true, name: true, avatar: true, phone: true, address: true,
            businessProfile: { select: { businessName: true, logo: true, category: true } },
            followers: { select: { followerId: true } },
          },
        },
        likes: { select: { userId: true } },
        quantityDiscounts: true,
      },
    })

    if (!product || product.status === 'DELETED') {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 200 })
    }

    // Check if user saved this product
    let isSaved = false
    let savedCount = 0
    if (userId) {
      const saved = await db.savedProduct.findUnique({
        where: { userId_productId: { userId, productId: id } },
      })
      isSaved = !!saved
    }
    savedCount = await db.savedProduct.count({ where: { productId: id } })

    const isLiked = userId ? product.likes.some(l => l.userId === userId) : false
    const isFollowingSeller = userId ? product.seller.followers.some(f => f.followerId === userId) : false

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        images: (() => { try { return product.images ? JSON.parse(product.images) : [] } catch { return [] } })(),
        likeCount: product.likes.length,
        savedCount,
        isLiked,
        isSaved,
        isFollowingSeller,
        likes: undefined,
        seller: {
          ...product.seller,
          followerCount: product.seller.followers.length,
          isFollowing: isFollowingSeller,
          followers: undefined,
        },
      },
    })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener producto' }, { status: 200 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const product = await db.product.findUnique({ where: { id } })
    if (!product || product.sellerId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 200 })
    }

    const body = await request.json()

    // Handle quantity discounts: delete existing and recreate
    if (body.quantityDiscounts !== undefined) {
      await db.quantityDiscount.deleteMany({ where: { productId: id } })
      if (Array.isArray(body.quantityDiscounts) && body.quantityDiscounts.length > 0) {
        await db.quantityDiscount.createMany({
          data: body.quantityDiscounts
            .filter((qd: { minQty: number; discountPercent: number }) => qd.minQty > 0 && qd.discountPercent > 0)
            .map((qd: { minQty: number; discountPercent: number }) => ({
              productId: id,
              minQty: qd.minQty,
              discountPercent: qd.discountPercent,
            })),
        })
      }
    }

    const updated = await db.product.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.discountPrice !== undefined && { discountPrice: body.discountPrice ? parseFloat(body.discountPrice) : null }),
        ...(body.discountPercent !== undefined && { discountPercent: body.discountPercent ? parseFloat(body.discountPercent) : null }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.images !== undefined && { images: JSON.stringify(body.images) }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
        ...(body.quantity !== undefined && { quantity: parseInt(body.quantity) }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.discountStart !== undefined && { discountStart: body.discountStart ? new Date(body.discountStart) : null }),
        ...(body.discountEnd !== undefined && { discountEnd: body.discountEnd ? new Date(body.discountEnd) : null }),
      },
      include: { quantityDiscounts: true },
    })

    await db.auditLog.create({
      data: { userId, action: 'UPDATE_PRODUCT', entity: 'Product', entityId: id, details: `Producto actualizado: ${updated.title}` },
    })

    return NextResponse.json({ success: true, data: { ...updated, images: (() => { try { return JSON.parse(updated.images) } catch { return [] } })() } })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar producto' }, { status: 200 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    const product = await db.product.findUnique({ where: { id } })
    if (!product || product.sellerId !== userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 200 })
    }

    // Soft delete
    await db.product.update({ where: { id }, data: { status: 'DELETED' } })

    await db.auditLog.create({
      data: { userId, action: 'DELETE_PRODUCT', entity: 'Product', entityId: id, details: `Producto eliminado: ${product.title}` },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar producto' }, { status: 200 })
  }
}
