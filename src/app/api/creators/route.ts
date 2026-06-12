import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'

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

// In-memory override (persists while server is running; resets on serverless cold start)
let overrideCreators: typeof FALLBACK_CREATORS | null = null

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: overrideCreators || FALLBACK_CREATORS,
    })
  } catch (error) {
    console.error('Get creators error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener equipo' },
      { status: 200 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 200 })
    }
    await setAuthCookie(userId)

    // Only admin can update creators
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Solo el administrador puede actualizar el equipo' }, { status: 200 })
    }

    const body = await request.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Formato inválido' }, { status: 200 })
    }

    // Store in-memory (no filesystem on Vercel)
    overrideCreators = body

    return NextResponse.json({ success: true, data: body })
  } catch (error) {
    console.error('Update creators error:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar equipo' }, { status: 200 })
  }
}
