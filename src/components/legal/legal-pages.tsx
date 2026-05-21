"use client"

import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, FileText, Shield, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"

function LegalPageLayout({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  const { navigate } = useAppStore()
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("home")}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Volver al Inicio
      </Button>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">{title}</h1>
      </div>
      <Card>
        <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
          {children}
        </CardContent>
      </Card>
      <p className="text-xs text-center text-muted-foreground pb-4">
        Última actualización: {new Date().toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </motion.div>
  )
}

export function TermsPage() {
  return (
    <LegalPageLayout title="Términos de Servicio" icon={FileText}>
      <h2>1. Aceptación de los Términos</h2>
      <p>Al acceder y utilizar ProveedorConecta Nicaragua, usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguno de estos términos, no utilice la plataforma.</p>

      <h2>2. Descripción del Servicio</h2>
      <p>ProveedorConecta es un marketplace B2B/B2C que conecta a emprendedores y MIPYMES con proveedores de insumos, materia prima, servicios y equipos productivos en Nicaragua.</p>

      <h2>3. Registro de Cuenta</h2>
      <p>Para utilizar ciertas funciones, debe registrarse proporcionando información veraz y completa. Usted es responsable de mantener la confidencialidad de su cuenta. Los campos requeridos incluyen: nombre completo, correo electrónico, teléfono, departamento y dirección.</p>

      <h2>4. Comisión de Plataforma</h2>
      <p>ProveedorConecta cobra una comisión del 3% sobre cada transacción completada. Esta comisión se destina al mantenimiento y mejora de la plataforma. El 97% restante se transfiere al vendedor.</p>

      <h2>5. Publicación de Productos</h2>
      <p>Los vendedores pueden publicar productos con información precisa incluyendo precios, descripciones e imágenes. Los productos prohibidos incluyen: armas, sustancias ilegales, productos falsificados, y cualquier artículo que viole las leyes nicaragüenses.</p>

      <h2>6. Sistema de Anuncios</h2>
      <p>Los vendedores pueden contratar servicios de publicidad con los siguientes planes: Publicación Semanal ($5 USD), Publicación Mensual ($15 USD), Retiro Semanal ($3 USD), Retiro Mensual ($8 USD). Todos los anuncios requieren aprobación del administrador.</p>

      <h2>7. Métodos de Pago</h2>
      <p>Aceptamos los siguientes métodos de pago: PixelPay, Pagadito, PayPal, Google Pay, Banpro (Transferencia y Billetera), BAC Credomatic, LAFISE, Kash, Billetera Móvil, y Western Union. Cada método tiene sus propios términos de procesamiento.</p>

      <h2>8. Responsabilidad</h2>
      <p>ProveedorConecta actúa como intermediario y no es responsable por la calidad de los productos o servicios ofrecidos por los vendedores. Las disputas entre compradores y vendedores deben resolverse directamente entre las partes.</p>

      <h2>9. Modificaciones</h2>
      <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios significativos serán notificados a los usuarios registrados.</p>

      <h2>10. Ley Aplicable</h2>
      <p>Estos términos se rigen por las leyes de la República de Nicaragua. Cualquier disputa será resuelta por los tribunales competentes de Managua, Nicaragua.</p>
    </LegalPageLayout>
  )
}

export function PrivacyPage() {
  return (
    <LegalPageLayout title="Política de Privacidad" icon={Shield}>
      <h2>1. Información que Recopilamos</h2>
      <p>Recopilamos la siguiente información: nombre completo, correo electrónico, número de teléfono, departamento, dirección, información de pago (encriptada), y datos de uso de la plataforma.</p>

      <h2>2. Uso de la Información</h2>
      <p>Utilizamos su información para: proporcionar nuestros servicios, procesar transacciones, enviar notificaciones relevantes, mejorar la plataforma, y cumplir con obligaciones legales.</p>

      <h2>3. Protección de Datos</h2>
      <p>Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales. La información de pago se almacena de forma encriptada. Utilizamos validación HMAC-SHA256 para webhooks de comisiones.</p>

      <h2>4. Compartir Información</h2>
      <p>No vendemos su información personal. Compartimos datos solo con: procesadores de pago (para completar transacciones), autoridades legales (cuando sea requerido por ley), y socios de servicio (bajo acuerdos de confidencialidad).</p>

      <h2>5. Cookies y Datos de Navegación</h2>
      <p>Utilizamos cookies esenciales para el funcionamiento de la plataforma, cookies de preferencias (tema claro/oscuro), y cookies de sesión para autenticación.</p>

      <h2>6. Sus Derechos</h2>
      <p>Usted tiene derecho a: acceder a sus datos personales, solicitar la corrección de datos inexactos, solicitar la eliminación de sus datos, y oponerse al procesamiento de sus datos.</p>

      <h2>7. Retención de Datos</h2>
      <p>Conservamos sus datos mientras su cuenta esté activa y durante un período adicional de 2 años para fines legales y de auditoría. Los datos de transacciones se conservan durante 5 años según requerimientos fiscales.</p>

      <h2>8. Contacto</h2>
      <p>Para consultas sobre privacidad, contacte a: info@proveedorconecta.ni</p>
    </LegalPageLayout>
  )
}

export function RefundPage() {
  return (
    <LegalPageLayout title="Política de Reembolso y Cancelación" icon={RotateCcw}>
      <h2>1. Derecho de Cancelación</h2>
      <p>Los compradores pueden cancelar una orden dentro de las 24 horas siguientes a la compra si el vendedor aún no ha procesado el envío. Pasado este período, la cancelación queda a discreción del vendedor.</p>

      <h2>2. Proceso de Reembolso</h2>
      <p>Los reembolsos se procesan de la siguiente manera:</p>
      <ul>
        <li><strong>PayPal / PixelPay / Pagadito:</strong> 5-10 días hábiles tras la aprobación</li>
        <li><strong>Tarjetas (BAC, LAFISE):</strong> 10-15 días hábiles tras la aprobación</li>
        <li><strong>Transferencias bancarias:</strong> 3-5 días hábiles tras la aprobación</li>
        <li><strong>Western Union:</strong> Requiere recolección presencial con referencia MTCN</li>
        <li><strong>Billetera Móvil / Kash / Banpro Billetera:</strong> 1-3 días hábiles</li>
      </ul>

      <h2>3. Comisión de Plataforma</h2>
      <p>En caso de reembolso completo, la comisión del 3% también será devuelta. En reembolsos parciales, la comisión se calcula proporcionalmente al monto reembolsado.</p>

      <h2>4. Productos Defectuosos</h2>
      <p>Si el producto recibido está defectuoso o no coincide con la descripción, el comprador tiene 48 horas desde la recepción para reportarlo. Se debe proporcionar evidencia fotográfica. El vendedor debe responder en 72 horas.</p>

      <h2>5. Disputas</h2>
      <p>Las disputas no resueltas entre comprador y vendedor pueden ser escaladas al equipo de soporte de ProveedorConecta. Nuestro equipo actuará como mediador imparcial.</p>

      <h2>6. Anuncios Publicitarios</h2>
      <p>Los pagos por anuncios publicitarios no son reembolsables una vez que el anuncio ha sido aprobado y activado. Los anuncios pendientes de aprobación pueden ser cancelados con reembolso completo.</p>

      <h2>7. Contacto</h2>
      <p>Para solicitar un reembolso o cancelación, contacte a: soporte@proveedorconecta.ni o a través del chat de la plataforma.</p>
    </LegalPageLayout>
  )
}
