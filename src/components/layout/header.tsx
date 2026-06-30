"use client"

import { useTheme } from "next-themes"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Sun,
  Moon,
  Search,
  ShoppingCart,
  MessageCircle,
  Bell,
  MapPin,
  Menu,
  Plus,
  User,
  LogOut,
  Package,
  LayoutDashboard,
  FileText,
  Settings,
  Home,
  CreditCard,
  Shield,
  Star,
  Download,
  DatabaseBackup,
  Wallet,
  DollarSign,
  Calendar,
  Megaphone,
  ClipboardCheck,
  Zap,
  ExternalLink,
} from "lucide-react"
import { useState, useEffect, useCallback, useSyncExternalStore } from "react"
import { TeamSectionMenu } from "@/components/creators/team-section"
import { authFetch } from "@/lib/client-auth"

// ─── Hydration-safe "mounted" flag ──────────────────────────────────────────
const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export function Header() {
  const { setTheme, resolvedTheme } = useTheme()
  const mounted = useMounted()
  const isDark = mounted && resolvedTheme === "dark"
  const { navigate, searchQuery, setSearchQuery } = useAppStore()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      authFetch("/api/notifications")
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            const unread = d.data.filter((n: { isRead: boolean }) => !n.isRead).length
            setNotifCount(unread)
          }
        })
        .catch(() => {})
    }
  }, [isAuthenticated])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate("search")
      setMenuOpen(false)
    }
  }

  const handleNav = useCallback((view: Parameters<typeof navigate>[0]) => {
    navigate(view)
    setMenuOpen(false)
  }, [navigate])

  const isAdmin = user?.role === "ADMIN"
  const isSeller = user?.role === "SELLER"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <img
              src="/uploads/logotipo.png"
              alt="ProveedorConecta Nicaragua"
              className="h-9 w-auto object-contain"
            />
            <span className="hidden sm:block font-bold text-lg font-[family-name:var(--font-poppins)] text-foreground dark:text-[#E8A817]">
              ProveedorConecta
            </span>
          </button>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos, proveedores..."
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </form>

          {/* ─── Right side controls ─── */}
          <div className="flex items-center gap-1">
            {/* Quick Chat button */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNav("chat-list")}
                className="relative h-9 w-9"
                title="Chats"
              >
                <MessageCircle className="h-5 w-5" />
                {notifCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] bg-[#E74C3C] text-white border-2 border-card">
                    {notifCount > 9 ? "9+" : notifCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="h-9 w-9"
              title={isDark ? "Modo Claro" : "Modo Oscuro"}
              suppressHydrationWarning
            >
              {mounted ? (
                isDark ? <Sun className="h-5 w-5 text-[#E8A817]" /> : <Moon className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Hamburger Menu Button - ALWAYS visible */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              className="h-9 w-9"
              title="Menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Hamburger Slide-in Menu ─── */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0">
          <SheetHeader className="p-4 pb-2 border-b">
            <SheetTitle className="flex items-center gap-2 font-[family-name:var(--font-poppins)]">
              <img
                src="/uploads/logotipo.png"
                alt="Logo"
                className="h-8 w-auto object-contain"
              />
              <span className="text-foreground dark:text-[#E8A817]">ProveedorConecta</span>
            </SheetTitle>
            <SheetDescription className="sr-only">Menú de navegación principal</SheetDescription>
          </SheetHeader>

          {/* Mobile Search */}
          <div className="px-4 pt-3 pb-2 md:hidden">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-9 bg-muted/50 border-0"
                />
              </div>
            </form>
          </div>

          <ScrollArea className="flex-1 h-[calc(100vh-130px)]">
            <div className="px-2 pb-6">
              {/* ── User info ── */}
              {isAuthenticated && user && (
                <div className="px-2 pt-2 pb-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#1B3A5C]/10 to-[#E8A817]/10 dark:from-[#1B3A5C]/20 dark:to-[#E8A817]/20">
                    <Avatar className="h-11 w-11 border-2 border-[#E8A817] dark:border-[#E8A817]">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-[#1B3A5C] text-white">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Wallet className="h-3 w-3 text-[#E8A817] dark:text-[#E8A817]" />
                        <span className="text-xs font-medium text-[#1B3A5C] dark:text-[#E8A817]">
                          {new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(user?.balance ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Navigation ── */}
              <div className="px-2 pt-2 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Navegación</p>
              </div>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("home")}>
                <Home className="h-4 w-4 mr-3 text-[#1B3A5C] dark:text-[#E8A817]" /> Inicio
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("search")}>
                <Search className="h-4 w-4 mr-3 text-[#1B3A5C] dark:text-[#E8A817]" /> Productos
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("supplier-catalogs")}>
                <ExternalLink className="h-4 w-4 mr-3 text-[#1B3A5C] dark:text-[#E8A817]" /> Catálogos Oficiales
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("map")}>
                <MapPin className="h-4 w-4 mr-3 text-[#1B3A5C] dark:text-[#E8A817]" /> Mapa Proveedores
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("featured")}>
                <Star className="h-4 w-4 mr-3 text-[#E8A817]" /> Destacados y Ofertas
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("calendar")}>
                <Calendar className="h-4 w-4 mr-3 text-[#1B3A5C] dark:text-[#E8A817]" /> Agenda y Clima
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("why-us")}>
                <Zap className="h-4 w-4 mr-3 text-[#E8A817]" /> ¿Por qué ProveedorConecta?
              </Button>

              {/* ── Sell (Seller) ── */}
              {isAuthenticated && isSeller && (
                <>
                  <Separator className="my-2" />
                  <div className="px-2 pt-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#E8A817] dark:text-[#E8A817]">Vendedor</p>
                  </div>
                  <Button className="w-full justify-start h-10 bg-[#E8A817] hover:bg-[#C4A67A] dark:bg-[#E8A817] dark:hover:bg-[#C8920F] text-white font-semibold" onClick={() => handleNav("sell-product")}>
                    <Plus className="h-4 w-4 mr-3" /> Vender Producto
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("my-products")}>
                    <Package className="h-4 w-4 mr-3 text-[#1B3A5C]" /> Mis Productos
                  </Button>
                </>
              )}

              {/* ── Payments ── */}
              <Separator className="my-2" />
              <div className="px-2 pt-1 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pagos</p>
              </div>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("payments")}>
                <CreditCard className="h-4 w-4 mr-3 text-[#1B3A5C]" /> Métodos de Pago
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("cotizaciones")}>
                <FileText className="h-4 w-4 mr-3 text-[#1B3A5C]" /> Cotizaciones
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("currencies")}>
                <DollarSign className="h-4 w-4 mr-3 text-[#1B3A5C]" /> Divisas (USD/NIO)
              </Button>
              {isAuthenticated && (
                <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("checkout")}>
                  <ShoppingCart className="h-4 w-4 mr-3 text-[#1B3A5C]" /> Checkout
                </Button>
              )}

              {/* ── Chat & Social ── */}
              {isAuthenticated && (
                <>
                  <Separator className="my-2" />
                  <div className="px-2 pt-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comunicación</p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("chat-list")}>
                    <MessageCircle className="h-4 w-4 mr-3 text-[#1B3A5C]" /> Chats
                    {notifCount > 0 && (
                      <Badge className="ml-auto bg-[#E74C3C] text-white h-5 min-w-5 px-1 flex items-center justify-center text-[10px]">
                        {notifCount > 9 ? "9+" : notifCount}
                      </Badge>
                    )}
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("notifications")}>
                    <Bell className="h-4 w-4 mr-3 text-[#1B3A5C]" /> Notificaciones
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("reviews")}>
                    <Star className="h-4 w-4 mr-3 text-[#E8A817] dark:text-[#E8A817]" /> Reseñas
                  </Button>
                </>
              )}

              {/* ── Downloads ── */}
              {isAuthenticated && (
                <>
                  <Separator className="my-2" />
                  <div className="px-2 pt-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descargar</p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("downloads")}>
                    <Download className="h-4 w-4 mr-3 text-[#1B3A5C]" /> Centro de Descargas
                  </Button>
                </>
              )}

              {/* ── Account ── */}
              {isAuthenticated && (
                <>
                  <Separator className="my-2" />
                  <div className="px-2 pt-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mi Cuenta</p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav(isSeller ? "vendor-dashboard" : "buyer-dashboard")}>
                    <LayoutDashboard className="h-4 w-4 mr-3 text-[#1B3A5C]" /> Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("profile")}>
                    <User className="h-4 w-4 mr-3 text-[#1B3A5C]" /> Perfil
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("settings")}>
                    <Settings className="h-4 w-4 mr-3 text-[#1B3A5C]" /> Configuración
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("loyalty")}>
                    <Star className="h-4 w-4 mr-3 text-[#E8A817] dark:text-[#E8A817]" /> Puntos de Lealtad
                  </Button>
                </>
              )}

              {/* ── Admin ── */}
              {isAuthenticated && isAdmin && (
                <>
                  <Separator className="my-2" />
                  <div className="px-2 pt-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#E74C3C]">Administración</p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("admin")}>
                    <Shield className="h-4 w-4 mr-3 text-[#E74C3C]" /> Panel Admin
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("audit")}>
                    <ClipboardCheck className="h-4 w-4 mr-3 text-[#E74C3C]" /> Auditoría
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("backup")}>
                    <DatabaseBackup className="h-4 w-4 mr-3 text-[#E74C3C]" /> Backup
                  </Button>
                </>
              )}

              {/* ── Ads (Seller) ── */}
              {isAuthenticated && isSeller && (
                <>
                  <Separator className="my-2" />
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("create-ad")}>
                    <Megaphone className="h-4 w-4 mr-3 text-[#E8A817] dark:text-[#E8A817]" /> Crear Anuncio
                  </Button>
                </>
              )}

              {/* ── EQUIPO / Team ── */}
              <Separator className="my-2" />
              <div className="px-2 pt-1 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nuestro Equipo</p>
              </div>
              <TeamSectionMenu />

              {/* ── Auth ── */}
              <Separator className="my-2" />
              {isAuthenticated && user ? (
                <div className="px-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-10 text-[#E74C3C] border-[#E74C3C]/30 hover:bg-[#E74C3C]/10"
                    onClick={() => { logout(); setMenuOpen(false); }}
                  >
                    <LogOut className="h-4 w-4 mr-3" /> Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <div className="px-2 space-y-2 pt-2">
                  <Button className="w-full bg-[#1B3A5C] hover:bg-[#3A7BC8]" onClick={() => handleNav("login")}>
                    Iniciar Sesión
                  </Button>
                  <Button variant="outline" className="w-full border-[#E8A817] dark:border-[#E8A817] text-[#607D8B] dark:text-[#E8A817]" onClick={() => handleNav("register")}>
                    Registrarse
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </header>
  )
}
