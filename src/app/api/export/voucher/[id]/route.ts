import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const format = request.nextUrl.searchParams.get('format') || 'pdf'

  try {
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        buyer: { select: { name: true, email: true, phone: true } },
        seller: { select: { name: true, email: true, phone: true, businessProfile: true } },
        product: { select: { title: true, category: true, images: true } },
      },
    })

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transacción no encontrada' }, { status: 404 })
    }

    const businessName = transaction.seller.businessProfile?.businessName || transaction.seller.name
    const dateStr = transaction.createdAt.toLocaleDateString('es-NI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    if (format === 'word') {
      // Word format - HTML with .doc extension (compatible with MS Word)
      const html = generateVoucherHTML(transaction, businessName, dateStr, false)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'application/msword',
          'Content-Disposition': `attachment; filename=comprobante_${transaction.id.slice(-8)}.doc`,
        },
      })
    }

    if (format === 'image') {
      // Return same HTML with print-friendly styling for screenshot
      const html = generateVoucherHTML(transaction, businessName, dateStr, true)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename=comprobante_${transaction.id.slice(-8)}.html`,
        },
      })
    }

    // PDF format - printable HTML
    const html = generateVoucherHTML(transaction, businessName, dateStr, false)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename=comprobante_${transaction.id.slice(-8)}.html`,
      },
    })
  } catch (error) {
    console.error('Export voucher error:', error)
    return NextResponse.json({ success: false, error: 'Error generando comprobante' }, { status: 500 })
  }
}

function generateVoucherHTML(
  transaction: {
    id: string
    amount: number
    commission: number
    sellerPayout: number
    paymentMethod: string
    status: string
    createdAt: Date
    buyer: { name: string; email: string; phone: string }
    seller: { name: string; email: string; phone: string; businessProfile: { businessName: string; phone: string; address: string } | null }
    product: { title: string; category: string }
  },
  businessName: string,
  dateStr: string,
  isImage: boolean
): string {
  const commission = transaction.commission || (transaction.amount * 0.03)
  const sellerPayout = transaction.sellerPayout || (transaction.amount - commission)

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comprobante de Pago - ProveedorConecta</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
  .voucher { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 20px rgba(0,0,0,0.1); overflow: hidden; }
  .header { background: linear-gradient(135deg, #1A5276, #2E86C1); color: white; padding: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 20px; }
  .header .subtitle { font-size: 12px; opacity: 0.8; margin-top: 4px; }
  .body { padding: 24px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
  .row:last-child { border-bottom: none; }
  .label { color: #666; font-size: 13px; }
  .value { font-weight: 600; font-size: 13px; text-align: right; }
  .total-row { background: #EBF5FB; margin: 16px -24px; padding: 16px 24px; }
  .total-row .label { color: #1A5276; font-size: 15px; font-weight: 600; }
  .total-row .value { color: #1A5276; font-size: 18px; font-weight: 700; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .status-completed { background: #D5F5E3; color: #1E8449; }
  .status-pending { background: #FEF9E7; color: #B7950B; }
  .status-failed { background: #FDEDEC; color: #C0392B; }
  .footer { text-align: center; padding: 16px; color: #999; font-size: 11px; border-top: 1px solid #eee; }
  ${isImage ? '@media print { body { background: white; } .voucher { box-shadow: none; } }' : '@media print { body { background: white; } .voucher { box-shadow: none; } }'}
</style></head>
<body>
<div class="voucher">
  <div class="header">
    <h1>&#127470;&#127484; ProveedorConecta Nicaragua</h1>
    <div class="subtitle">Comprobante de Pago</div>
  </div>
  <div class="body">
    <div class="row">
      <span class="label">No. Transacci&oacute;n</span>
      <span class="value">${transaction.id.slice(-8).toUpperCase()}</span>
    </div>
    <div class="row">
      <span class="label">Fecha</span>
      <span class="value">${dateStr}</span>
    </div>
    <div class="row">
      <span class="label">Producto</span>
      <span class="value">${transaction.product.title}</span>
    </div>
    <div class="row">
      <span class="label">Categor&iacute;a</span>
      <span class="value">${transaction.product.category}</span>
    </div>
    <div class="row">
      <span class="label">Vendedor</span>
      <span class="value">${businessName}</span>
    </div>
    <div class="row">
      <span class="label">Comprador</span>
      <span class="value">${transaction.buyer.name}</span>
    </div>
    <div class="row">
      <span class="label">M&eacute;todo de Pago</span>
      <span class="value">${transaction.paymentMethod}</span>
    </div>
    <div class="row">
      <span class="label">Estado</span>
      <span class="value"><span class="status-badge status-${transaction.status.toLowerCase()}">${transaction.status}</span></span>
    </div>
    <div class="total-row row">
      <span class="label">Monto Total</span>
      <span class="value">C$ ${transaction.amount.toLocaleString()}</span>
    </div>
    <div class="row">
      <span class="label">Comisi&oacute;n (3%)</span>
      <span class="value">C$ ${commission.toLocaleString()}</span>
    </div>
    <div class="row">
      <span class="label">Pago al Vendedor</span>
      <span class="value">C$ ${sellerPayout.toLocaleString()}</span>
    </div>
  </div>
  <div class="footer">
    ProveedorConecta Nicaragua &middot; Hackathon Nicaragua 2026, 10ma Edici&oacute;n<br/>
    Este comprobante es v&aacute;lido como comprobante de transacci&oacute;n.
  </div>
</div>
</body></html>`
}
