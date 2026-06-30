"use client"

import { useSyncExternalStore } from "react"
import { useAppStore } from "@/store/app-store"
import { Heart, MapPin, Phone, Mail, Code } from "lucide-react"

// Hydration-safe year: returns a static value during SSR and the real year on
// the client, using useSyncExternalStore (no setState-in-effect).
const emptySubscribe = () => () => {}
function useCurrentYear() {
  return useSyncExternalStore(
    emptySubscribe,
    () => new Date().getFullYear(),
    () => 2026
  )
}

export function Footer() {
  const { navigate } = useAppStore()
  const year = useCurrentYear()

  return (
    <footer className="mt-auto border-t bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <img
                src="/uploads/logotipo.png"
                alt="ProveedorConecta"
                className="h-8 w-auto object-contain"
              />
              <span className="font-bold text-[#1B3A5C] dark:text-[#E8A817] font-[family-name:var(--font-poppins)]">
                ProveedorConecta
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Conectando emprendedores y MIPYMES con proveedores de insumos, materia prima, servicios y equipos productivos en toda Nicaragua. 17 departamentos, 5 métodos de pago, chat en tiempo real.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Code className="h-3.5 w-3.5" />
              <span>Next.js 16 · React 19 · TypeScript · Prisma · Turso · Python · Go · Java · C#</span>
            </div>
          </div>

          {/* Marketplace */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Marketplace</h4>
            <div className="space-y-2">
              <button onClick={() => navigate("home")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Explorar Productos
              </button>
              <button onClick={() => navigate("why-us")} className="block text-sm text-[#D2B48C] dark:text-[#D4A017] hover:text-[#C4A67A] dark:hover:text-[#C8920F] transition-colors font-medium">
                ¿Por qué ProveedorConecta?
              </button>
              <button onClick={() => navigate("map")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Mapa de Proveedores
              </button>
              <button onClick={() => navigate("cotizaciones")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Solicitar Cotización
              </button>
              <button onClick={() => navigate("featured")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Destacados y Ofertas
              </button>
              <button onClick={() => navigate("search")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Buscar Productos
              </button>
            </div>
          </div>

          {/* Para Vendedores */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Para Vendedores</h4>
            <div className="space-y-2">
              <button onClick={() => navigate("sell-product")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Publicar Producto
              </button>
              <button onClick={() => navigate("vendor-dashboard")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Mi Negocio
              </button>
              <button onClick={() => navigate("reviews")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Reseñas
              </button>
              <button onClick={() => navigate("create-ad")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Crear Anuncio
              </button>
              <button onClick={() => navigate("register")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Registrarse
              </button>
            </div>
          </div>

          {/* Pagos y Herramientas */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Pagos y Herramientas</h4>
            <div className="space-y-2">
              <button onClick={() => navigate("payments")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Métodos de Pago
              </button>
              <button onClick={() => navigate("currencies")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Divisas y Cambio
              </button>
              <button onClick={() => navigate("calendar")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Agenda y Citas
              </button>
              <button onClick={() => navigate("loyalty")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Puntos de Lealtad
              </button>
              <button onClick={() => navigate("downloads")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Centro de Descargas
              </button>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Legal y Contacto</h4>
            <div className="space-y-2">
              <button onClick={() => navigate("terms")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Términos de Servicio
              </button>
              <button onClick={() => navigate("privacy")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidad
              </button>
              <button onClick={() => navigate("refund")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Reembolsos y Cancelaciones
              </button>
              <div className="pt-2 space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Managua, Nicaragua
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> +505 8888-8888
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> info@proveedorconecta.ni
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EQUIPO Section */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="text-center font-semibold text-sm mb-4 text-[#4A90E2] dark:text-[#D4A017]">
            Nuestro Equipo
          </h4>
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            {[
              { name: "Reynaldo", role: "Full-Stack Developer", photo: "/equipo/Reynaldo.jpeg" },
              { name: "Apolonio", role: "Frontend Developer", photo: "/equipo/Apolonio.jpeg" },
              { name: "Sarahí", role: "Graphic Designer", photo: "/equipo/Sarahi.jpeg" },
              { name: "Pedro", role: "Communicator", photo: "/equipo/Pedro.jpeg" },
              { name: "Mychael", role: "Marketing", photo: "/equipo/Mychael.jpeg" },
            ].map((member) => (
              <div key={member.name} className="flex flex-col items-center gap-1 group">
                <div className="w-14 h-14 rounded-full border-2 border-[#D2B48C] dark:border-[#D4A017] overflow-hidden bg-muted group-hover:scale-105 transition-transform">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-[#607D8B] dark:text-[#D5DDE5]">{member.name}</span>
                <span className="text-[10px] text-muted-foreground">{member.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            © {year} ProveedorConecta Nicaragua. Todos los derechos reservados.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Hecho con <Heart className="h-3 w-3 text-[#E74C3C] fill-[#E74C3C]" /> en Nicaragua 🇳🇮
            </p>
            <span className="text-xs text-[#D2B48C] dark:text-[#D4A017] font-semibold">🏆 Hackathon Nicaragua 2026 – 10ª Edición</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
