"use client"

import { useTheme } from "next-themes"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sun,
  Moon,
  Search,
  ShoppingCart,
  MessageCircle,
  Bell,
  MapPin,
  Menu,
  X,
  Plus,
  User,
  LogOut,
  Package,
  LayoutDashboard,
  FileText,
  Heart,
  Settings,
} from "lucide-react"
import { useState, useEffect } from "react"

export function Header() {
  const { theme, setTheme } = useTheme()
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
    if (searchQuery.trim()) navigate("search")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">PC</span>
            </div>
            <span className="hidden sm:block font-bold text-lg font-[family-name:var(--font-poppins)] text-primary">
              ProveedorConecta
            </span>
          </button>

          {/* Search Bar */}
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("map")}>
              <MapPin className="h-4 w-4 mr-1" /> Mapa
            </Button>

            {isAuthenticated && user ? (
              <>
                {user.role === "SELLER" && (
                  <Button variant="default" size="sm" onClick={() => navigate("sell-product")} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-1" /> Vender
                  </Button>
                )}

                <Button variant="ghost" size="icon" onClick={() => navigate("chat-list")}>
                  <MessageCircle className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" onClick={() => navigate("notifications")} className="relative">
                  <Bell className="h-5 w-5" />
                  {notifCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-volcan text-volcan-foreground">
                      {notifCount > 9 ? "9+" : notifCount}
                    </Badge>
                  )}
                </Button>

                {/* Theme Toggle */}
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                {/* User Menu */}
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
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("profile")}>
                      <User className="mr-2 h-4 w-4" /> Mi Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(user.role === "SELLER" ? "vendor-dashboard" : "buyer-dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </DropdownMenuItem>
                    {user.role === "SELLER" && (
                      <DropdownMenuItem onClick={() => navigate("my-products")}>
                        <Package className="mr-2 h-4 w-4" /> Mis Productos
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate("cotizaciones")}>
                      <FileText className="mr-2 h-4 w-4" /> Cotizaciones
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("settings")}>
                      <Settings className="mr-2 h-4 w-4" /> Configuración
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("login")}>
                  Iniciar Sesión
                </Button>
                <Button variant="default" size="sm" onClick={() => navigate("register")} className="bg-primary hover:bg-primary/90">
                  Registrarse
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t mt-2 pt-4 space-y-2">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="pl-9"
                />
              </div>
            </form>

            <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("map"); setMobileMenuOpen(false) }}>
              <MapPin className="h-4 w-4 mr-2" /> Mapa de Proveedores
            </Button>

            {isAuthenticated && user ? (
              <>
                {user.role === "SELLER" && (
                  <Button className="w-full justify-start bg-primary" onClick={() => { navigate("sell-product"); setMobileMenuOpen(false) }}>
                    <Plus className="h-4 w-4 mr-2" /> Vender Producto
                  </Button>
                )}
                <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("chat-list"); setMobileMenuOpen(false) }}>
                  <MessageCircle className="h-4 w-4 mr-2" /> Chats
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("notifications"); setMobileMenuOpen(false) }}>
                  <Bell className="h-4 w-4 mr-2" /> Notificaciones
                  {notifCount > 0 && <Badge className="ml-2 bg-volcan">{notifCount}</Badge>}
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("profile"); setMobileMenuOpen(false) }}>
                  <User className="h-4 w-4 mr-2" /> Mi Perfil
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate(user.role === "SELLER" ? "vendor-dashboard" : "buyer-dashboard"); setMobileMenuOpen(false) }}>
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { logout(); setMobileMenuOpen(false) }}>
                  <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("login"); setMobileMenuOpen(false) }}>
                  Iniciar Sesión
                </Button>
                <Button className="w-full justify-start bg-primary" onClick={() => { navigate("register"); setMobileMenuOpen(false) }}>
                  Registrarse
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
