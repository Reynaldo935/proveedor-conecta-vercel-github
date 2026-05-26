import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

const FALLBACK_CREATORS = [
  {
    id: "1",
    name: "Apolonio",
    role: "Desarrollador Frontend",
    bio: "Especialista en React, CSS y diseño de interfaces. Constructor de la experiencia visual e interactiva del proyecto.",
    photo: "https://estunanleonedu-my.sharepoint.com/:i:/g/personal/reynaldo_lozano24_est_unanleon_edu_ni/IQAheKoz315MS590nE10ozWsAS5Q-V_90AJ_AjHqX11Wltg?e=WkLqEV",
    email: "vivasromerooo@gmail.com",
    color: "#1A5276"
  },
  {
    id: "2",
    name: "Arbela",
    role: "Diseño Gráfico",
    bio: "Diseñadora gráfica con ojo para el detalle. Creadora de la identidad visual, materiales gráficos y experiencia de usuario.",
    photo: "https://estunanleonedu-my.sharepoint.com/:i:/g/personal/reynaldo_lozano24_est_unanleon_edu_ni/IQDfBb7SyB1ETpuQHleN68dIASDX8TeskVcA1_AjvYMy5Mc?e=KglfjL",
    email: "arbelaspacheco@gmail.com",
    color: "#2E86C1"
  },
  {
    id: "3",
    name: "Mychael",
    role: "Marketing",
    bio: "Experto en estrategia de mercado y posicionamiento de marca. Lidera las campañas publicitarias y comunicación digital.",
    photo: "https://estunanleonedu-my.sharepoint.com/:i:/g/personal/reynaldo_lozano24_est_unanleon_edu_ni/IQB6U_Ed_3baQ4UZTpZCmxTPAd6XwOQ8einLdwZb8j2TaB0?e=jiJQYA",
    email: "Mychaelcanales336@gmail.com",
    color: "#1E8449"
  },
  {
    id: "4",
    name: "Pedro",
    role: "Comunicador",
    bio: "Comunicador estratégico y gestor de relaciones. Conexión con proveedores nicaragüenses y administración general.",
    photo: "https://estunanleonedu-my.sharepoint.com/:i:/g/personal/reynaldo_lozano24_est_unanleon_edu_ni/IQCdy-kHipplRricV2I3NQ5oATPoU6hkYh1oYH4sMeBwmN8?e=z1TX5h",
    email: "Pedripointer2007@gmail.com",
    color: "#F4D03F"
  },
  {
    id: "5",
    name: "Reynaldo",
    role: "Desarrollador Fullstack",
    bio: "Dominio completo de React, Node.js y TypeScript. Constructor del frontend y las APIs en tiempo real.DATABASE, CIBER SEGURIDAD, FRONTEND, BACKEND, APIS.",
    photo: "https://estunanleonedu-my.sharepoint.com/:i:/g/personal/reynaldo_lozano24_est_unanleon_edu_ni/IQDzHntfPKpzT5pLNXS4q-fIAbLJK8qqTwKi9nfo8Q-8rO0?e=W5f03P",
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
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    await setAuthCookie(userId)

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
