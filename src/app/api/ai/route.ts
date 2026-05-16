import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('pc_user_id')?.value

    const body = await request.json()
    const { message, context } = body

    if (!message) {
      return NextResponse.json({ success: false, error: 'Mensaje requerido' }, { status: 400 })
    }

    // Try using z-ai-web-dev-sdk LLM
    try {
      const { LLM } = await import('z-ai-web-dev-sdk')
      const llm = new LLM()
      
      const systemPrompt = `Eres el asistente virtual de ProveedorConecta Nicaragua, una plataforma B2B/B2C que conecta emprendedores y MIPYMES con proveedores de insumos, materia prima, servicios y equipos productivos en Nicaragua.

Tu rol es:
- Ayudar a los usuarios a encontrar proveedores y productos
- Responder preguntas sobre cómo usar la plataforma
- Sugerir categorías de productos según las necesidades del usuario
- Brindar información sobre métodos de pago disponibles (PayPal, Banpro, BAC, Lafise, Billetera Móvil)
- Recomendar estrategias para emprendedores nicaragüenses
- Responder siempre en español

Contexto adicional del usuario: ${context || 'Sin contexto adicional'}`

      const response = await llm.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      })

      return NextResponse.json({
        success: true,
        data: {
          message: response.content || response.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu consulta. Intenta de nuevo.',
          model: 'Z.ai LLM',
        },
      })
    } catch (llmError) {
      console.error('LLM error, using fallback:', llmError)
      
      // Fallback: rule-based responses
      const lowerMsg = message.toLowerCase()
      let response = ''
      let model = 'Asistente Local (Fallback)'

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

      return NextResponse.json({ success: true, data: { message: response, model } })
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
