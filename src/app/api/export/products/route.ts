import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') || 'csv'
  const sellerId = request.nextUrl.searchParams.get('sellerId') || ''

  try {
    const where: Record<string, unknown> = { status: 'ACTIVE' }
    if (sellerId) where.sellerId = sellerId

    const products = await db.product.findMany({
      where,
      include: { seller: { include: { businessProfile: true } } },
      take: 100,
      orderBy: { createdAt: 'desc' },
    })

    if (format === 'csv') {
      const headers = 'Producto,Precio,Categoría,Vendedor,Teléfono,Ubicación\n'
      const rows = products.map(p =>
        `"${p.title}",${p.price},"${p.category}","${p.seller.businessProfile?.businessName || p.seller.name}","${p.seller.phone}","${p.seller.address}"`
      ).join('\n')
      return new NextResponse(headers + rows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename=proveedores_nicaragua_2026.csv',
        },
      })
    }

    if (format === 'excel') {
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8"></head>
<body><table border="1">
<tr><th>Producto</th><th>Precio (C$)</th><th>Categoría</th><th>Vendedor</th><th>Teléfono</th><th>Ubicación</th><th>Horario</th></tr>
${products.map(p => `<tr><td>${p.title}</td><td>${p.price}</td><td>${p.category}</td><td>${p.seller.businessProfile?.businessName || p.seller.name}</td><td>${p.seller.phone}</td><td>${p.seller.address}</td><td>${p.seller.businessProfile?.hours || ''}</td></tr>`).join('')}
</table></body></html>`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': 'attachment; filename=proveedores_nicaragua_2026.xls',
        },
      })
    }

    if (format === 'word') {
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>ProveedorConecta Nicaragua - Productos 2026</title>
<style>
  body { font-family: Arial, sans-serif; margin: 30px; }
  h1 { color: #1A5276; font-size: 22pt; margin-bottom: 4px; }
  h2 { color: #2E86C1; font-size: 14pt; margin-top: 0; }
  p.meta { color: #666; font-size: 10pt; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { background-color: #1A5276; color: white; padding: 8px 10px; text-align: left; font-size: 10pt; border: 1px solid #1A5276; }
  td { padding: 6px 10px; border: 1px solid #ddd; font-size: 10pt; }
  tr:nth-child(even) { background-color: #f2f8fc; }
  .price { color: #2E86C1; font-weight: bold; }
  .footer { margin-top: 30px; color: #999; font-size: 9pt; border-top: 1px solid #ddd; padding-top: 10px; }
</style></head>
<body>
<h1>&#127470;&#127484; ProveedorConecta Nicaragua</h1>
<h2>Catálogo de Productos 2026</h2>
<p class="meta">Listado de productos con precios actualizados - ${new Date().toLocaleDateString('es-NI')} | Total: ${products.length} productos</p>
<table>
<tr><th>Producto</th><th>Precio (C$)</th><th>Categoría</th><th>Vendedor</th><th>Teléfono</th><th>Ubicación</th></tr>
${products.map(p => `<tr><td>${p.title}</td><td class="price">C$ ${p.price.toLocaleString()}</td><td>${p.category}</td><td>${p.seller.businessProfile?.businessName || p.seller.name}</td><td>${p.seller.phone}</td><td>${p.seller.address}</td></tr>`).join('')}
</table>
<p class="footer">Generado por ProveedorConecta Nicaragua - Hackathon Nicaragua 2026, 10ma Edici&oacute;n</p>
</body></html>`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'application/msword',
          'Content-Disposition': 'attachment; filename=proveedores_nicaragua_2026.doc',
        },
      })
    }

    // PDF - HTML printable format
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ProveedorConecta Nicaragua - Productos 2026</title>
<style>body{font-family:Arial,sans-serif;margin:20px}h1{color:#1A5276}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#1A5276;color:white}.price{color:#2E86C1;font-weight:bold}</style></head>
<body><h1>&#127470;&#127484; ProveedorConecta Nicaragua - Productos 2026</h1>
<p>Listado de productos con precios actualizados - ${new Date().toLocaleDateString('es-NI')}</p>
<table><tr><th>Producto</th><th>Precio</th><th>Categoría</th><th>Vendedor</th><th>Ubicación</th></tr>
${products.map(p => `<tr><td>${p.title}</td><td class="price">C$ ${p.price.toLocaleString()}</td><td>${p.category}</td><td>${p.seller.businessProfile?.businessName || p.seller.name}</td><td>${p.seller.address}</td></tr>`).join('')}
</table><p style="margin-top:20px;color:#666">Generado por ProveedorConecta Nicaragua - Hackathon Nicaragua 2026, 10ma Edici&oacute;n</p>
</body></html>`
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename=proveedores_nicaragua_2026.html',
      },
    })
  } catch (error) {
    console.error('Export products error:', error)
    return NextResponse.json({ success: false, error: 'Error exporting products' }, { status: 500 })
  }
}
