import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

// Fallback rule-based responses (no outbound HTTP needed)
function getFallbackResponse(message: string, userId: string | null): { message: string; model: string } {
  const lowerMsg = message.toLowerCase()
  let response = ''

  if (lowerMsg.includes('proveedor') || lowerMsg.includes('buscar')) {
    response = '¡Te ayudo a encontrar proveedores! Puedes usar el buscador en la página principal con filtros por categoría, ubicación y rango de precios. También puedes explorar el mapa interactivo para ver proveedores cercanos. ¿Qué tipo de producto o servicio buscas?'
  } else if (lowerMsg.includes('pago') || lowerMsg.includes('pagar') || lowerMsg.includes('banco')) {
    response = 'Aceptamos múltiples métodos de pago en Nicaragua: PayPal, Banpro, BAC Credomatic, Lafise y Billetera Móvil (Tigo Money). Cada método tiene su propio formulario con validación de datos. ¿Sobre cuál método quieres saber más?'
  } else if (lowerMsg.includes('vender') || lowerMsg.includes('publicar') || lowerMsg.includes('producto')) {
    response = 'Para vender en ProveedorConecta: 1) Regístrate como Vendedor, 2) Haz clic en "Vender", 3) Sigue los 3 pasos: subir fotos, agregar detalles, y opcionalmente configurar descuento. ¡Tu producto aparecerá instantáneamente en el feed!'
  } else if (lowerMsg.includes('cotización') || lowerMsg.includes('cotizar') || lowerMsg.includes('rfq')) {
    response = 'Puedes solicitar cotizaciones (RFQ) desde la sección "Cotizaciones". Describe tu necesidad y los vendedores del rubro te enviarán propuestas con precio y tiempo de entrega dentro de la plataforma.'
  } else if (lowerMsg.includes('hola') || lowerMsg.includes('buenos') || lowerMsg.includes('ayuda')) {
    response = '¡Hola! 👋 Soy el asistente virtual de ProveedorConecta Nicaragua. Estoy aquí para ayudarte a: 🔍 Encontrar proveedores, 💰 Conocer métodos de pago, 📦 Publicar productos, 📋 Solicitar cotizaciones, 🗺️ Usar el mapa de proveedores. ¿En qué te puedo ayudar?'
  } else {
    response = 'Gracias por tu mensaje. Puedo ayudarte con: búsqueda de proveedores, métodos de pago, publicación de productos, cotizaciones y más. ¿Qué necesitas específicamente?'
  }

  return { message: response, model: 'Asistente Local' }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (userId) await setAuthCookie(userId)

    const body = await request.json()
    const { message, context } = body

    if (!message) {
      return NextResponse.json({ success: false, error: 'Mensaje requerido' }, { status: 400 })
    }

    // Try using z-ai-web-dev-sdk LLM with a timeout to prevent server hangs
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const systemPrompt = `Eres el asistente virtual de ProveedorConecta Nicaragua, una plataforma B2B/B2C que conecta emprendedores y MIPYMES con proveedores de insumos, materia prima, servicios y equipos productivos en Nicaragua.

Tu rol es:
- Ayudar a los usuarios a encontrar proveedores y productos
- Responder preguntas sobre cómo usar la plataforma
- Sugerir categorías de productos según las necesidades del usuario
- Brindar información sobre métodos de pago disponibles (PayPal, Banpro, BAC, Lafise, Billetera Móvil)
- Recomendar estrategias para emprendedores nicaragüenses
- Responder siempre en español
${userId ? `- El usuario está autenticado en la plataforma` : '- El usuario no ha iniciado sesión'}

Contexto adicional del usuario: ${context || 'Sin contexto adicional'}`

      const completionPromise = zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: message },
        ],
        thinking: { type: 'disabled' },
      })

      // 8-second timeout to prevent server crashes from hung outbound HTTP
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM timeout')), 8000)
      )

      const completion = await Promise.race([completionPromise, timeoutPromise])

      const response = completion?.choices?.[0]?.message?.content

      return NextResponse.json({
        success: true,
        data: {
          message: response || 'Lo siento, no pude procesar tu consulta. Intenta de nuevo.',
          model: 'Z.ai LLM',
        },
      })
    } catch (llmError) {
      // LLM failed or timed out — use local fallback (no outbound HTTP)
      console.error('LLM error, using fallback:', llmError instanceof Error ? llmError.message : String(llmError))
      const fallback = getFallbackResponse(message, userId)
      return NextResponse.json({ success: true, data: fallback })
    }
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({
      success: true,
      data: {
        message: 'Lo siento, hubo un error temporal. Por favor intenta de nuevo en unos momentos.',
        model: 'Sistema (Error Recovery)',
      },
    })
  }
}
