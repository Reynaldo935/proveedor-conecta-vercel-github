"use client"

import { motion } from "framer-motion"
import {
  Shield,
  MapPin,
  Banknote,
  Percent,
  Star,
  Calendar,
  CloudSun,
  MessageCircle,
  Gift,
  Megaphone,
  Handshake,
  BarChart3,
  FileText,
  Lock,
  TrendingUp,
  Users,
  Heart,
  CheckCircle2,
  XCircle,
  Globe,
  Zap,
} from "lucide-react"

// ─── Differentiation Data ──────────────────────────────────────────────────

const DIFFERENTIATORS = [
  {
    feature: "Enfoque geográfico",
    pc: "Exclusivo para Nicaragua (17 departamentos)",
    others: "Global, sin enfoque local",
    icon: MapPin,
  },
  {
    feature: "Proveedores locales verificados",
    pc: "✅ Ingenio San Antonio, Flor de Caña, Casa Pellas, etc.",
    others: "❌ No incluyen proveedores nicaragüenses reales",
    icon: Shield,
  },
  {
    feature: "Pagos en Córdobas (NIO)",
    pc: "✅ Transferencias Banpro, BAC, LAFISE, billetera móvil",
    others: "❌ Solo tarjetas internacionales / efectivo",
    icon: Banknote,
  },
  {
    feature: "Comisión automática del 3%",
    pc: "✅ Split automático con Stripe Connect",
    others: "❌ Comisiones altas y ocultas",
    icon: Percent,
  },
  {
    feature: "Reseñas bidireccionales",
    pc: "✅ Comprador califica al vendedor Y viceversa",
    others: "❌ Solo reseñas unidireccionales",
    icon: Star,
  },
  {
    feature: "Calendario de feriados nicaragüenses",
    pc: "✅ 13 feriados nacionales integrados",
    others: "❌ No aplica",
    icon: Calendar,
  },
  {
    feature: "Clima en tiempo real (17 departamentos)",
    pc: "✅ Open-Meteo integrado",
    others: "❌ No aplica",
    icon: CloudSun,
  },
  {
    feature: "Chat multimedia",
    pc: "✅ Texto, audio, video, imágenes, archivos",
    others: "❌ Limitado o solo texto",
    icon: MessageCircle,
  },
  {
    feature: "Sistema de lealtad",
    pc: "✅ Puntos por compra, redención automática",
    others: "❌ No existe / genérico",
    icon: Gift,
  },
  {
    feature: "Anuncios pagados / Sin anuncios",
    pc: "✅ Modelo YouTube (pagar por promocionar o por no ver anuncios)",
    others: "❌ Solo anuncios masivos",
    icon: Megaphone,
  },
  {
    feature: "Conexión directa con MIPYMES",
    pc: "✅ Fortalece encadenamientos productivos locales",
    others: "❌ Enfoque en grandes marcas / consumidor final",
    icon: Handshake,
  },
  {
    feature: "Dashboard por vendedor",
    pc: "✅ Ventas por día/mes, productos más vendidos, gráficos",
    others: "❌ Solo para vendedores profesionales / no existe",
    icon: BarChart3,
  },
  {
    feature: "Cotizaciones (RFQ)",
    pc: "✅ Comprador solicita cotización a múltiples proveedores",
    others: "❌ No disponible para pequeños",
    icon: FileText,
  },
  {
    feature: "Panel de administración exclusivo",
    pc: "✅ Solo accesible por el creador (rey7214935@gmail.com)",
    others: "❌ No aplica",
    icon: Lock,
  },
]

const WHY_NOT_COMPETE = [
  {
    title: "Amazon / Alibaba / Temu",
    description:
      "Están diseñados para consumidores finales y grandes marcas. No incluyen proveedores de materia prima nicaragüenses, no aceptan transferencias bancarias locales, y no permiten que un pequeño productor de Masaya publique sus productos con precios en córdobas.",
    icon: Globe,
    color: "from-orange-500 to-amber-500",
  },
  {
    title: "Facebook Marketplace",
    description:
      "Es genérico, no tiene pasarela de pagos integrada, no verifica proveedores, no ofrece chat multimedia avanzado, y no tiene un sistema de reseñas bidireccionales. Cualquiera publica, pero no hay confianza.",
    icon: Users,
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "ProveedorConecta Nicaragua",
    description:
      "Es la única plataforma que conecta a los emprendedores nicaragüenses con proveedores reales del país, usando métodos de pago locales, con verificación de identidad, reseñas en ambas direcciones, y herramientas como el clima, el calendario de feriados, y el sistema de lealtad. Está diseñada para Nicaragua, por nicaragüenses.",
    icon: Zap,
    color: "from-[#D2B48C] to-[#4A90E2] dark:from-[#D4A017] dark:to-[#4A90E2]",
    highlight: true,
  },
]

const SOCIAL_IMPACT = [
  {
    title: "Fortalece los encadenamientos productivos",
    description:
      "Un artesano de Masaya puede encontrar materia prima en Chinandega sin intermediarios.",
    icon: TrendingUp,
  },
  {
    title: "Reduce costos de búsqueda",
    description:
      "Ya no dependes de referencias informales o grupos de WhatsApp.",
    icon: Search,
  },
  {
    title: "Impulsa a las MIPYMES",
    description:
      "Las pequeñas empresas pueden competir con grandes proveedores al tener visibilidad en la plataforma.",
    icon: Users,
  },
  {
    title: "Genera confianza",
    description:
      "Las reseñas bidireccionales y la verificación de proveedores crean un ecosistema seguro.",
    icon: Heart,
  },
]

// ─── Component ────────────────────────────────────────────────────────────

export function WhyUsSection() {
  const staggerContainer = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  }

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
      {/* ─── Hero Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D2B48C]/10 dark:bg-[#D4A017]/10 border border-[#D2B48C]/30 dark:border-[#D4A017]/30 mb-4">
          <Zap className="h-4 w-4 text-[#D2B48C] dark:text-[#D4A017]" />
          <span className="text-xs font-semibold text-[#D2B48C] dark:text-[#D4A017] uppercase tracking-wider">
            Hackathon Nicaragua 2026 — 10ª Edición
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-poppins)] text-[#607D8B] dark:text-[#D5DDE5] mb-4">
          ¿Qué hace{" "}
          <span className="text-[#4A90E2] dark:text-[#D4A017]">única</span>{" "}
          a ProveedorConecta?
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          No somos otro marketplace genérico. Somos la única plataforma diseñada{" "}
          <strong className="text-[#607D8B] dark:text-[#D5DDE5]">para Nicaragua, por nicaragüenses</strong>,
          conectando emprendedores con proveedores reales usando métodos de pago locales.
        </p>
      </motion.div>

      {/* ─── Differentiation Table ─── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="space-y-4"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-[#4A90E2] dark:text-[#D4A017]">
            Comparativa de Plataformas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            ProveedorConecta vs. Amazon, Alibaba, Temu y Facebook Marketplace
          </p>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-3 gap-3 px-4 py-3 bg-[#4A90E2]/10 dark:bg-[#4A90E2]/20 rounded-xl text-sm font-semibold">
          <div className="text-[#4A90E2]">Diferenciador</div>
          <div className="text-[#27AE60] flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> ProveedorConecta
          </div>
          <div className="text-[#E74C3C] flex items-center gap-1.5">
            <XCircle className="h-4 w-4" /> Amazon / Alibaba / Temu / Facebook
          </div>
        </div>

        {/* Table Rows */}
        <div className="space-y-2">
          {DIFFERENTIATORS.map((item) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.feature}
                variants={staggerItem}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-card border hover:border-[#D2B48C]/50 dark:hover:border-[#D4A017]/50 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-2.5 text-sm font-medium text-[#607D8B] dark:text-[#D5DDE5]">
                  <div className="w-8 h-8 rounded-lg bg-[#4A90E2]/10 dark:bg-[#4A90E2]/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-[#4A90E2]" />
                  </div>
                  <span>{item.feature}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#27AE60] flex-shrink-0 mt-0.5" />
                  <span className="text-[#607D8B] dark:text-[#D5DDE5] leading-relaxed">{item.pc}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-[#E74C3C] flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-relaxed">{item.others}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ─── Why Not Compete Section ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-[#607D8B] dark:text-[#D5DDE5] mb-2">
            ¿Por qué no compite con los gigantes?
          </h2>
          <p className="text-sm text-muted-foreground">
            Cada plataforma tiene su propósito. La nuestra es conectar Nicaragua.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WHY_NOT_COMPETE.map((item) => (
            <div
              key={item.title}
              className={`relative rounded-2xl border p-6 ${
                item.highlight
                  ? "border-[#D2B48C] dark:border-[#D4A017] bg-gradient-to-br from-[#D2B48C]/5 to-[#4A90E2]/5 dark:from-[#D4A017]/10 dark:to-[#4A90E2]/10 shadow-lg"
                  : "border-border bg-card hover:shadow-md"
              } transition-all duration-300`}
            >
              {item.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-[#D2B48C] dark:bg-[#D4A017] text-white text-xs font-bold">
                    🏆 Nuestra Solución
                  </span>
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 mt-2`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#607D8B] dark:text-[#D5DDE5] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Social Impact ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E74C3C]/10 border border-[#E74C3C]/20 mb-4">
            <Heart className="h-4 w-4 text-[#E74C3C]" />
            <span className="text-xs font-semibold text-[#E74C3C] uppercase tracking-wider">
              Impacto Social
            </span>
          </div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-[#4A90E2] dark:text-[#D4A017]">
            El Impacto Social Real
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SOCIAL_IMPACT.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="flex gap-4 p-5 rounded-xl bg-card border hover:border-[#D2B48C]/50 dark:hover:border-[#D4A017]/50 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-[#4A90E2]/10 dark:bg-[#4A90E2]/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-[#4A90E2]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#607D8B] dark:text-[#D5DDE5] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ─── Pitch Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative p-8 md:p-12 rounded-2xl bg-gradient-to-br from-[#4A90E2]/10 to-[#D2B48C]/10 dark:from-[#4A90E2]/20 dark:to-[#D4A017]/20 border border-[#D2B48C]/30 dark:border-[#D4A017]/30 text-center"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D2B48C] to-[#4A90E2] dark:from-[#D4A017] dark:to-[#4A90E2] flex items-center justify-center shadow-xl">
            <Zap className="h-7 w-7 text-white" />
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-poppins)] text-[#4A90E2] dark:text-[#D4A017] mb-2">
            🏆 Para el Hackathon: Esto es lo que debes decir
          </h2>
        </div>
        <blockquote className="text-sm md:text-base text-[#607D8B] dark:text-[#D5DDE5] leading-relaxed italic max-w-3xl mx-auto">
          &ldquo;ProveedorConecta Nicaragua no es otro marketplace genérico. Es la{" "}
          <strong>única plataforma</strong> que conecta a los emprendedores nicaragüenses
          con proveedores reales del país, usando métodos de pago locales, con
          verificación de identidad, reseñas bidireccionales, y herramientas integradas
          como el clima en tiempo real y el calendario de feriados nacionales. No
          competimos con Amazon o Facebook; resolvemos un problema que ellos ignoran:
          el acceso a proveedores confiables para las MIPYMES nicaragüenses.&rdquo;
        </blockquote>
        <p className="text-xs text-muted-foreground mt-4">
          — Equipo ProveedorConecta Nicaragua, Hackathon 2026
        </p>
      </motion.div>
    </div>
  )
}
