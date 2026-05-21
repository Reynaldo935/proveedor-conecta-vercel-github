import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const type = searchParams.get('type') || 'transactions'

    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'transactions': {
        const where = user?.email === 'rey7214935@gmail.com' ? {} : { OR: [{ buyerId: userId }, { sellerId: userId }] }
        const transactions = await db.transaction.findMany({
          where,
          include: {
            buyer: { select: { name: true, email: true } },
            seller: { select: { name: true, email: true } },
            product: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
        })

        csvContent = 'ID,Comprador,Email Comprador,Vendedor,Email Vendedor,Producto,Monto,Comisión,Pago Vendedor,Método Pago,Estado,Fecha\n'
        for (const t of transactions) {
          csvContent += `"${t.id}","${t.buyer?.name || ''}","${t.buyer?.email || ''}","${t.seller?.name || ''}","${t.seller?.email || ''}","${t.product?.title || ''}",${t.amount},${t.commission},${t.sellerPayout},"${t.paymentMethod}","${t.status}","${t.createdAt.toISOString()}"\n`
        }
        filename = 'transacciones.csv'
        break
      }

      case 'commissions': {
        if (user?.email !== 'rey7214935@gmail.com') {
          return NextResponse.json({ success: false, error: 'Solo el administrador' }, { status: 403 })
        }
        const commissionLogs = await db.commissionLog.findMany({
          orderBy: { createdAt: 'desc' },
        })

        csvContent = 'ID,Transacción ID,Comisión,Tasa,Destino,Cuenta Banco,Estado,Fecha\n'
        for (const c of commissionLogs) {
          csvContent += `"${c.id}","${c.transactionId}",${c.amount},${c.rate},"${c.destination}","${c.bankAccount}","${c.status}","${c.createdAt.toISOString()}"\n`
        }
        filename = 'comisiones.csv'
        break
      }

      case 'users': {
        if (user?.email !== 'rey7214935@gmail.com') {
          return NextResponse.json({ success: false, error: 'Solo el administrador' }, { status: 403 })
        }
        const users = await db.user.findMany({
          select: {
            id: true, name: true, email: true, role: true, helperRole: true,
            phone: true, department: true, isVerified: true, createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        })

        csvContent = 'ID,Nombre,Email,Rol,Rol Ayudante,Teléfono,Departamento,Verificado,Fecha Registro\n'
        for (const u of users) {
          csvContent += `"${u.id}","${u.name}","${u.email}","${u.role}","${u.helperRole}","${u.phone}","${u.department}",${u.isVerified},"${u.createdAt.toISOString()}"\n`
        }
        filename = 'usuarios.csv'
        break
      }

      case 'products': {
        const products = await db.product.findMany({
          where: user?.email === 'rey7214935@gmail.com' ? {} : { sellerId: userId },
          include: {
            seller: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        })

        csvContent = 'ID,Título,Precio,Precio Descuento,Categoría,Estado,Vendedor,Email Vendedor,Cantidad,Fecha\n'
        for (const p of products) {
          csvContent += `"${p.id}","${p.title}",${p.price},${p.discountPrice || ''},"${p.category}","${p.status}","${p.seller?.name || ''}","${p.seller?.email || ''}",${p.quantity},"${p.publishedAt.toISOString()}"\n`
        }
        filename = 'productos.csv'
        break
      }

      default:
        return NextResponse.json({ success: false, error: 'Tipo de exportación no válido' }, { status: 400 })
    }

    if (format === 'json') {
      // For JSON format, parse CSV back or return structured data
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

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ success: false, error: 'Error al exportar datos' }, { status: 500 })
  }
}
