import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    await setAuthCookie(userId)

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    if (!transactionId) return NextResponse.json({ success: false, error: 'transactionId requerido' }, { status: 400 })

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        product: { select: { title: true, price: true, images: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true, businessProfile: { select: { businessName: true } } } },
      },
    })

    if (!transaction) return NextResponse.json({ success: false, error: 'Transacción no encontrada' }, { status: 404 })
    
    // Only buyer or seller of the transaction (or admin) can view voucher
    const user = await db.user.findUnique({ where: { id: userId } })
    if (transaction.buyerId !== userId && transaction.sellerId !== userId && user?.email !== 'rey7214935@gmail.com') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const formatPrice = (n: number) => new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(n)

    // Generate voucher as HTML for PDF/Image export
    const voucherHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Comprobante de Pago - ProveedorConecta</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1C2833; padding: 40px; }
  .voucher { max-width: 600px; margin: 0 auto; border: 2px solid #1A5276; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #1A5276, #2E86C1); color: white; padding: 24px; text-align: center; }
  .header h1 { font-size: 20px; margin-bottom: 4px; }
  .header p { font-size: 12px; opacity: 0.8; }
  .body { padding: 24px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
  .row:last-child { border-bottom: none; }
  .label { font-size: 13px; color: #666; }
  .value { font-size: 13px; font-weight: 600; text-align: right; }
  .amount-section { background: #E8F4FD; padding: 16px; text-align: center; margin: 16px -24px; }
  .amount-section .amount { font-size: 28px; font-weight: 700; color: #1A5276; }
  .amount-section .commission { font-size: 12px; color: #666; margin-top: 4px; }
  .footer { background: #f8f9fa; padding: 16px 24px; text-align: center; font-size: 11px; color: #999; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .status-completed { background: #d4edda; color: #155724; }
  .status-pending { background: #fff3cd; color: #856404; }
</style>
</head>
<body>
<div class="voucher">
  <div class="header">
    <h1>&#129534; Comprobante de Pago</h1>
    <p>ProveedorConecta Nicaragua</p>
  </div>
  <div class="body">
    <div class="row"><span class="label">N&deg; Transacci&oacute;n</span><span class="value">${escapeHtml(transaction.id.slice(-8).toUpperCase())}</span></div>
    <div class="row"><span class="label">Fecha</span><span class="value">${escapeHtml(new Date(transaction.createdAt).toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}</span></div>
    <div class="row"><span class="label">Estado</span><span class="value"><span class="status-badge ${transaction.status === 'COMPLETED' ? 'status-completed' : 'status-pending'}">${transaction.status === 'COMPLETED' ? '&#10003; Completado' : '&#9203; Pendiente'}</span></span></div>
    <div class="row"><span class="label">Producto</span><span class="value">${escapeHtml(transaction.product.title)}</span></div>
    <div class="row"><span class="label">Comprador</span><span class="value">${escapeHtml(transaction.buyer.name)}</span></div>
    <div class="row"><span class="label">Vendedor</span><span class="value">${escapeHtml(transaction.seller?.businessProfile?.businessName || transaction.seller.name)}</span></div>
    <div class="row"><span class="label">M&eacute;todo de Pago</span><span class="value">${escapeHtml(transaction.paymentMethod)}</span></div>
    <div class="amount-section">
      <div class="amount">${formatPrice(transaction.amount)}</div>
      <div class="commission">Comisi&oacute;n 3%: ${formatPrice(transaction.commission)} &middot; Pago vendedor: ${formatPrice(transaction.sellerPayout)}</div>
    </div>
  </div>
  <div class="footer">
    <p>ProveedorConecta Nicaragua &middot; Managua, Nicaragua</p>
    <p>Este comprobante es v&aacute;lido como recibo de pago en la plataforma.</p>
  </div>
</div>
</body>
</html>`

    return new NextResponse(voucherHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="voucher-${transaction.id.slice(-8)}.html"`,
      },
    })
  } catch (error) {
    console.error('Voucher error:', error)
    return NextResponse.json({ success: false, error: 'Error al generar comprobante' }, { status: 500 })
  }
}
