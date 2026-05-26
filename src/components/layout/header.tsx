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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Compass,
  ChevronDown,
  CreditCard,
  MoreHorizontal,
  Shield,
  Store,
  Star,
  Download,
  DatabaseBackup,
  Wallet,
  FileSpreadsheet,
  FileImage,
  FileDown,
} from "lucide-react"
import { useState, useEffect, useCallback, useSyncExternalStore } from "react"
import { CreatorsDropdown } from "@/components/creators/CreatorsDropdown"

// ─── Hydration-safe "mounted" flag via useSyncExternalStore ─────────────────
// Returns false during SSR and true on the client – avoids both hydration
// mismatches AND the react-hooks/set-state-in-effect lint error.
const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// Theme toggle button – reads resolvedTheme from next-themes context
// (no DOM reads, no MutationObserver, no setState-in-effect).
function ThemeToggleButton({
  mounted,
  setTheme,
  className,
}: {
  mounted: boolean
  setTheme: (theme: string) => void
  className?: string
}) {
  const { resolvedTheme } = useTheme()
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        setTheme(isDark ? "light" : "dark")
      }}
      className={className || "h-9 w-9"}
      suppressHydrationWarning
    >
      {mounted ? (
        isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}

export function Header() {
  const { setTheme } = useTheme()
  const mounted = useMounted()
  const { navigate, searchQuery, setSearchQuery } = useAppStore()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/notifications")
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
      setMobileMenuOpen(false)
    }
  }

  const handleNav = useCallback((view: Parameters<typeof navigate>[0]) => {
    navigate(view)
    setMobileMenuOpen(false)
  }, [navigate])

  const isAdmin = user?.email === "rey7214935@gmail.com"
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
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">PC</span>
            </div>
            <span className="hidden sm:block font-bold text-lg font-[family-name:var(--font-poppins)] text-primary">
              ProveedorConecta
            </span>
          </button>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-6">
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

          {/* ─── Desktop Navigation ─── */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Inicio */}
            <Button variant="ghost" size="sm" onClick={() => handleNav("home")}>
              <Home className="h-4 w-4 mr-1.5" /> Inicio
            </Button>

            {/* Explorar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Compass className="h-4 w-4 mr-1.5" /> Explorar
                  <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Explorar Marketplace
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNav("home")}>
                  <Store className="mr-2 h-4 w-4" /> Marketplace
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNav("search")}>
                  <Search className="mr-2 h-4 w-4" /> Productos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNav("map")}>
                  <MapPin className="mr-2 h-4 w-4" /> Mapa Proveedores
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNav("featured")}>
                  <Star className="mr-2 h-4 w-4" /> Destacados y Ofertas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Vender - prominent, seller only */}
            {isAuthenticated && isSeller && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleNav("sell-product")}
                className="bg-primary hover:bg-primary/90 font-semibold"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Vender
              </Button>
            )}

            {/* Métodos de Pago */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Wallet className="h-4 w-4 mr-1.5" /> Pagos
                  <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Métodos de Pago y Cotizaciones
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNav("payments")}>
                  <CreditCard className="mr-2 h-4 w-4" /> Métodos de Pago
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNav("cotizaciones")}>
                  <FileText className="mr-2 h-4 w-4" /> Cotizaciones
                </DropdownMenuItem>
                {isAuthenticated && (
                  <DropdownMenuItem onClick={() => handleNav("checkout")}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> Checkout
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Chats with unread badge */}
            {isAuthenticated && (
              <Button variant="ghost" size="sm" onClick={() => handleNav("chat-list")} className="relative">
                <MessageCircle className="h-4 w-4 mr-1.5" /> Chats
                {notifCount > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] bg-volcan text-volcan-foreground">
                    {notifCount > 9 ? "9+" : notifCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Descargar Dropdown */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1.5" /> Descargar
                    <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Exportar Datos
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNav("downloads")}>
                    <FileDown className="mr-2 h-4 w-4" /> Centro de Descargas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { fetch("/api/export?type=products&format=xlsx").then(r => r.blob()).then(b => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "productos.xlsx"; a.click(); URL.revokeObjectURL(u); }) }}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { fetch("/api/export?type=transactions&format=csv").then(r => r.blob()).then(b => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "transacciones.csv"; a.click(); URL.revokeObjectURL(u); }) }}>
                    <FileText className="mr-2 h-4 w-4" /> CSV Transacciones
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Más Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-1.5" /> Más
                  <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {isAuthenticated && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Mi Cuenta
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleNav(isSeller ? "vendor-dashboard" : "buyer-dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </DropdownMenuItem>
                    {isSeller && (
                      <DropdownMenuItem onClick={() => handleNav("my-products")}>
                        <Package className="mr-2 h-4 w-4" /> Mis Productos
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleNav("profile")}>
                      <User className="mr-2 h-4 w-4" /> Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNav("settings")}>
                      <Settings className="mr-2 h-4 w-4" /> Configuración
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNav("notifications")}>
                      <Bell className="mr-2 h-4 w-4" /> Notificaciones
                      {notifCount > 0 && (
                        <Badge className="ml-auto h-5 min-w-5 px-1 flex items-center justify-center text-[10px] bg-volcan text-volcan-foreground">
                          {notifCount > 9 ? "9+" : notifCount}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  </>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Administración
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleNav("admin")}>
                      <Shield className="mr-2 h-4 w-4" /> Panel Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNav("backup")}>
                      <DatabaseBackup className="mr-2 h-4 w-4" /> Backup
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Team / Creators */}
            <CreatorsDropdown />

            {/* Theme Toggle */}
            <ThemeToggleButton mounted={mounted} setTheme={setTheme} />

            {/* Auth Section */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[160px]">{user.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <Wallet className="h-3.5 w-3.5 text-primary" />
                      <span className="text-muted-foreground">Saldo:</span>
                      <span className="font-semibold text-primary">
                        {new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(user?.balance ?? 50000)}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNav("profile")}>
                    <User className="mr-2 h-4 w-4" /> Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNav(isSeller ? "vendor-dashboard" : "buyer-dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  {isSeller && (
                    <DropdownMenuItem onClick={() => handleNav("my-products")}>
                      <Package className="mr-2 h-4 w-4" /> Mis Productos
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleNav("cotizaciones")}>
                    <FileText className="mr-2 h-4 w-4" /> Cotizaciones
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNav("settings")}>
                    <Settings className="mr-2 h-4 w-4" /> Configuración
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => handleNav("admin")}>
                      <Shield className="mr-2 h-4 w-4" /> Panel Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Button variant="ghost" size="sm" onClick={() => navigate("login")}>
                  Iniciar Sesión
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate("register")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Registrarse
                </Button>
              </div>
            )}
          </nav>

          {/* ─── Mobile/Tablet Controls ─── */}
          <div className="flex lg:hidden items-center gap-1">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("chat-list")}
                className="relative h-9 w-9"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            )}
            <ThemeToggleButton mounted={mounted} setTheme={setTheme} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Mobile/Tablet Sheet Menu ─── */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0">
          <SheetHeader className="p-4 pb-2 border-b">
            <SheetTitle className="flex items-center gap-2 font-[family-name:var(--font-poppins)]">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">PC</span>
              </div>
              ProveedorConecta
            </SheetTitle>
            <SheetDescription className="sr-only">
              Menú de navegación principal
            </SheetDescription>
          </SheetHeader>

          {/* Search */}
          <div className="px-4 pt-3 pb-2">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos, proveedores..."
                  className="pl-9 bg-muted/50 border-0"
                />
              </div>
            </form>
          </div>

          <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
            <div className="px-2 pb-4">
              {/* ── Navigation Section ── */}
              <div className="px-2 pt-2 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Navegación
                </p>
              </div>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("home")}>
                <Home className="h-4 w-4 mr-3 text-primary" /> Inicio
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("search")}>
                <Search className="h-4 w-4 mr-3 text-primary" /> Productos
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("map")}>
                <MapPin className="h-4 w-4 mr-3 text-primary" /> Mapa Proveedores
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("featured")}>
                <Star className="h-4 w-4 mr-3 text-primary" /> Destacados y Ofertas
              </Button>

              {/* ── Sell Section (Seller Only) ── */}
              {isAuthenticated && isSeller && (
                <>
                  <Separator className="my-2" />
                  <div className="px-2 pt-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Vendedor
                    </p>
                  </div>
                  <Button className="w-full justify-start h-10 bg-primary hover:bg-primary/90 font-semibold" onClick={() => handleNav("sell-product")}>
                    <Plus className="h-4 w-4 mr-3" /> Vender Producto
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("my-products")}>
                    <Package className="h-4 w-4 mr-3 text-primary" /> Mis Productos
                  </Button>
                </>
              )}

              {/* ── Payments Section ── */}
              <Separator className="my-2" />
              <div className="px-2 pt-1 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Métodos de Pago
                </p>
              </div>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("payments")}>
                <CreditCard className="h-4 w-4 mr-3 text-primary" /> Métodos de Pago
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("cotizaciones")}>
                <FileText className="h-4 w-4 mr-3 text-primary" /> Cotizaciones
              </Button>
              {isAuthenticated && (
                <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("checkout")}>
                  <ShoppingCart className="h-4 w-4 mr-3 text-primary" /> Checkout
                </Button>
              )}

              {/* ── Communication Section ── */}
              {isAuthenticated && (
                <>
                  <Separator className="my-2" />
                  <div className="px-2 pt-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Comunicación
                    </p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("chat-list")}>
                    <MessageCircle className="h-4 w-4 mr-3 text-primary" /> Chats
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("notifications")}>
                    <Bell className="h-4 w-4 mr-3 text-primary" /> Notificaciones
                    {notifCount > 0 && (
                      <Badge className="ml-auto bg-volcan text-volcan-foreground h-5 min-w-5 px-1 flex items-center justify-center text-[10px]">
                        {notifCount > 9 ? "9+" : notifCount}
                      </Badge>
                    )}
                  </Button>
                </>
              )}

              {/* ── Downloads Section ── */}
              {isAuthenticated && (
                <>
                  <Separator className="my-2" />
                  <div className="px-2 pt-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Descargar Archivos
                    </p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("downloads")}>
                    <Download className="h-4 w-4 mr-3 text-primary" /> Centro de Descargas
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => { fetch("/api/export?type=products&format=xlsx").then(r => r.blob()).then(b => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "productos.xlsx"; a.click(); URL.revokeObjectURL(u); }) }}>
                    <FileSpreadsheet className="h-4 w-4 mr-3 text-primary" /> Exportar Excel
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => { fetch("/api/export?type=transactions&format=csv").then(r => r.blob()).then(b => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "transacciones.csv"; a.click(); URL.revokeObjectURL(u); }) }}>
                    <FileText className="h-4 w-4 mr-3 text-primary" /> Exportar CSV
                  </Button>
                </>
              )}

              {/* ── Account Section ── */}
              {isAuthenticated && (
                <>
                  <Separator className="my-2" />
                  <div className="px-2 pt-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Mi Cuenta
                    </p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav(isSeller ? "vendor-dashboard" : "buyer-dashboard")}>
                    <LayoutDashboard className="h-4 w-4 mr-3 text-primary" /> Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("profile")}>
                    <User className="h-4 w-4 mr-3 text-primary" /> Perfil
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10" onClick={() => handleNav("settings")}>
                    <Settings className="h-4 w-4 mr-3 text-primary" /> Configuración
                  </Button>
                </>
              )}

              {/* ── Admin Section ── */}
              {isAuthenticated && isAdmin && (
                <>
                  <Separator className="my-2" />
                  <div className="px-2 pt-1 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
                      Administración
                    </p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start h-10 text-destructive hover:text-destructive" onClick={() => handleNav("admin")}>
                    <Shield className="h-4 w-4 mr-3" /> Panel Admin
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-10 text-destructive hover:text-destructive" onClick={() => handleNav("backup")}>
                    <DatabaseBackup className="h-4 w-4 mr-3" /> Backup
                  </Button>
                </>
              )}

              {/* ── Team Section ── */}
              <Separator className="my-2" />
              <div className="px-2 pt-1 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Equipo
                </p>
              </div>
              <div className="px-2">
                <CreatorsDropdown />
              </div>

              {/* ── Auth Section ── */}
              <Separator className="my-2" />
              {isAuthenticated && user ? (
                <div className="px-2 space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{user.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full justify-start h-10 text-destructive hover:text-destructive" onClick={() => { logout(); setMobileMenuOpen(false) }}>
                    <LogOut className="h-4 w-4 mr-3" /> Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <div className="px-2 space-y-2">
                  <Button variant="outline" className="w-full h-10" onClick={() => { navigate("login"); setMobileMenuOpen(false) }}>
                    Iniciar Sesión
                  </Button>
                  <Button className="w-full h-10 bg-primary hover:bg-primary/90" onClick={() => { navigate("register"); setMobileMenuOpen(false) }}>
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
