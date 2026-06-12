import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'
import { safeApiHandler } from '@/lib/api-utils'

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Generate SpreadsheetML XML (Excel can open natively)
function generateXlsx(
  headers: string[],
  rows: string[][],
  sheetName: string
): string {
  const colCount = headers.length

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<?mso-application progid="Excel.Sheet"?>\n'
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n'
  xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n'
  xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n'
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n'
  xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n'

  // Styles
  xml += '<Styles>\n'
  xml += '  <Style ss:ID="Default" ss:Name="Normal"><Font ss:Size="10"/></Style>\n'
  xml += '  <Style ss:ID="Header"><Font ss:Size="10" ss:Bold="1"/><Interior ss:Color="#4472C4" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF" ss:Size="10" ss:Bold="1"/></Style>\n'
  xml += '</Styles>\n'

  xml += `<Worksheet ss:Name="${escapeXml(sheetName)}">\n`

  // Column definitions
  xml += '<Table ss:DefaultColumnWidth="120">\n'
  for (let i = 0; i < colCount; i++) {
    xml += '<Column ss:Width="150"/>\n'
  }

  // Header row
  xml += '<Row ss:StyleID="Header">\n'
  for (const header of headers) {
    xml += `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>\n`
  }
  xml += '</Row>\n'

  // Data rows
  for (const row of rows) {
    xml += '<Row>\n'
    for (let i = 0; i < colCount; i++) {
      const value = row[i] ?? ''
      const isNumber = value !== '' && !isNaN(Number(value))
      const type = isNumber ? 'Number' : 'String'
      xml += `<Cell><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>\n`
    }
    xml += '</Row>\n'
  }

  xml += '</Table>\n'
  xml += '</Worksheet>\n'
  xml += '</Workbook>'

  return xml
}

// Generate HTML-based Word document
function generateDocx(
  title: string,
  subtitle: string,
  sections: { heading: string; content: string }[]
): string {
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:w="urn:schemas-microsoft-com:office:word"
 xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #333; }
  h1 { font-size: 22pt; color: #1a365d; margin-bottom: 4pt; }
  h2 { font-size: 14pt; color: #2d3748; margin-top: 16pt; margin-bottom: 8pt; border-bottom: 2px solid #4472C4; padding-bottom: 4pt; }
  h3 { font-size: 12pt; color: #4a5568; margin-top: 12pt; }
  .subtitle { font-size: 12pt; color: #718096; margin-bottom: 20pt; }
  .meta { font-size: 9pt; color: #a0aec0; margin-bottom: 12pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  th { background-color: #4472C4; color: white; padding: 6pt 8pt; text-align: left; font-size: 10pt; }
  td { padding: 4pt 8pt; border: 1px solid #e2e8f0; font-size: 10pt; }
  tr:nth-child(even) { background-color: #f7fafc; }
  .highlight { font-weight: bold; color: #2d3748; }
  .footer { margin-top: 30pt; font-size: 8pt; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 8pt; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<div class="subtitle">${escapeHtml(subtitle)}</div>
<div class="meta">Generado el: ${new Date().toLocaleString('es-NI', { dateStyle: 'long', timeStyle: 'short' })} | ProveedorConecta Nicaragua</div>
<hr style="border: none; border-top: 3px solid #4472C4; margin-bottom: 20pt;">
`

  for (const section of sections) {
    html += `<h2>${escapeHtml(section.heading)}</h2>\n`
    html += section.content + '\n'
  }

  html += `
<div class="footer">
<p>ProveedorConecta Nicaragua - Reporte generado automáticamente</p>
<p>Este documento es confidencial y de uso exclusivo del administrador del sistema.</p>
</div>
</body>
</html>`

  return html
}

// ─── Auth Helper ────────────────────────────────────────────────────────────

async function getAuthUser(request?: Request) {
  const userId = await getAuthenticatedUserId(request)

  if (!userId) return null
  await setAuthCookie(userId)

  const user = await db.user.findUnique({ where: { id: userId } })
  return user
}

function isAdmin(role: string | undefined | null): boolean {
  return role === 'ADMIN'
}

// ─── Data Fetchers ──────────────────────────────────────────────────────────

async function getTransactionData(userId: string, admin: boolean) {
  const where = admin ? {} : { OR: [{ buyerId: userId }, { sellerId: userId }] }
  return db.transaction.findMany({
    where,
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      product: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function getProductData(userId: string, admin: boolean) {
  const where = admin ? {} : { sellerId: userId }
  return db.product.findMany({
    where,
    include: {
      seller: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function getCommissionData() {
  return db.commissionLog.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

async function getUserData() {
  return db.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, helperRole: true,
      phone: true, department: true, isVerified: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── CSV Generators ────────────────────────────────────────────────────────

function generateTransactionsCsv(transactions: Awaited<ReturnType<typeof getTransactionData>>): string {
  let csv = 'ID,Comprador,Email Comprador,Vendedor,Email Vendedor,Producto,Monto,Comisión,Pago Vendedor,Método Pago,Estado,Fecha\n'
  for (const t of transactions) {
    csv += `"${t.id}","${t.buyer?.name || ''}","${t.buyer?.email || ''}","${t.seller?.name || ''}","${t.seller?.email || ''}","${t.product?.title || ''}",${t.amount},${t.commission},${t.sellerPayout},"${t.paymentMethod}","${t.status}","${t.createdAt.toISOString()}"\n`
  }
  return csv
}

function generateCommissionsCsv(commissionLogs: Awaited<ReturnType<typeof getCommissionData>>): string {
  let csv = 'ID,Transacción ID,Comisión,Tasa,Destino,Cuenta Banco,Estado,Fecha\n'
  for (const c of commissionLogs) {
    csv += `"${c.id}","${c.transactionId}",${c.amount},${c.rate},"${c.destination}","${c.bankAccount}","${c.status}","${c.createdAt.toISOString()}"\n`
  }
  return csv
}

function generateUsersCsv(users: Awaited<ReturnType<typeof getUserData>>): string {
  let csv = 'ID,Nombre,Email,Rol,Rol Ayudante,Teléfono,Departamento,Verificado,Fecha Registro\n'
  for (const u of users) {
    csv += `"${u.id}","${u.name}","${u.email}","${u.role}","${u.helperRole}","${u.phone}","${u.department}",${u.isVerified},"${u.createdAt.toISOString()}"\n`
  }
  return csv
}

function generateProductsCsv(products: Awaited<ReturnType<typeof getProductData>>): string {
  let csv = 'ID,Título,Precio,Precio Descuento,Categoría,Estado,Vendedor,Email Vendedor,Cantidad,Fecha\n'
  for (const p of products) {
    csv += `"${p.id}","${p.title}",${p.price},${p.discountPrice || ''},"${p.category}","${p.status}","${p.seller?.name || ''}","${p.seller?.email || ''}",${p.quantity},"${p.publishedAt.toISOString()}"\n`
  }
  return csv
}

// ─── XLSX Generators ───────────────────────────────────────────────────────

function generateTransactionsXlsx(transactions: Awaited<ReturnType<typeof getTransactionData>>): string {
  const headers = ['ID', 'Comprador', 'Email Comprador', 'Vendedor', 'Email Vendedor', 'Producto', 'Monto (C$)', 'Comisión (C$)', 'Pago Vendedor (C$)', 'Método Pago', 'Estado', 'Fecha']
  const rows = transactions.map(t => [
    t.id,
    t.buyer?.name || '',
    t.buyer?.email || '',
    t.seller?.name || '',
    t.seller?.email || '',
    t.product?.title || '',
    t.amount.toString(),
    t.commission.toString(),
    t.sellerPayout.toString(),
    t.paymentMethod,
    t.status,
    t.createdAt.toISOString(),
  ])
  return generateXlsx(headers, rows, 'Transacciones')
}

function generateProductsXlsx(products: Awaited<ReturnType<typeof getProductData>>): string {
  const headers = ['ID', 'Título', 'Descripción', 'Precio (C$)', 'Precio Descuento (C$)', 'Descuento (%)', 'Categoría', 'Etiquetas', 'Cantidad', 'Estado', 'Destacado', 'Vendedor', 'Email Vendedor', 'Fecha Publicación']
  const rows = products.map(p => [
    p.id,
    p.title,
    p.description?.substring(0, 200) || '',
    p.price.toString(),
    p.discountPrice?.toString() || '',
    p.discountPercent?.toString() || '',
    p.category,
    p.tags,
    p.quantity.toString(),
    p.status,
    p.isFeatured ? 'Sí' : 'No',
    p.seller?.name || '',
    p.seller?.email || '',
    p.publishedAt.toISOString(),
  ])
  return generateXlsx(headers, rows, 'Productos')
}

// ─── DOCX Report Generator ─────────────────────────────────────────────────

async function generateReportDocx(): Promise<string> {
  // Gather all data for the comprehensive report
  const [
    totalUsers,
    totalSellers,
    totalBuyers,
    totalProducts,
    activeProducts,
    totalTransactions,
    completedTransactions,
    totalRevenue,
    totalCommission,
    recentTransactions,
    topProducts,
    recentUsers,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: 'SELLER' } }),
    db.user.count({ where: { role: 'BUYER' } }),
    db.product.count(),
    db.product.count({ where: { status: 'ACTIVE' } }),
    db.transaction.count(),
    db.transaction.count({ where: { status: 'COMPLETED' } }),
    db.transaction.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
    db.commissionLog.aggregate({ _sum: { amount: true }, where: { status: 'PENDING' } }),
    db.transaction.findMany({
      where: { status: 'COMPLETED' },
      include: {
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
        product: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.product.findMany({
      where: { status: 'ACTIVE' },
      include: { seller: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { name: true, email: true, role: true, createdAt: true, isVerified: true },
    }),
  ])

  const revenue = totalRevenue._sum.amount || 0
  const commission = totalCommission._sum.amount || 0

  const sections: { heading: string; content: string }[] = []

  // Section 1: Resumen General
  sections.push({
    heading: '1. Resumen General de la Plataforma',
    content: `
<table>
<tr><th>Métrica</th><th>Valor</th></tr>
<tr><td>Total de Usuarios</td><td class="highlight">${totalUsers}</td></tr>
<tr><td>Vendedores</td><td>${totalSellers}</td></tr>
<tr><td>Compradores</td><td>${totalBuyers}</td></tr>
<tr><td>Total de Productos</td><td>${totalProducts}</td></tr>
<tr><td>Productos Activos</td><td>${activeProducts}</td></tr>
<tr><td>Total de Transacciones</td><td>${totalTransactions}</td></tr>
<tr><td>Transacciones Completadas</td><td>${completedTransactions}</td></tr>
<tr><td>Ingresos Totales (C$)</td><td class="highlight">C$ ${revenue.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
<tr><td>Comisiones Pendientes (C$)</td><td>C$ ${commission.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
</table>
`,
  })

  // Section 2: Transacciones Recientes
  let transTable = `
<table>
<tr><th>Producto</th><th>Comprador</th><th>Vendedor</th><th>Monto (C$)</th><th>Comisión (C$)</th><th>Método</th><th>Fecha</th></tr>
`
  for (const t of recentTransactions) {
    transTable += `<tr>
<td>${escapeHtml(t.product?.title || 'N/A')}</td>
<td>${escapeHtml(t.buyer?.name || 'N/A')}</td>
<td>${escapeHtml(t.seller?.name || 'N/A')}</td>
<td>C$ ${t.amount.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
<td>C$ ${t.commission.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
<td>${t.paymentMethod}</td>
<td>${t.createdAt.toLocaleDateString('es-NI')}</td>
</tr>
`
  }
  transTable += '</table>'
  sections.push({
    heading: '2. Transacciones Recientes',
    content: transTable,
  })

  // Section 3: Productos Destacados
  let prodTable = `
<table>
<tr><th>Producto</th><th>Precio (C$)</th><th>Vendedor</th><th>Categoría</th><th>Estado</th></tr>
`
  for (const p of topProducts) {
    prodTable += `<tr>
<td>${escapeHtml(p.title)}</td>
<td>C$ ${(p.discountPrice || p.price).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
<td>${escapeHtml(p.seller?.name || 'N/A')}</td>
<td>${escapeHtml(p.category || 'Sin categoría')}</td>
<td>${p.status}</td>
</tr>
`
  }
  prodTable += '</table>'
  sections.push({
    heading: '3. Productos Recientes',
    content: prodTable,
  })

  // Section 4: Usuarios Recientes
  let userTable = `
<table>
<tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Verificado</th><th>Fecha Registro</th></tr>
`
  for (const u of recentUsers) {
    userTable += `<tr>
<td>${escapeHtml(u.name || 'Sin nombre')}</td>
<td>${escapeHtml(u.email)}</td>
<td>${u.role}</td>
<td>${u.isVerified ? 'Sí' : 'No'}</td>
<td>${u.createdAt.toLocaleDateString('es-NI')}</td>
</tr>
`
  }
  userTable += '</table>'
  sections.push({
    heading: '4. Usuarios Recientes',
    content: userTable,
  })

  return generateDocx(
    'Reporte de ProveedorConecta Nicaragua',
    'Informe integral del estado de la plataforma marketplace',
    sections
  )
}

// ─── Main GET Handler ──────────────────────────────────────────────────────

async function handleGet(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const type = searchParams.get('type') || 'transactions'
    const admin = isAdmin(user.role)

    // ─── CSV FORMAT ──────────────────────────────────────────────────────
    if (format === 'csv') {
      let csvContent = ''
      let filename = ''

      switch (type) {
        case 'transactions': {
          const transactions = await getTransactionData(user.id, admin)
          csvContent = generateTransactionsCsv(transactions)
          filename = 'transacciones.csv'
          break
        }

        case 'commissions': {
          if (!admin) {
            return NextResponse.json({ success: false, error: 'Solo el administrador' }, { status: 200 })
          }
          const commissionLogs = await getCommissionData()
          csvContent = generateCommissionsCsv(commissionLogs)
          filename = 'comisiones.csv'
          break
        }

        case 'users': {
          if (!admin) {
            return NextResponse.json({ success: false, error: 'Solo el administrador' }, { status: 200 })
          }
          const users = await getUserData()
          csvContent = generateUsersCsv(users)
          filename = 'usuarios.csv'
          break
        }

        case 'products': {
          const products = await getProductData(user.id, admin)
          csvContent = generateProductsCsv(products)
          filename = 'productos.csv'
          break
        }

        default:
          return NextResponse.json({ success: false, error: 'Tipo de exportación no válido' }, { status: 200 })
      }

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // ─── JSON FORMAT ─────────────────────────────────────────────────────
    if (format === 'json') {
      let csvContent = ''
      switch (type) {
        case 'transactions': {
          const transactions = await getTransactionData(user.id, admin)
          csvContent = generateTransactionsCsv(transactions)
          break
        }
        case 'commissions': {
          if (!admin) {
            return NextResponse.json({ success: false, error: 'Solo el administrador' }, { status: 200 })
          }
          const commissionLogs = await getCommissionData()
          csvContent = generateCommissionsCsv(commissionLogs)
          break
        }
        case 'users': {
          if (!admin) {
            return NextResponse.json({ success: false, error: 'Solo el administrador' }, { status: 200 })
          }
          const users = await getUserData()
          csvContent = generateUsersCsv(users)
          break
        }
        case 'products': {
          const products = await getProductData(user.id, admin)
          csvContent = generateProductsCsv(products)
          break
        }
        default:
          return NextResponse.json({ success: false, error: 'Tipo de exportación no válido' }, { status: 200 })
      }

      const lines = csvContent.split('\n').filter(Boolean)
      const headers = lines[0]?.split(',') || []
      const jsonData = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^,]+)/g) || []
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => {
          obj[h.trim().replace(/"/g, '')] = (values[i] || '').replace(/^"|"$/g, '')
        })
        return obj
      })
      return NextResponse.json({ success: true, data: jsonData })
    }

    // ─── XLSX FORMAT (SpreadsheetML) ────────────────────────────────────
    if (format === 'xlsx') {
      let xlsxContent = ''
      let filename = ''

      switch (type) {
        case 'products': {
          const products = await getProductData(user.id, admin)
          xlsxContent = generateProductsXlsx(products)
          filename = 'productos.xlsx'
          break
        }

        case 'transactions': {
          const transactions = await getTransactionData(user.id, admin)
          xlsxContent = generateTransactionsXlsx(transactions)
          filename = 'transacciones.xlsx'
          break
        }

        default:
          return NextResponse.json(
            { success: false, error: 'Tipo de exportación Excel no válido. Use: products, transactions' },
            { status: 200 }
          )
      }

      return new NextResponse(xlsxContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    // ─── DOCX FORMAT (HTML-based Word document) ─────────────────────────
    if (format === 'docx') {
      switch (type) {
        case 'report': {
          if (!admin) {
            return NextResponse.json({ success: false, error: 'Solo el administrador puede generar reportes' }, { status: 200 })
          }
          const docxContent = await generateReportDocx()
          const filename = `reporte_proveedorconecta_${new Date().toISOString().split('T')[0]}.doc`

          return new NextResponse(docxContent, {
            status: 200,
            headers: {
              'Content-Type': 'application/msword; charset=utf-8',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          })
        }

        default:
          return NextResponse.json(
            { success: false, error: 'Tipo de documento no válido. Use: report' },
            { status: 200 }
          )
      }
    }

    // Unknown format
    return NextResponse.json(
      { success: false, error: 'Formato no válido. Use: csv, json, xlsx, docx' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ success: false, error: 'Error al exportar datos' }, { status: 200 })
  }
}

export const GET = safeApiHandler(handleGet)
