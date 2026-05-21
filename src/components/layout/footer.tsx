"use client"

import { useAppStore } from "@/store/app-store"
import { Heart, MapPin, Phone, Mail } from "lucide-react"

export function Footer() {
  const { navigate } = useAppStore()

  return (
    <footer className="mt-auto border-t bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">PC</span>
              </div>
              <span className="font-bold text-primary font-[family-name:var(--font-poppins)]">
                ProveedorConecta
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Conectando emprendedores y MIPYMES con proveedores en toda Nicaragua.
            </p>
          </div>

          {/* Marketplace */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Marketplace</h4>
            <div className="space-y-2">
              <button onClick={() => navigate("home")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Explorar Productos
              </button>
              <button onClick={() => navigate("map")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Mapa de Proveedores
              </button>
              <button onClick={() => navigate("cotizaciones")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Solicitar Cotización
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
              <button onClick={() => navigate("register")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Registrarse
              </button>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Contacto</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Managua, Nicaragua
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> +505 8888-8888
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> info@proveedorconecta.ni
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Legal</h4>
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
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ProveedorConecta Nicaragua. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Hecho con <Heart className="h-3 w-3 text-volcan fill-volcan" /> en Nicaragua 🇳🇮
          </p>
        </div>
      </div>
    </footer>
  )
}
