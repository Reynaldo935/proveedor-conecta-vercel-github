"use client"

import { useEffect, useState, useSyncExternalStore, useCallback } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { useCartStore } from "@/store/cart-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Heart, MapPin, Search, Star, Store, Package, ShoppingCart,
  Menu, Sun, Moon, MessageCircle, User, ChevronDown, Home,
  Bell, LogOut, Shield, FileText, CreditCard,
  Settings, Plus, Compass, LayoutDashboard, X, Cloud, Droplets, Thermometer,
  Download, HardDriveDownload, BarChart3, Calendar, Gift, MoreHorizontal, ExternalLink, Globe, ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { WeatherWidget } from "@/components/weather/weather-widget"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CartDrawer, CartIconButton } from "@/components/marketplace/cart-drawer"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

// ─── Hydration-safe "mounted" flag ────────────────────────────────────────────
const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Product type ─────────────────────────────────────────────────────────────
interface Product {
  id: string
  title: string
  description: string
  price: number
  discountPrice: number | null
  discountPercent: number | null
  category: string
  images: string[]
  tags: string
  quantity: number
  likeCount: number
  seller: {
    id: string
    name: string
    avatar: string
    address: string
    businessProfile?: { businessName: string; logo: string } | null
  }
}

// ─── Category icons ───────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  "Construcción y Ferretería": "🏗️",
  "Agricultura y Ganadería": "🌾",
  "Tecnología y Electrónica": "💻",
  "Alimentos y Bebidas": "🍽️",
  "Textil y Calzado": "👕",
  "Salud y Farmacia": "💊",
  "Hogar y Muebles": "🏠",
  "Educación y Oficina": "📚",
  "Transporte y Logística": "🚛",
  "Transporte y Vehículos": "🚗",
  "Servicios Profesionales": "🤝",
  "Otros": "📦",
}

// ─── Simple inline Header (replaces 780-line component) ──────────────────────
function SimpleHeader() {
  const { navigate } = useAppStore()
  const { isAuthenticated, user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const mounted = useMounted()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => navigate("home")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">PC</span>
            </div>
            <span className="font-bold text-primary text-lg hidden sm:block">ProveedorConecta</span>
          </button>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    useAppStore.getState().setSearchQuery(searchQuery)
                    navigate("search")
                  }
                }}
              />
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { icon: Home, label: "Inicio", view: "home" },
              { icon: Compass, label: "Mercado", view: "featured" },
              { icon: Store, label: "Proveedores", view: "suppliers" },
              { icon: MapPin, label: "Mapa", view: "map" },
              { icon: FileText, label: "Cotizar", view: "cotizaciones" },
              { icon: ExternalLink, label: "Catálogos", view: "supplier-catalogs" },
              { icon: MessageCircle, label: "Chat", view: "chat" },
            ].map(({ icon: Icon, label, view }) => (
              <Button
                key={view}
                variant="ghost"
                size="sm"
                onClick={() => navigate(view as Parameters<typeof navigate>[0])}
                className="gap-1.5"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}

            {/* More menu dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="text-xs">Más</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Herramientas</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("suppliers")} className="gap-2 cursor-pointer">
                  <Store className="h-4 w-4" /> Proveedores NI
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("surveys")} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" /> Encuestas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("audit")} className="gap-2 cursor-pointer">
                  <Shield className="h-4 w-4" /> Auditoría
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("downloads")} className="gap-2 cursor-pointer">
                  <Download className="h-4 w-4" /> Descargas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("backup")} className="gap-2 cursor-pointer">
                  <HardDriveDownload className="h-4 w-4" /> Backup
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Negocio</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("vendor-dashboard")} className="gap-2 cursor-pointer">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard Ventas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("my-products")} className="gap-2 cursor-pointer">
                  <Package className="h-4 w-4" /> Mis Productos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("payments")} className="gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" /> Pagos y Comisión 3%
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("sell-product")} className="gap-2 cursor-pointer">
                  <Plus className="h-4 w-4" /> Vender Producto
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Cuenta</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("loyalty")} className="gap-2 cursor-pointer">
                  <Gift className="h-4 w-4" /> Lealtad
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("calendar")} className="gap-2 cursor-pointer">
                  <Calendar className="h-4 w-4" /> Calendario
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("reviews")} className="gap-2 cursor-pointer">
                  <BarChart3 className="h-4 w-4" /> Reseñas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("currencies")} className="gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" /> Monedas
                </DropdownMenuItem>
                {isAuthenticated && user?.role === "ADMIN" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("admin")} className="gap-2 cursor-pointer">
                      <Shield className="h-4 w-4" /> Panel Admin
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            {mounted && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("profile")} className="gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="text-xs max-w-[80px] truncate">{user?.name}</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("login")}>
                  Iniciar sesión
                </Button>
                <Button size="sm" onClick={() => navigate("register")}>
                  Registrarse
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-3 space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      useAppStore.getState().setSearchQuery(searchQuery)
                      navigate("search")
                      setMobileMenuOpen(false)
                    }
                  }}
                />
              </div>
            </div>
            {[
              { icon: Home, label: "Inicio", view: "home" },
              { icon: Compass, label: "Explorar", view: "featured" },
              { icon: Store, label: "Proveedores NI", view: "suppliers" },
              { icon: MapPin, label: "Mapa GPS", view: "map" },
              { icon: FileText, label: "Cotizaciones", view: "cotizaciones" },
              { icon: MessageCircle, label: "Chat", view: "chat" },
              { icon: ShoppingCart, label: "Compras", view: "checkout" },
              { icon: CreditCard, label: "Pagos", view: "payments" },
              { icon: LayoutDashboard, label: "Dashboard", view: "vendor-dashboard" },
              { icon: Package, label: "Mis Productos", view: "my-products" },
              { icon: Bell, label: "Notificaciones", view: "notifications" },
              { icon: Settings, label: "Ajustes", view: "settings" },
              { icon: Shield, label: "Auditoría", view: "audit" },
              { icon: FileText, label: "Encuestas", view: "surveys" },
              { icon: Download, label: "Descargas", view: "downloads" },
              { icon: HardDriveDownload, label: "Backup", view: "backup" },
            ].map(({ icon: Icon, label, view }) => (
              <button
                key={view}
                onClick={() => { navigate(view as Parameters<typeof navigate>[0]); setMobileMenuOpen(false) }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-accent rounded-lg transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </button>
            ))}
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => { navigate("profile"); setMobileMenuOpen(false) }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-accent rounded-lg transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Perfil
                </button>
                {user?.role === "ADMIN" && (
                  <button
                    onClick={() => { navigate("admin"); setMobileMenuOpen(false) }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-accent rounded-lg transition-colors"
                  >
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Panel Admin
                  </button>
                )}
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false) }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-accent rounded-lg transition-colors text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-3 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { navigate("login"); setMobileMenuOpen(false) }}>
                  Iniciar sesión
                </Button>
                <Button size="sm" className="flex-1" onClick={() => { navigate("register"); setMobileMenuOpen(false) }}>
                  Registrarse
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

// ─── Simple inline Footer ────────────────────────────────────────────────────
function SimpleFooter() {
  const { navigate } = useAppStore()
  const year = useSyncExternalStore(emptySubscribe, () => new Date().getFullYear(), () => 2026)

  return (
    <footer className="mt-auto border-t bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">PC</span>
              </div>
              <span className="font-bold text-primary">ProveedorConecta</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Conectando emprendedores y MIPYMES con proveedores de insumos, materia prima, servicios y equipos productivos en toda Nicaragua.
            </p>
          </div>

          {/* Marketplace */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Marketplace</h4>
            <div className="space-y-2">
              <button onClick={() => navigate("home")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Explorar</button>
              <button onClick={() => navigate("featured")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Destacados</button>
              <button onClick={() => navigate("search")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Buscar</button>
              <button onClick={() => navigate("suppliers")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Proveedores NI</button>
            </div>
          </div>

          {/* Herramientas */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Herramientas</h4>
            <div className="space-y-2">
              <button onClick={() => navigate("map")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Mapa GPS</button>
              <button onClick={() => navigate("cotizaciones")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Cotizaciones</button>
              <button onClick={() => navigate("surveys")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Encuestas</button>
              <button onClick={() => navigate("chat")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Chat</button>
              <button onClick={() => navigate("audit")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Auditoría</button>
              <button onClick={() => navigate("downloads")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Descargas</button>
              <button onClick={() => navigate("backup")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Backup</button>
            </div>
          </div>

          {/* Negocio */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Negocio</h4>
            <div className="space-y-2">
              <button onClick={() => navigate("vendor-dashboard")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Dashboard Ventas</button>
              <button onClick={() => navigate("my-products")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Mis Productos</button>
              <button onClick={() => navigate("payments")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Pagos (3% comisión)</button>
              <button onClick={() => navigate("loyalty")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Lealtad</button>
              <button onClick={() => navigate("calendar")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Calendario</button>
              <button onClick={() => navigate("reviews")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Reseñas</button>
            </div>
          </div>

          {/* Cuenta */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Cuenta</h4>
            <div className="space-y-2">
              <button onClick={() => navigate("login")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Iniciar sesión</button>
              <button onClick={() => navigate("profile")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Perfil</button>
              <button onClick={() => navigate("admin")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Admin</button>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Legal</h4>
            <div className="space-y-2">
              <button onClick={() => navigate("terms")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Términos</button>
              <button onClick={() => navigate("privacy")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Privacidad</button>
              <button onClick={() => navigate("refund")} className="block text-sm text-muted-foreground hover:text-primary transition-colors">Reembolsos</button>
            </div>
          </div>
        </div>

        <div className="border-t mt-6 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {year} ProveedorConecta Nicaragua. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const { navigate } = useAppStore()
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const isInCart = cartItems.some(i => i.productId === product.id)
  const [added, setAdded] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      discountPrice: product.discountPrice,
      image: product.images?.[0] || '',
      sellerName: product.seller?.businessProfile?.businessName || product.seller?.name || 'Vendedor',
      maxQuantity: product.quantity,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(price)

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => navigate("product-detail", { productId: product.id })}
    >
      {/* Product Image */}
      <div className="relative h-48 bg-muted overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 bg-muted"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const el = e.target as HTMLImageElement
              el.style.display = "none"
              // Show fallback icon
              const parent = el.parentElement
              if (parent && !parent.querySelector('.fallback-icon')) {
                const fallback = document.createElement('div')
                fallback.className = 'fallback-icon flex items-center justify-center h-full'
                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3"><path d="m21 16-4-4-6 6-4-4-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="9" r="2"/></svg>'
                parent.appendChild(fallback)
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {product.discountPercent && product.discountPercent > 0 && (
          <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs">
            -{product.discountPercent}%
          </Badge>
        )}
        {product.likeCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs">
            <Heart className="h-3 w-3" /> {product.likeCount}
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <Badge variant="secondary" className="text-xs">
          {CATEGORY_ICONS[product.category] || "📦"} {product.category}
        </Badge>
        <h3 className="font-semibold text-sm line-clamp-2">{product.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            {product.discountPrice ? (
              <>
                <p className="text-lg font-bold text-green-600">{formatPrice(product.discountPrice)}</p>
                <p className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</p>
              </>
            ) : (
              <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
            )}
          </div>
        </div>
        {product.seller && (
          <div className="flex items-center gap-2 pt-1 border-t">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground truncate flex-1">
              {product.seller.businessProfile?.businessName || product.seller.name}
            </span>
          </div>
        )}
        {/* Add to Cart Button */}
        <Button
          size="sm"
          variant={isInCart ? "default" : "outline"}
          className={`w-full mt-2 gap-1 text-xs h-8 ${added ? 'bg-green-600 text-white' : ''}`}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {added ? '✓ Agregado' : isInCart ? 'En el carrito' : 'Agregar al carrito'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Home Feed ────────────────────────────────────────────────────────────────
// Hardcoded fallback products — guaranteed to show even if API/DB is down
const FALLBACK_PRODUCTS: Product[] = [
  { id:"fc-1", title:"Cemento Canal 50kg", description:"Cemento de alta resistencia para construcción. Ideal para losas, columnas y cimientos.", price:380, discountPrice:360, discountPercent:5, category:"Construcción y Ferretería", tags:"cemento,construcción", images:["https://www.cemexnicaragua.com/documents/5168637/5397130/soluciones-canal-de-distribucion.jpg/e0fcee99-6db2-cb08-1bda-b9465005babe?version=1.0&t=1757870832018"], quantity:100, likeCount:42, seller:{ id:"s1", name:"Ferretería Americana", avatar:"", address:"Managua", businessProfile:{ businessName:"Ferretería Americana", logo:"" } } },
  { id:"fc-2", title:"Varilla Corrugada 1/2\" x 6m", description:"Varilla de acero corrugado grado 60. 1/2 pulgada x 6 metros.", price:245, discountPrice:null, discountPercent:null, category:"Construcción y Ferretería", tags:"varilla,hierro,construcción", images:["https://loremflickr.com/400/400/steel,metal,iron"], quantity:200, likeCount:28, seller:{ id:"s1", name:"Ferretería Americana", avatar:"", address:"Managua", businessProfile:{ businessName:"Ferretería Americana", logo:"" } } },
  { id:"fc-3", title:"Fertilizante NPK 20-20-20 50kg", description:"Fertilizante balanceado. Alto rendimiento para todo tipo de cultivos.", price:1200, discountPrice:1080, discountPercent:10, category:"Agricultura y Ganadería", tags:"fertilizante,agrícola", images:["https://loremflickr.com/400/400/fertilizer,garden"], quantity:60, likeCount:35, seller:{ id:"s2", name:"Agroserv Nicaragua", avatar:"", address:"León", businessProfile:{ businessName:"Agroserv Nicaragua", logo:"" } } },
  { id:"fc-4", title:"Laptop Dell Inspiron 15 i5 12GB", description:"Laptop Dell Inspiron 15.6\", Intel Core i5, 12GB RAM, 512GB SSD. Windows 11 Pro.", price:18500, discountPrice:16999, discountPercent:8, category:"Tecnología y Electrónica", tags:"laptop,dell,tecnología", images:["https://loremflickr.com/400/400/laptop,computer"], quantity:15, likeCount:67, seller:{ id:"s3", name:"Tech Nicaragua", avatar:"", address:"Managua", businessProfile:{ businessName:"Tech Nicaragua", logo:"" } } },
  { id:"fc-5", title:"Ron Flor de Caña 7 Años 750ml", description:"Ron premium añejado 7 años. Sin azúcar añadida. Destilado 5 veces.", price:680, discountPrice:null, discountPercent:null, category:"Alimentos y Bebidas", tags:"ron,flor de caña,premium", images:["https://loremflickr.com/400/400/rum,bottle"], quantity:500, likeCount:91, seller:{ id:"s4", name:"Ingenio San Antonio", avatar:"", address:"Chichigalpa, Chinandega", businessProfile:{ businessName:"Ingenio San Antonio", logo:"" } } },
  { id:"fc-6", title:"Panel Solar 450W Monocristalino", description:"Panel solar monocristalino 450W. Alta eficiencia 21.5%. 25 años de garantía.", price:8500, discountPrice:7999, discountPercent:6, category:"Energía y Combustible", tags:"panel,solar,energía,renovable", images:["https://loremflickr.com/400/400/solar,panel"], quantity:30, likeCount:53, seller:{ id:"s5", name:"Energía Solar Nica", avatar:"", address:"Managua", businessProfile:{ businessName:"Energía Solar Nica", logo:"" } } },
  { id:"fc-7", title:"Café Prestó Instantáneo 200g", description:"Café soluble instantáneo. Sabor tradicional nicaragüense. Rinde 100 tazas.", price:145, discountPrice:null, discountPercent:null, category:"Alimentos y Bebidas", tags:"café,prestó,instantáneo", images:["https://loremflickr.com/400/400/coffee,beans,instant"], quantity:300, likeCount:78, seller:{ id:"s6", name:"Café Prestó", avatar:"", address:"Managua", businessProfile:{ businessName:"Café Soluble S.A.", logo:"" } } },
  { id:"fc-8", title:"Aceite Vegetal Cukra 1 Galón", description:"Aceite vegetal 100% soya. Ideal para cocina diaria. Envase de 1 galón.", price:240, discountPrice:220, discountPercent:8, category:"Alimentos y Bebidas", tags:"aceite,cukra,cocina", images:["https://loremflickr.com/400/400/oil,cooking"], quantity:800, likeCount:45, seller:{ id:"s7", name:"Cukra Industrial", avatar:"", address:"Managua", businessProfile:{ businessName:"Cukra Industrial S.A.", logo:"" } } },
]

function HomeFeed() {
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS)
  const { navigate } = useAppStore()
  const mounted = useMounted()

  // Load products from API, fall back to hardcoded
  useEffect(() => {
    fetch("/api/products?limit=50")
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const parsed = data.data.map((p: any) => ({
            ...p,
            images: Array.isArray(p.images) ? p.images : (() => { try { return JSON.parse(p.images || '[]') } catch { return [] } })(),
          }))
          setProducts(parsed)
        }
      })
      .catch(() => {}) // Keep fallback products
  }, [])

  // Filter by search query
  const filtered = searchQuery.trim()
    ? products.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products

  return (
    <div className="space-y-8">
      {/* ── Hero Section with Gradient ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A5276] via-[#1B3A5C] to-[#0B1A2C] dark:from-[#0B1A2C] dark:via-[#1A1A2E] dark:to-[#16213E] text-white p-8 sm:p-12 shadow-2xl">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8A817]/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2E86C1]/20 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-[#F4D03F]/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur text-sm border border-white/20 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            Marketplace B2B/B2C nicaragüense 🇳🇮
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-[family-name:var(--font-poppins)]">
            ProveedorConecta <span className="text-[#E8A817]">Nicaragua</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Conectando emprendedores y MIPYMES con proveedores de insumos, materia prima, servicios y equipos productivos en toda Nicaragua.
          </p>
          
          {/* Hero Search */}
          <div className="flex gap-2 max-w-xl mx-auto pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
              <Input
                placeholder="Buscar productos, proveedores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 bg-white/10 backdrop-blur border-white/20 text-white placeholder:text-white/50 rounded-xl text-base focus-visible:ring-[#E8A817] focus-visible:border-[#E8A817]/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    useAppStore.getState().setSearchQuery(searchQuery)
                    navigate("search")
                  }
                }}
              />
            </div>
            <Button 
              onClick={() => { useAppStore.getState().setSearchQuery(searchQuery); navigate("search") }}
              size="lg"
              className="bg-[#E8A817] hover:bg-[#D4950F] text-[#060E1A] font-bold px-6 rounded-xl shadow-lg shadow-[#E8A817]/25"
            >
              <Search className="h-5 w-5 mr-1" />
              Buscar
            </Button>
          </div>
        </div>
      </div>

      {/* ── Quick Action Buttons ── */}
      <div className="flex flex-wrap gap-2.5 justify-center">
        {[
          { label: "Marketplace", view: "home", icon: Store, color: "from-blue-600 to-blue-700" },
          { label: "Mapa GPS", view: "map", icon: MapPin, color: "from-emerald-600 to-emerald-700" },
          { label: "Cotizaciones", view: "cotizaciones", icon: FileText, color: "from-purple-600 to-purple-700" },
          { label: "Encuestas", view: "surveys", icon: Heart, color: "from-pink-600 to-pink-700" },
          { label: "Destacados", view: "featured", icon: Star, color: "from-amber-600 to-amber-700" },
          { label: "Auditoría", view: "audit", icon: Shield, color: "from-red-600 to-red-700" },
          { label: "Descargas", view: "downloads", icon: CreditCard, color: "from-teal-600 to-teal-700" },
          { label: "Backup", view: "backup", icon: Package, color: "from-indigo-600 to-indigo-700" },
        ].map(({ label, view, icon: Icon, color }) => (
          <Button
            key={view}
            size="sm"
            onClick={() => navigate(view as Parameters<typeof navigate>[0])}
            className={`gap-2 bg-gradient-to-r ${color} text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Weather Widget */}
      <div className="max-w-md mx-auto">
        <WeatherWidget />
      </div>

      {/* ── Section Title ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">🛍️ Productos Destacados</h2>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} productos disponibles</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("search")} className="gap-1">
          Ver todos <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-2xl">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No se encontraron productos</p>
          <p className="text-sm mt-1">Intenta con otra búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Dynamic View Loader (using a SEPARATE module to avoid Turbopack OOM) ────
// We load the ViewRenderer lazily — it contains all the import() paths for views.
// This way, page.tsx has ZERO import() paths for view components.
function LazyViewLoader({ viewName, isAuthenticated }: { viewName: string; isAuthenticated: boolean }) {
  const [ViewComponent, setViewComponent] = useState<React.ReactNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // For "home" view, use inline HomeFeed
    if (viewName === "home") {
      setViewComponent(<HomeFeed />)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Dynamic import of the view-renderer which handles all views
    import("@/components/view-renderer")
      .then((mod) => {
        if (cancelled) return
        // The ViewRenderer handles all view routing internally
        setViewComponent(<mod.ViewRenderer />)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error("Failed to load ViewRenderer:", err)
        setError("Error al cargar la vista. Intente recargar la página.")
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [viewName]) // Only re-load when view changes

  if (viewName === "home") {
    return <HomeFeed />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3 p-6 bg-destructive/10 rounded-xl max-w-md">
          <p className="text-destructive font-medium">Error al cargar</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando vista...</p>
        </div>
      </div>
    )
  }

  return <>{ViewComponent}</>
}

// ─── Auth initialization skeleton ─────────────────────────────────────────────
function AuthInitSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
              <div className="h-5 w-36 bg-muted animate-pulse hidden sm:block rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 bg-muted animate-pulse rounded" />
              <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6 p-4">
          <div className="h-12 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-6 w-1/2 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-48 w-full bg-muted animate-pulse rounded-xl" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <footer className="border-t bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-3 w-28 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Lazy Chatbot Loader ──────────────────────────────────────────────────────
function LazyChatbot({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [ChatbotComponent, setChatbotComponent] = useState<React.ComponentType<{ isOpen: boolean; onToggle: () => void }> | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    import("@/components/chatbot/ai-chatbot")
      .then((mod) => {
        if (!cancelled) setChatbotComponent(() => mod.AIChatbot)
      })
      .catch((err) => {
        console.error("Failed to load chatbot:", err)
        toast.error("Error al cargar el chatbot")
      })
    return () => { cancelled = true }
  }, [isOpen])

  if (!ChatbotComponent) {
    return (
      <div className="fixed bottom-24 right-6 z-50 w-80 h-96 bg-card border rounded-2xl shadow-2xl flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-muted-foreground">Cargando chatbot...</p>
        </div>
      </div>
    )
  }

  return <ChatbotComponent isOpen={isOpen} onToggle={onToggle} />
}

// ─── Main application component ──────────────────────────────────────────────
export default function ProveedorConecta() {
  const { currentView, navigate } = useAppStore()
  const { isAuthenticated, user, initAuth, isLoading } = useAuthStore()
  const [showChatbot, setShowChatbot] = useState(false)
  const mounted = useMounted()

  const isSeller = isAuthenticated && user?.role === "SELLER"

  useEffect(() => {
    initAuth()
  }, [initAuth])

  if (!mounted || isLoading) {
    return <AuthInitSkeleton />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <LazyViewLoader viewName={currentView} isAuthenticated={isAuthenticated} />
      </main>
      <Footer />

      {/* Cart Drawer — slide-out shopping cart */}
      <CartDrawer />

      {/* Chatbot — loaded dynamically on toggle */}
      {showChatbot && (
        <LazyChatbot isOpen={showChatbot} onToggle={() => setShowChatbot(false)} />
      )}

      {/* Chatbot toggle */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
        aria-label="Abrir chatbot"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Floating "Vender" button for sellers */}
      {isSeller && (
        <button
          onClick={() => navigate("sell-product")}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-semibold shadow-lg hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #1A5276, #2E86C1)" }}
          aria-label="Vender producto"
        >
          <Plus className="h-5 w-5" />
          <span>Vender</span>
        </button>
      )}
    </div>
  )
}
