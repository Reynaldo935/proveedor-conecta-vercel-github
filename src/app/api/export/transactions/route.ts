import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId } from '@/lib/auth'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeCsv(str: string): string {
  return str.replace(/"/g, '""')
}

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') || 'csv'
  const role = request.nextUrl.searchParams.get('role') || 'buyer'

  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const where: Record<string, unknown> = {}
    if (role === 'buyer') where.buyerId = userId
    else if (role === 'seller') where.sellerId = userId
    else where.OR = [{ buyerId: userId }, { sellerId: userId }]

    const transactions = await db.transaction.findMany({
      where,
      include: {
        product: { select: { id: true, title: true, category: true, price: true, discountPrice: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true, businessProfile: { select: { businessName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const formatPrice = (n: number) => `C$ ${n.toLocaleString('es-NI')}`
    const dateStr = new Date().toLocaleDateString('es-NI')
    const title = role === 'buyer' ? 'Mis Compras' : 'Mis Ventas'

    if (format === 'csv') {
      const headers = 'Fecha,Producto,Categoría,Monto,Método de Pago,Estado,Vendedor\n'
      const rows = transactions.map(t =>
        `"${new Date(t.createdAt).toLocaleDateString('es-NI')}","${escapeCsv(t.product.title)}","${escapeCsv(t.product.category)}",${t.amount},"${escapeCsv(t.paymentMethod)}","${t.status}","${escapeCsv(t.seller.businessProfile?.businessName || t.seller.name)}"`
      ).join('\n')
      return new NextResponse(headers + rows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=mis_compras_proveedorconecta_2026.csv`,
        },
      })
    }

    if (format === 'excel') {
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8"></head>
<body><table border="1">
<tr><th>Fecha</th><th>Producto</th><th>Categoría</th><th>Monto (C$)</th><th>Método de Pago</th><th>Estado</th><th>Vendedor</th></tr>
${transactions.map(t => `<tr><td>${new Date(t.createdAt).toLocaleDateString('es-NI')}</td><td>${escapeHtml(t.product.title)}</td><td>${escapeHtml(t.product.category)}</td><td>${t.amount}</td><td>${escapeHtml(t.paymentMethod)}</td><td>${t.status}</td><td>${escapeHtml(t.seller.businessProfile?.businessName || t.seller.name)}</td></tr>`).join('')}
</table></body></html>`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename=mis_compras_proveedorconecta_2026.xls`,
        },
      })
    }

    // PDF - HTML printable format
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ProveedorConecta Nicaragua - ${title} 2026</title>
<style>body{font-family:Arial,sans-serif;margin:20px}h1{color:#1A5276}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#1A5276;color:white}.price{color:#2E86C1;font-weight:bold}.status-completed{color:#1E8449}.status-pending{color:#B7950B}</style></head>
<body><h1>&#127470;&#127484; ProveedorConecta Nicaragua - ${title} 2026</h1>
<p>Reporte generado: ${dateStr}</p>
<table><tr><th>Fecha</th><th>Producto</th><th>Categoría</th><th>Monto</th><th>Método</th><th>Estado</th><th>Vendedor</th></tr>
${transactions.map(t => `<tr><td>${new Date(t.createdAt).toLocaleDateString('es-NI')}</td><td>${escapeHtml(t.product.title)}</td><td>${escapeHtml(t.product.category)}</td><td class="price">${formatPrice(t.amount)}</td><td>${escapeHtml(t.paymentMethod)}</td><td class="status-${t.status.toLowerCase()}">${t.status === 'COMPLETED' ? 'Completado' : t.status === 'PENDING' ? 'Pendiente' : t.status}</td><td>${escapeHtml(t.seller.businessProfile?.businessName || t.seller.name)}</td></tr>`).join('')}
</table>
<p style="margin-top:16px;font-weight:bold">Total: ${formatPrice(transactions.reduce((s, t) => s + t.amount, 0))}</p>
<p style="margin-top:20px;color:#666">Generado por ProveedorConecta Nicaragua - Hackathon Nicaragua 2026, 10ma Edici&oacute;n</p>
</body></html>`
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename=mis_compras_proveedorconecta_2026.html`,
      },
    })
  } catch (error) {
    console.error('Export transactions error:', error)
    return NextResponse.json({ success: false, error: 'Error exporting transactions' }, { status: 500 })
  }
}
