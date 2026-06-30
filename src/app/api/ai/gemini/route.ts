/**
 * POST /api/ai/gemini — Google Gemini AI (FREE tier)
 * 
 * Uses Gemini 1.5 Flash free tier: 15 RPM, 1M tokens/min
 * Falls back to local knowledge base if API key not configured.
 */
import { NextRequest, NextResponse } from 'next/server'

// Use a hardcoded free API key for the hackathon
// This is a free-tier key — replace with your own at https://aistudio.google.com/apikey
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory } = body

    if (!message) {
      return NextResponse.json({ success: false, error: 'Mensaje requerido' }, { status: 200 })
    }

    // If no API key, fall back to local knowledge base
    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        data: { message: getLocalKnowledgeResponse(message), model: 'ProveedorConecta (offline)' }
      })
    }

    // Build conversation context
    const history = (conversationHistory || []).slice(-6)
    const context = `Eres el asistente virtual de ProveedorConecta Nicaragua, una plataforma B2B/B2C de marketplace nicaraguense. 
    
INFORMACION DE LA PLATAFORMA:
- 328 productos en 16 categorias
- 20+ proveedores oficiales nicaraguenses (Flor de Cana, Cafe Toro, Ferromax, CCN, Pollo Tip Top, etc.)
- 11 metodos de pago: Banpro, BAC, LAFISE, PayPal, PixelPay, Pagadito, Google Pay, Kash, Tigo Money, Western Union, Banpro Billetera
- Chat en tiempo real entre compradores y vendedores
- Mapa GPS interactivo con Leaflet/OpenStreetMap
- Sistema de cotizaciones RFQ
- Panel de administracion con estadisticas y backup
- Autenticacion con Clerk (Google/Email)
- Comision de plataforma: 3%
- Monedas: Cordobas (NIO) y Dolares (USD)
- Admin unico: rey7214935@gmail.com

Responde SIEMPRE en espanol, de forma util, amigable y concisa. Si no sabes algo, derivame a la pagina de ProveedorConecta.`

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`
    
    const contents = [
      { role: "user" as const, parts: [{ text: context }] },
      { role: "model" as const, parts: [{ text: "Entendido. Soy el asistente de ProveedorConecta Nicaragua. ¿En que puedo ayudarte?" }] },
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: h.content }]
      })),
      { role: "user" as const, parts: [{ text: message }] }
    ]

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        }
      })
    })

    if (geminiRes.ok) {
      const geminiData = await geminiRes.json()
      const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.'
      return NextResponse.json({
        success: true,
        data: { message: reply, model: 'Gemini 1.5 Flash' }
      })
    }

    // Gemini failed — use local knowledge
    return NextResponse.json({
      success: true,
      data: { message: getLocalKnowledgeResponse(message), model: 'ProveedorConecta (fallback)' }
    })

  } catch (error) {
    console.error('Gemini error:', error)
    return NextResponse.json({
      success: true,
      data: { message: getLocalKnowledgeResponse(''), model: 'ProveedorConecta (local)' }
    })
  }
}

function getLocalKnowledgeResponse(msg: string): string {
  const q = msg.toLowerCase()
  
  if (q.includes('pago') || q.includes('banco')) {
    return '💳 **11 métodos de pago**: Banpro, BAC, LAFISE, PayPal, PixelPay, Pagadito, Google Pay, Kash, Tigo Money, Western Union, Banpro Billetera. Todos redirigen a los canales oficiales de cada banco. La plataforma cobra 3% de comisión.'
  }
  if (q.includes('proveedor') || q.includes('catalogo')) {
    return '🏪 **20+ proveedores oficiales**: Flor de Caña, Café Toro, Ferromax, CCN, Pollo Tip Top, AGRICORP, Doselva, Lala, PROINCO, La Curacao, Casa Pellas, Disagro, Nicanaturals, y más. Ve a Menú → Catálogos Oficiales para verlos todos.'
  }
  if (q.includes('vender') || q.includes('publicar')) {
    return '📦 Para vender: Regístrate, ve a tu Perfil, haz clic en "Convertirse en Vendedor", completa tu perfil de negocio, y publica productos con fotos. Tus productos aparecerán en el Marketplace y en Catálogos → Vendedores.'
  }
  if (q.includes('admin') || q.includes('administrador')) {
    return '👑 El administrador único es rey7214935@gmail.com. Tiene acceso al Panel Admin con estadísticas, auditoría, backup de base de datos, y puede ver todos los usuarios registrados.'
  }
  
  return '¡Hola! Soy el asistente de ProveedorConecta Nicaragua. Puedo ayudarte con:\n\n🔍 **Proveedores** - 20+ proveedores oficiales\n💰 **Pagos** - 11 métodos bancarios\n📦 **Vender** - Publica tus productos\n📋 **Cotizaciones** - Solicita presupuestos\n🗺️ **Mapa GPS** - Proveedores por ubicación\n💬 **Chat** - Comunícate con vendedores\n\n¿Qué necesitas?'
}
