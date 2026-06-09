import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, setAuthCookie } from '@/lib/auth'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AIRequestBody {
  message: string
  model?: 'zai' | 'fallback'
  conversationHistory?: ConversationMessage[]
  context?: string
}

// ─── Pro Nicaragua System Prompt ──────────────────────────────────────────────
const PRO_NICARAGUA_SYSTEM_PROMPT = `Eres el asistente virtual de ProveedorConecta Nicaragua, la plataforma B2B/B2C líder que conecta emprendedores y MIPYMES con proveedores de insumos, materia prima, servicios y equipos productivos en todo Nicaragua.

## Sobre ProveedorConecta
ProveedorConecta es una plataforma integral que ofrece:
- **Marketplace**: Compra y venta de productos con categorías (Ferretería, Agropecuaria, Tecnología, Construcción, Alimentos, Textiles, Automotriz, Energía Solar, Industrial y más)
- **Chat en tiempo real**: Comunicación directa entre compradores y vendedores vía Socket.IO
- **Cotizaciones (RFQ)**: Los compradores pueden solicitar cotizaciones describiendo sus necesidades y recibir propuestas de múltiples vendedores
- **Mapa interactivo**: Visualización geográfica de proveedores por departamento
- **Pagos seguros**: Múltiples métodos de pago con comisión del 3%
- **Billetera digital**: Sistema de saldo pre-cargado para compras rápidas
- **Sistema de lealtad**: Puntos por compras que se pueden canjear
- **Panel de administración**: Dashboard con estadísticas, gestión de usuarios y contenido
- **Reseñas y calificaciones**: Sistema de feedback para vendedores
- **Búsqueda avanzada**: Filtros por categoría, departamento, rango de precio y más

## Contexto Nicaragüense
- **Moneda**: Córdoba nicaragüense (NIO, símbolo C$). Tasa aproximada: 1 USD ≈ C$36.75
- **Departamentos**: Managua, León, Granada, Masaya, Matagalpa, Estelí, Chinandega, Rivas, Jinotega, Boaco, Nueva Segovia, RAAS, RAAN, Carazo, Chontales, Río San Juan
- **Métodos de pago**:
  - Banpro (banco más grande de Nicaragua, 9-12 dígitos)
  - BAC Credomatic (banco centroamericano, 9-14 dígitos)
  - LAFISE (banco regional, 9-12 dígitos)
  - Billetera Móvil / Tigo Money
  - PayPal
  - PixelPay, Pagadito, Google Pay, Kash, Western Union
- **MIPYMES**: Micro, pequeñas y medianas empresas son el motor de la economía nicaragüense
- **Cédula**: Documento de identidad (formato: 000-000000-0000A o 13 dígitos)
- **Teléfonos**: 8 dígitos, empiezan con 5, 7 u 8

## Tips para MIPYMES
- Usa cotizaciones (RFQ) para comparar precios de múltiples proveedores antes de comprar
- Revisa las reseñas y calificaciones de los vendedores antes de hacer compras grandes
- Aprovecha el mapa interactivo para encontrar proveedores locales y ahorrar en logística
- Publica productos con fotos de alta calidad y descripciones detalladas
- Mantén tu perfil de negocio actualizado con información de contacto verificada
- Usa la billetera digital para pagos más rápidos y seguros
- Responde rápido a las cotizaciones para ganar más clientes

## Reglas de comportamiento
- Responde SIEMPRE en español
- Sé amable, profesional y útil
- Si no sabes algo, sé honesto y sugiere dónde encontrar la información
- Usa emojis moderadamente para hacer la conversación más amena
- Cuando menciones precios, usa el formato C$ para córdobas
- Sugiere características específicas de ProveedorConecta cuando sea relevante
- Si el usuario pregunta sobre temas fuera de plataforma, redirige amablemente`

// ─── Fallback rule-based responses (no outbound HTTP needed) ──────────────────
function getFallbackResponse(message: string, userId: string | null): { message: string; model: string } {
  const lowerMsg = message.toLowerCase()
  let response = ''

  if (lowerMsg.includes('proveedor') || lowerMsg.includes('buscar') || lowerMsg.includes('encontrar')) {
    response = '🔍 ¡Te ayudo a encontrar proveedores! Tienes varias opciones:\n\n1️⃣ **Buscador principal**: Usa la barra de búsqueda con filtros por categoría, departamento y rango de precios\n2️⃣ **Mapa interactivo**: Ve a la sección "Mapa" para ver proveedores cerca de ti\n3️⃣ **Cotizaciones (RFQ)**: Describe tu necesidad y recibe propuestas de múltiples vendedores\n4️⃣ **Explorar por categoría**: Navega las categorías en el feed principal\n\n¿Qué tipo de producto o servicio buscas? Puedo darte recomendaciones específicas.'
  } else if (lowerMsg.includes('pago') || lowerMsg.includes('pagar') || lowerMsg.includes('banco') || lowerMsg.includes('método')) {
    response = '💰 En ProveedorConecta aceptamos múltiples métodos de pago:\n\n🏦 **Bancos nicaragüenses**:\n• Banpro (9-12 dígitos)\n• BAC Credomatic (9-14 dígitos)\n• LAFISE (9-12 dígitos)\n\n📱 **Billetera digital**:\n• Billetera Móvil / Tigo Money\n• Billetera ProveedorConecta (recarga de C$10,000)\n\n🌍 **Métodos internacionales**:\n• PayPal • PixelPay • Pagadito\n• Google Pay • Kash • Western Union\n\n🔒 Todas las transacciones están encriptadas con SSL. La comisión de la plataforma es solo 3%. ¿Sobre cuál método quieres más detalles?'
  } else if (lowerMsg.includes('vender') || lowerMsg.includes('publicar') || lowerMsg.includes('producto')) {
    response = '📦 ¡Excelente! Para vender en ProveedorConecta:\n\n1️⃣ **Regístrate como Vendedor** con tu información de negocio\n2️⃣ Haz clic en **"Vender"** (botón flotante abajo a la izquierda)\n3️⃣ **Sigue los 3 pasos**:\n   • Sube fotos de tu producto\n   • Agrega detalles (título, precio en C$, categoría, descripción)\n   • Configura descuento opcional\n4️⃣ ¡Tu producto aparece instantáneamente en el feed!\n\n💡 **Tips**: Usa fotos claras, descripciones detalladas y precios competitivos. Los productos con fotos reciben 3x más interés.'
  } else if (lowerMsg.includes('cotización') || lowerMsg.includes('cotizar') || lowerMsg.includes('rfq')) {
    response = '📋 Las cotizaciones (RFQ) son una herramienta poderosa:\n\n**Para compradores**:\n• Ve a "Cotizaciones" y describe tu necesidad\n• Especifica cantidad, calidad y plazo de entrega\n• Recibe propuestas de múltiples vendedores\n• Comarca precios y condiciones fácilmente\n\n**Para vendedores**:\n• Revisa las RFQ activas en tu categoría\n• Envía propuestas competitivas con precio y plazo\n• Gana más clientes respondiendo rápido\n\n💡 **Tip MIPYME**: Siempre compara al menos 3 cotizaciones antes de decidir.'
  } else if (lowerMsg.includes('mapa') || lowerMsg.includes('ubicación') || lowerMsg.includes('cerca')) {
    response = '🗺️ El mapa interactivo te ayuda a encontrar proveedores cercanos:\n\n• Accede desde el menú "Mapa"\n• Ve proveedores marcados por departamento\n• Filtra por categoría de producto\n• Haz clic en un marcador para ver detalles del proveedor\n• Contacta directamente desde el mapa\n\n📍 **Departamentos con más proveedores**: Managua, León, Granada, Masaya\n\n¿Buscas proveedores en algún departamento específico?'
  } else if (lowerMsg.includes('hola') || lowerMsg.includes('buenos') || lowerMsg.includes('ayuda') || lowerMsg.includes('buenas')) {
    response = `¡Hola! 👋 Soy el asistente virtual de ProveedorConecta Nicaragua.\n\nEstoy aquí para ayudarte con:\n🔍 Encontrar proveedores y productos\n💰 Métodos de pago (Banpro, BAC, LAFISE, Billetera)\n📦 Publicar productos para vender\n📋 Solicitar cotizaciones (RFQ)\n🗺️ Usar el mapa de proveedores\n💡 Tips para tu MIPYME\n\n${userId ? '✅ Veo que ya tienes cuenta en la plataforma.' : '📝 Regístrate para acceder a todas las funciones.'}\n\n¿En qué te puedo ayudar?`
  } else if (lowerMsg.includes('precio') || lowerMsg.includes('córdoba') || lowerMsg.includes('nio') || lowerMsg.includes('moneda')) {
    response = '💱 Información sobre moneda y precios:\n\n• **Moneda oficial**: Córdoba nicaragüense (NIO, símbolo C$)\n• **Tasa aproximada**: 1 USD ≈ C$36.75\n• Todos los precios en la plataforma están en córdobas (C$)\n• Puedes ver la sección "Divisas" para tasas actualizadas\n• Los pagos se procesan en córdobas\n\n¿Necesitas ayuda con algo específico sobre precios?'
  } else if (lowerMsg.includes('comisión') || lowerMsg.includes('fee') || lowerMsg.includes('porcentaje')) {
    response = '📊 Sobre las comisiones de ProveedorConecta:\n\n• **Comisión de plataforma**: 3% por transacción\n• El vendedor recibe el 97% del monto\n• No hay costos de registro ni membresía\n• Los pagos son seguros con encriptación SSL\n• Sistema de lealtad: ganas puntos por cada compra\n\n¿Tienes más preguntas sobre los costos?'
  } else if (lowerMsg.includes('registro') || lowerMsg.includes('cuenta') || lowerMsg.includes('registrar')) {
    response = '📝 Para registrarte en ProveedorConecta:\n\n1️⃣ Haz clic en "Registrarse"\n2️⃣ Elige tu rol: **Comprador** o **Vendedor**\n3️⃣ Completa tus datos:\n   • Nombre y email\n   • Contraseña segura\n   • Si eres vendedor: datos de tu negocio\n4️⃣ Verifica tu email\n5️⃣ ¡Listo para comprar o vender!\n\n🔒 Tus datos están protegidos y no se comparten con terceros.'
  } else {
    response = 'Gracias por tu mensaje. Puedo ayudarte con:\n\n🔍 **Búsqueda**: Encontrar proveedores y productos\n💰 **Pagos**: Métodos de pago disponibles\n📦 **Ventas**: Cómo publicar productos\n📋 **Cotizaciones**: Solicitar y responder RFQ\n🗺️ **Mapa**: Proveedores por departamento\n💱 **Divisas**: Tasas de cambio\n💡 **Tips**: Recomendaciones para MIPYMES\n\n¿Qué necesitas específicamente?'
  }

  return { message: response, model: 'Asistente Local' }
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (userId) await setAuthCookie(userId)

    const body: AIRequestBody = await request.json()
    const { message, model = 'zai', conversationHistory = [], context } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Mensaje requerido' }, { status: 400 })
    }

    // Trim conversation history to last 20 messages for token management
    const trimmedHistory = conversationHistory.slice(-20)

    // If model is explicitly 'fallback', skip LLM entirely
    if (model === 'fallback') {
      const fallback = getFallbackResponse(message, userId)
      return NextResponse.json({ success: true, data: fallback })
    }

    // Try using z-ai-web-dev-sdk LLM with timeout
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const authContext = userId
        ? '- El usuario está autenticado en la plataforma'
        : '- El usuario no ha iniciado sesión'

      const userContext = context ? `\n- Contexto adicional del usuario: ${context}` : ''

      // Build messages array with conversation history
      const messages = [
        { role: 'assistant' as const, content: PRO_NICARAGUA_SYSTEM_PROMPT + '\n' + authContext + userContext },
        // Include conversation history for multi-turn context
        ...trimmedHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user' as const, content: message },
      ]

      const completionPromise = zai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' },
      })

      // 10-second timeout to prevent server crashes from hung outbound HTTP
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM timeout')), 10000)
      )

      const completion = await Promise.race([completionPromise, timeoutPromise])

      const responseText = completion?.choices?.[0]?.message?.content

      if (!responseText) {
        throw new Error('Empty LLM response')
      }

      return NextResponse.json({
        success: true,
        data: {
          message: responseText,
          model: 'Z.ai LLM',
        },
      })
    } catch (llmError) {
      // LLM failed or timed out — use local fallback (no outbound HTTP)
      const errMsg = llmError instanceof Error ? llmError.message : String(llmError)
      console.error('LLM error, using fallback:', errMsg)
      const fallback = getFallbackResponse(message, userId)
      return NextResponse.json({
        success: true,
        data: {
          ...fallback,
          model: `Asistente Local (LLM: ${errMsg.includes('timeout') ? 'tiempo agotado' : 'no disponible'})`,
        },
      })
    }
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({
      success: true,
      data: {
        message: 'Lo siento, hubo un error temporal. Por favor intenta de nuevo en unos momentos. 🙏',
        model: 'Sistema (Recuperación)',
      },
    })
  }
}
