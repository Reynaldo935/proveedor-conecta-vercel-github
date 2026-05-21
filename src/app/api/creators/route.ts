import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const FALLBACK_CREATORS = [
  {
    id: "1",
    name: "Apolonio",
    role: "Desarrollador Backend",
    bio: "Especialista en PHP, Laravel y bases de datos. Arquitecto del sistema de comisiones y pagos.",
    photo: "",
    email: "",
    color: "#1A5276"
  },
  {
    id: "2",
    name: "Arbela",
    role: "Marketing Digital",
    bio: "Experta en estrategia de mercado y posicionamiento de marca. Lidera las campañas publicitarias.",
    photo: "",
    email: "",
    color: "#2E86C1"
  },
  {
    id: "3",
    name: "Mychael",
    role: "Desarrollador Fullstack",
    bio: "Dominio completo de React, Node.js y TypeScript. Constructor del frontend y las APIs en tiempo real.",
    photo: "",
    email: "",
    color: "#1E8449"
  },
  {
    id: "4",
    name: "Pedro",
    role: "Diseño Gráfico",
    bio: "Diseñador UI/UX con ojo para el detalle. Creador de la identidad visual y experiencia de usuario.",
    photo: "",
    email: "",
    color: "#F4D03F"
  },
  {
    id: "5",
    name: "Reynaldo",
    role: "Comunicador y Fundador",
    bio: "Visionario y líder del proyecto. Conexión con proveedores nicaragüenses y administración general.",
    photo: "",
    email: "rey7214935@gmail.com",
    color: "#C0392B"
  }
]

export async function GET() {
  try {
    // Try to read from secure data file
    const dataPath = path.join(process.cwd(), 'data', 'creators.json')
    if (existsSync(dataPath)) {
      const data = readFileSync(dataPath, 'utf-8')
      const creators = JSON.parse(data)
      return NextResponse.json({ success: true, data: creators })
    }
  } catch {
    // Fall through to fallback
  }

  return NextResponse.json({ success: true, data: FALLBACK_CREATORS })
}

export async function PUT(request: Request) {
  try {
    const { writeFile, mkdir } = await import('fs/promises')
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    // Only admin (rey7214935@gmail.com) can update creators
    const { db } = await import('@/lib/db')
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.email !== 'rey7214935@gmail.com') {
      return NextResponse.json({ success: false, error: 'Solo el administrador puede actualizar el equipo' }, { status: 403 })
    }

    const body = await request.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Formato inválido' }, { status: 400 })
    }

    // Save to data directory
    const dataDir = path.join(process.cwd(), 'data')
    await mkdir(dataDir, { recursive: true })
    await writeFile(path.join(dataDir, 'creators.json'), JSON.stringify(body, null, 2))

    return NextResponse.json({ success: true, data: body })
  } catch (error) {
    console.error('Update creators error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar equipo' }, { status: 500 })
  }
}
