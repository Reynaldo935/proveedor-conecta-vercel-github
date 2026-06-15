import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'
import { safeApiHandler } from '@/lib/api-utils'
import { deflateSync } from 'zlib'

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

// ─── PPTX Report Generator (Office Open XML ZIP-based) ──────────────────────

interface ZipEntry {
  name: string
  data: Buffer
}

function buildZip(entries: ZipEntry[]): Buffer {
  const localHeaders: Buffer[] = []
  const centralHeaders: Buffer[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf-8')
    const compressed = deflateSync(entry.data)
    const crc = crc32(entry.data)

    // Local file header (30 + name length + compressed data)
    const local = Buffer.alloc(30 + nameBuf.length + compressed.length)
    local.writeUInt32LE(0x04034b50, 0) // signature
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0x0008, 6) // flags: data descriptor
    local.writeUInt16LE(8, 8) // compression: deflate
    local.writeUInt16LE(0, 10) // mod time
    local.writeUInt16LE(0, 12) // mod date
    local.writeUInt32LE(crc, 14) // crc32
    local.writeUInt32LE(compressed.length, 18) // compressed size
    local.writeUInt32LE(entry.data.length, 22) // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26) // name length
    local.writeUInt16LE(0, 28) // extra length
    nameBuf.copy(local, 30)
    compressed.copy(local, 30 + nameBuf.length)
    localHeaders.push(local)

    // Central directory header
    const central = Buffer.alloc(46 + nameBuf.length)
    central.writeUInt32LE(0x02014b50, 0) // signature
    central.writeUInt16LE(20, 4) // version made by
    central.writeUInt16LE(20, 6) // version needed
    central.writeUInt16LE(0x0008, 8) // flags
    central.writeUInt16LE(8, 10) // compression: deflate
    central.writeUInt16LE(0, 12) // mod time
    central.writeUInt16LE(0, 14) // mod date
    central.writeUInt32LE(crc, 16) // crc32
    central.writeUInt32LE(compressed.length, 20) // compressed size
    central.writeUInt32LE(entry.data.length, 24) // uncompressed size
    central.writeUInt16LE(nameBuf.length, 28) // name length
    central.writeUInt16LE(0, 30) // extra length
    central.writeUInt16LE(0, 32) // comment length
    central.writeUInt16LE(0, 34) // disk number
    central.writeUInt16LE(0, 36) // internal attrs
    central.writeUInt32LE(0, 38) // external attrs
    central.writeUInt32LE(offset, 42) // local header offset
    nameBuf.copy(central, 46)
    centralHeaders.push(central)

    offset += local.length
  }

  const centralOffset = offset
  let centralSize = 0
  for (const c of centralHeaders) centralSize += c.length

  // End of central directory
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0) // signature
  end.writeUInt16LE(0, 4) // disk number
  end.writeUInt16LE(0, 6) // disk with central dir
  end.writeUInt16LE(entries.length, 8) // entries on disk
  end.writeUInt16LE(entries.length, 10) // total entries
  end.writeUInt32LE(centralSize, 12) // central dir size
  end.writeUInt32LE(centralOffset, 16) // central dir offset
  end.writeUInt16LE(0, 20) // comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, end])
}

function crc32(buf: Buffer): number {
  // CRC32 lookup table
  const table: number[] = []
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c
  }
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

async function generateReportPptx(): Promise<Buffer> {
  // Gather data
  const [
    totalUsers,
    totalProducts,
    totalTransactions,
    totalRevenue,
    recentTransactions,
    recentProducts,
  ] = await Promise.all([
    db.user.count(),
    db.product.count(),
    db.transaction.count(),
    db.transaction.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
    db.transaction.findMany({
      where: { status: 'COMPLETED' },
      include: {
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
        product: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    db.product.findMany({
      where: { status: 'ACTIVE' },
      include: { seller: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  const revenue = totalRevenue._sum.amount || 0

  // Helper to build slide XML
  function titleSlide(title: string, subtitle: string): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title 1"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="ctrTitle"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="685800" y="1597819"/><a:ext cx="7772400" cy="1325563"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="es-NI" sz="4400" b="1" dirty="0"/><a:t>${escapeXml(title)}</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Subtitle 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="subTitle" idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="1143000" y="3200400"/><a:ext cx="6858000" cy="1655762"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="es-NI" sz="2400" dirty="0"/><a:t>${escapeXml(subtitle)}</a:t></a:r></a:p></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
  }

  function contentSlide(title: string, bodyLines: string[]): string {
    const bodyXml = bodyLines.map(line =>
      `<a:p><a:r><a:rPr lang="es-NI" sz="1800" dirty="0"/><a:t>${escapeXml(line)}</a:t></a:r></a:p>`
    ).join('\n')

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title 1"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="274638"/><a:ext cx="8229600" cy="1143000"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="es-NI" sz="3200" b="1" dirty="0"/><a:t>${escapeXml(title)}</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Content 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="1600200"/><a:ext cx="8229600" cy="4525963"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/>${bodyXml}</p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
  }

  // Build slide content
  const slide1 = titleSlide(
    'ProveedorConecta Nicaragua - Reporte',
    `Informe ejecutivo del marketplace | ${new Date().toLocaleDateString('es-NI', { dateStyle: 'long' })}`
  )

  const statsLines = [
    `Total de Usuarios: ${totalUsers}`,
    `Total de Productos: ${totalProducts}`,
    `Total de Transacciones: ${totalTransactions}`,
    `Ingresos Totales: C$ ${revenue.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`,
    '',
    'Estadísticas generadas automáticamente por la plataforma.',
  ]
  const slide2 = contentSlide('Resumen Estadístico', statsLines)

  const transLines = recentTransactions.length > 0
    ? recentTransactions.map(t =>
        `${t.product?.title || 'N/A'} | ${t.buyer?.name || 'N/A'} → ${t.seller?.name || 'N/A'} | C$ ${t.amount.toLocaleString('es-NI', { minimumFractionDigits: 2 })} | ${t.createdAt.toLocaleDateString('es-NI')}`
      )
    : ['No hay transacciones recientes.']
  const slide3 = contentSlide('Transacciones Recientes', transLines)

  const prodLines = recentProducts.length > 0
    ? recentProducts.map(p =>
        `${p.title} | C$ ${(p.discountPrice || p.price).toLocaleString('es-NI', { minimumFractionDigits: 2 })} | ${p.seller?.name || 'N/A'} | ${p.category}`
      )
    : ['No hay productos recientes.']
  const slide4 = contentSlide('Productos Recientes', prodLines)

  // Build ZIP entries for OOXML
  const entries: ZipEntry[] = []

  // [Content_Types].xml
  entries.push({
    name: '[Content_Types].xml',
    data: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide4.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`, 'utf-8'),
  })

  // _rels/.rels
  entries.push({
    name: '_rels/.rels',
    data: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`, 'utf-8'),
  })

  // ppt/presentation.xml
  entries.push({
    name: 'ppt/presentation.xml',
    data: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
    <p:sldId id="257" r:id="rId3"/>
    <p:sldId id="258" r:id="rId4"/>
    <p:sldId id="259" r:id="rId5"/>
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`, 'utf-8'),
  })

  // ppt/_rels/presentation.xml.rels
  entries.push({
    name: 'ppt/_rels/presentation.xml.rels',
    data: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide3.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide4.xml"/>
</Relationships>`, 'utf-8'),
  })

  // Slide files
  const slides = [slide1, slide2, slide3, slide4]
  for (let i = 0; i < slides.length; i++) {
    entries.push({
      name: `ppt/slides/slide${i + 1}.xml`,
      data: Buffer.from(slides[i], 'utf-8'),
    })
    entries.push({
      name: `ppt/slides/_rels/slide${i + 1}.xml.rels`,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`, 'utf-8'),
    })
  }

  return buildZip(entries)
}

// ─── PDF Report Generator ────────────────────────────────────────────────────

async function generateReportPdf(): Promise<string> {
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
      take: 15,
    }),
    db.product.findMany({
      where: { status: 'ACTIVE' },
      include: { seller: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
  ])

  const revenue = totalRevenue._sum.amount || 0
  const commission = totalCommission._sum.amount || 0

  let transRows = ''
  for (const t of recentTransactions) {
    transRows += `<tr>
      <td>${escapeHtml(t.product?.title || 'N/A')}</td>
      <td>${escapeHtml(t.buyer?.name || 'N/A')}</td>
      <td>${escapeHtml(t.seller?.name || 'N/A')}</td>
      <td class="num">C$ ${t.amount.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
      <td class="num">C$ ${t.commission.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
      <td>${t.paymentMethod}</td>
      <td>${t.createdAt.toLocaleDateString('es-NI')}</td>
    </tr>`
  }

  let prodRows = ''
  for (const p of topProducts) {
    prodRows += `<tr>
      <td>${escapeHtml(p.title)}</td>
      <td class="num">C$ ${(p.discountPrice || p.price).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
      <td>${escapeHtml(p.seller?.name || 'N/A')}</td>
      <td>${escapeHtml(p.category || 'Sin categoría')}</td>
      <td>${p.status}</td>
    </tr>`
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Reporte ProveedorConecta Nicaragua</title>
<style>
  @page { size: A4; margin: 1.5cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.5; }
  .header { text-align: center; padding: 20pt 0 15pt; border-bottom: 3px solid #1A5276; margin-bottom: 20pt; }
  .header h1 { font-size: 20pt; color: #1A5276; margin-bottom: 4pt; }
  .header .subtitle { font-size: 11pt; color: #555; }
  .header .date { font-size: 9pt; color: #888; margin-top: 6pt; }
  h2 { font-size: 14pt; color: #1A5276; margin: 18pt 0 10pt; border-bottom: 2px solid #2E86C1; padding-bottom: 4pt; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10pt; margin: 10pt 0 20pt; }
  .stat-card { background: #f0f4f8; border: 1px solid #d0d8e0; border-radius: 6pt; padding: 10pt 12pt; text-align: center; }
  .stat-card .value { font-size: 18pt; font-weight: bold; color: #1A5276; }
  .stat-card .label { font-size: 8pt; color: #666; margin-top: 2pt; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 9pt; }
  th { background: #1A5276; color: #fff; padding: 6pt 8pt; text-align: left; font-weight: 600; }
  td { padding: 5pt 8pt; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #f8f9fa; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .footer { margin-top: 30pt; padding-top: 10pt; border-top: 1px solid #ccc; font-size: 8pt; color: #888; text-align: center; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <h1>ProveedorConecta Nicaragua</h1>
  <div class="subtitle">Reporte Ejecutivo del Marketplace</div>
  <div class="date">Generado el: ${new Date().toLocaleString('es-NI', { dateStyle: 'long', timeStyle: 'short' })}</div>
</div>

<h2>1. Resumen Estadístico</h2>
<div class="stats-grid">
  <div class="stat-card"><div class="value">${totalUsers}</div><div class="label">Usuarios</div></div>
  <div class="stat-card"><div class="value">${totalSellers}</div><div class="label">Vendedores</div></div>
  <div class="stat-card"><div class="value">${totalBuyers}</div><div class="label">Compradores</div></div>
  <div class="stat-card"><div class="value">${totalProducts}</div><div class="label">Productos</div></div>
  <div class="stat-card"><div class="value">${activeProducts}</div><div class="label">Productos Activos</div></div>
  <div class="stat-card"><div class="value">${totalTransactions}</div><div class="label">Transacciones</div></div>
  <div class="stat-card"><div class="value">${completedTransactions}</div><div class="label">Completadas</div></div>
  <div class="stat-card"><div class="value">C$ ${revenue.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</div><div class="label">Ingresos Totales</div></div>
  <div class="stat-card"><div class="value">C$ ${commission.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</div><div class="label">Comisiones Pend.</div></div>
</div>

<h2>2. Transacciones Recientes</h2>
<table>
  <thead><tr><th>Producto</th><th>Comprador</th><th>Vendedor</th><th>Monto</th><th>Comisión</th><th>Método</th><th>Fecha</th></tr></thead>
  <tbody>${transRows || '<tr><td colspan="7" style="text-align:center">Sin transacciones</td></tr>'}</tbody>
</table>

<h2>3. Productos Recientes</h2>
<table>
  <thead><tr><th>Producto</th><th>Precio</th><th>Vendedor</th><th>Categoría</th><th>Estado</th></tr></thead>
  <tbody>${prodRows || '<tr><td colspan="5" style="text-align:center">Sin productos</td></tr>'}</tbody>
</table>

<div class="footer">
  <p>ProveedorConecta Nicaragua — Reporte generado automáticamente</p>
  <p>Documento confidencial — Uso exclusivo del administrador del sistema</p>
</div>
</body>
</html>`
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

    // ─── PPTX FORMAT (Office Open XML Presentation) ────────────────────
    if (format === 'pptx') {
      switch (type) {
        case 'report': {
          if (!admin) {
            return NextResponse.json({ success: false, error: 'Solo el administrador puede generar reportes' }, { status: 200 })
          }
          const pptxBuffer = await generateReportPptx()
          const filename = `reporte_proveedorconecta_${new Date().toISOString().split('T')[0]}.pptx`

          return new NextResponse(pptxBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          })
        }

        default:
          return NextResponse.json(
            { success: false, error: 'Tipo de presentación no válido. Use: report' },
            { status: 200 }
          )
      }
    }

    // ─── PDF FORMAT (HTML-based PDF report) ─────────────────────────────
    if (format === 'pdf') {
      switch (type) {
        case 'report': {
          if (!admin) {
            return NextResponse.json({ success: false, error: 'Solo el administrador puede generar reportes' }, { status: 200 })
          }
          const pdfContent = await generateReportPdf()
          const filename = `reporte_proveedorconecta_${new Date().toISOString().split('T')[0]}.pdf`

          return new NextResponse(pdfContent, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
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
      { success: false, error: 'Formato no válido. Use: csv, json, xlsx, docx, pptx, pdf' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ success: false, error: 'Error al exportar datos' }, { status: 200 })
  }
}

export const GET = safeApiHandler(handleGet)
