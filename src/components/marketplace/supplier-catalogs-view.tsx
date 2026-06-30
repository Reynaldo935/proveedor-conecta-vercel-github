"use client"

import { useState, useEffect } from "react"
import { SUPPLIER_CATALOGS, SupplierCatalog } from "@/data/supplier-catalogs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ExternalLink, Store, Phone, MapPin, Package, Search, ChevronRight, 
  Building2, Clock, Mail, Globe, Star, Tag, Info, ChevronDown, ChevronUp,
  UserCheck, ShieldCheck, Users, RefreshCw
} from "lucide-react"
import { motion } from "framer-motion"

// Extended type for registered sellers fetched from API
interface RegisteredSeller extends SupplierCatalog {
  isRegisteredSeller: true
  sellerId: string
  productCount: number
  verified: boolean
  joinedAt: string
}

type UnifiedCatalog = SupplierCatalog | RegisteredSeller

function SupplierCard({ supplier }: { supplier: UnifiedCatalog }) {
  const [expanded, setExpanded] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const isRegistered = 'isRegisteredSeller' in supplier && supplier.isRegisteredSeller

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`hover:border-primary/40 transition-all duration-300 border-border bg-card overflow-hidden group h-full flex flex-col ${isRegistered ? 'border-l-4 border-l-emerald-500' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo */}
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                {!logoError && supplier.logo ? (
                  <img 
                    src={supplier.logo}
                    alt={`${supplier.name} logo`}
                    className="w-full h-full object-contain p-1"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Building2 className="w-7 h-7 text-primary/60" />
                )}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-[family-name:var(--font-poppins)] group-hover:text-primary transition-colors truncate">
                  {supplier.name}
                </CardTitle>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-[11px] px-1.5">
                    <MapPin className="h-3 w-3 mr-0.5" />
                    {supplier.city || supplier.department}
                  </Badge>
                  {isRegistered ? (
                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] px-1.5">
                      <UserCheck className="h-3 w-3 mr-0.5" /> Vendedor
                    </Badge>
                  ) : supplier.featured ? (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[11px] px-1.5">
                      <Star className="h-3 w-3 mr-0.5" /> Destacado
                    </Badge>
                  ) : null}
                  {isRegistered && (supplier as RegisteredSeller).verified && (
                    <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[11px] px-1.5">
                      <ShieldCheck className="h-3 w-3 mr-0.5" /> Verificado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {/* Tags */}
            <div className="hidden lg:flex flex-wrap gap-1 justify-end">
              {supplier.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/30">
                  <Tag className="h-2.5 w-2.5 mr-0.5" />{tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 flex-1 flex flex-col">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {supplier.description}
          </p>

          {/* Location & Contact */}
          <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            {supplier.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{supplier.address}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{supplier.phone}</span>
            </div>
            {supplier.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{supplier.email}</span>
              </div>
            )}
            {supplier.schedule && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-[11px]">{supplier.schedule}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Product Categories Pills */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> 
              {isRegistered ? 'PRODUCTOS PUBLICADOS' : 'CATEGORÍAS'}
              {isRegistered && (supplier as RegisteredSeller).productCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">{(supplier as RegisteredSeller).productCount}</Badge>
              )}
            </p>
            <div className="flex flex-wrap gap-1">
              {supplier.productCategories.slice(0, 8).map((cat) => (
                <Badge key={cat} variant="outline" className="text-[11px] bg-muted/50 border-border hover:border-primary/30">
                  {cat}
                </Badge>
              ))}
              {supplier.productCategories.length > 8 && (
                <Badge variant="outline" className="text-[11px] bg-muted/50 border-border">
                  +{supplier.productCategories.length - 8} más
                </Badge>
              )}
            </div>
          </div>

          {/* Detailed Products - Expandable */}
          {supplier.detailedProducts.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors w-full"
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <Info className="h-3.5 w-3.5" />
                PRODUCTOS Y PRECIOS ({supplier.detailedProducts.length})
              </button>
              {expanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-2 space-y-1.5 overflow-hidden"
                >
                  {supplier.detailedProducts.map((prod, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between gap-2 text-xs p-2 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{prod.name}</p>
                        {prod.description && (
                          <p className="text-[11px] text-muted-foreground truncate">{prod.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary">{prod.priceRange}</p>
                        {prod.unit && (
                          <p className="text-[10px] text-muted-foreground">/ {prod.unit}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          <div className="flex-1" />

          {/* Social Links */}
          {!isRegistered && 'socialLinks' in supplier && supplier.socialLinks && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {supplier.socialLinks.facebook && (
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  {supplier.socialLinks.facebook}
                </span>
              )}
              {supplier.socialLinks.instagram && (
                <span>{supplier.socialLinks.instagram}</span>
              )}
            </div>
          )}

          {/* CTA Button */}
          {isRegistered ? (
            <a 
              href={`/perfil/${(supplier as RegisteredSeller).sellerId}`}
              className="block w-full mt-auto"
            >
              <Button variant="default" className="w-full group/btn font-semibold text-sm bg-emerald-600 hover:bg-emerald-700">
                <Store className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                Ver Tienda de {supplier.name.split(' ')[0]}
                <ChevronRight className="h-4 w-4 ml-auto group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </a>
          ) : supplier.websiteUrl ? (
            <a 
              href={supplier.websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full mt-auto"
            >
              <Button variant="default" className="w-full group/btn font-semibold text-sm">
                <Globe className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                Ver Catálogo Real de {supplier.name.split(' ')[0]}
                <ChevronRight className="h-4 w-4 ml-auto group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </a>
          ) : null}
          <p className="text-[10px] text-muted-foreground text-center">
            {isRegistered 
              ? 'Vendedor registrado en ProveedorConecta Nicaragua' 
              : 'Precios y productos actualizados en tiempo real en el sitio oficial'}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function SupplierCardSkeleton() {
  return (
    <Card className="border-border bg-card overflow-hidden h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

export function SupplierCatalogsView() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas")
  const [tab, setTab] = useState<"todos" | "oficiales" | "vendedores">("todos")
  const [registeredSellers, setRegisteredSellers] = useState<RegisteredSeller[]>([])
  const [loadingSellers, setLoadingSellers] = useState(true)

  // Fetch registered sellers from API
  useEffect(() => {
    setLoadingSellers(true)
    fetch('/api/catalog/sellers')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setRegisteredSellers(d.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSellers(false))
  }, [])

  const categories = ["Todas", ...new Set([...SUPPLIER_CATALOGS.map(s => s.category), ...registeredSellers.map(s => s.category)])]

  // Merge catalogs based on active tab
  const allCatalogs: UnifiedCatalog[] = (() => {
    switch (tab) {
      case "oficiales": return SUPPLIER_CATALOGS
      case "vendedores": return registeredSellers
      default: return [...SUPPLIER_CATALOGS, ...registeredSellers]
    }
  })()

  const filtered = allCatalogs.filter(s => {
    const matchesSearch = search === "" || 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.productCategories.some(c => c.toLowerCase().includes(search.toLowerCase())) ||
      s.detailedProducts.some(p => p.name.toLowerCase().includes(search.toLowerCase())) ||
      s.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      (s.city || s.department || '').toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === "Todas" || s.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold font-[family-name:var(--font-poppins)] flex items-center justify-center gap-3">
          <Building2 className="h-9 w-9 text-primary" />
          Catálogos Oficiales de Proveedores
        </h2>
        <p className="text-muted-foreground max-w-3xl mx-auto text-sm leading-relaxed">
          Conecta directo con proveedores nicaragüenses.  
          <strong className="text-primary"> Precios reales, productos actualizados, sin intermediarios.</strong>
        </p>
      </div>

      {/* Tabs: Todos | Oficiales | Vendedores */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {[
          { key: "todos" as const, label: "Todos", icon: Store },
          { key: "oficiales" as const, label: "Oficiales", icon: Globe },
          { key: "vendedores" as const, label: "Vendedores", icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={tab === key ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab(key)}
            className={`gap-1.5 text-xs ${tab === key ? '' : 'text-muted-foreground'}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {key === "oficiales" && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-0.5">{SUPPLIER_CATALOGS.length}</Badge>
            )}
            {key === "vendedores" && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-0.5">{registeredSellers.length}</Badge>
            )}
          </Button>
        ))}
        {loadingSellers && (
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-2" />
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sticky top-16 z-10 bg-background/95 backdrop-blur py-3 border-b border-border">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedor, producto, ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity text-[11px] px-2.5 py-1"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <Store className="h-4 w-4 text-primary" />
          {filtered.length} proveedor(es)
        </span>
        <span className="flex items-center gap-1.5">
          <ExternalLink className="h-4 w-4" />
          {tab === "oficiales" ? 'Catálogos oficiales' : tab === "vendedores" ? 'Vendedores registrados' : 'Todos los catálogos'}
        </span>
        <span className="flex items-center gap-1.5">
          <Tag className="h-4 w-4" />
          {filtered.reduce((sum, s) => sum + s.detailedProducts.length, 0)} productos
        </span>
      </div>

      {/* Supplier Grid */}
      {loadingSellers && tab !== "oficiales" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <SupplierCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}

      {filtered.length === 0 && !loadingSellers && (
        <div className="text-center py-16 text-muted-foreground">
          <Store className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No se encontraron proveedores.</p>
          <p className="text-sm mt-1">Prueba con otra búsqueda o categoría.</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          ¿Eres vendedor y quieres aparecer aquí?{' '}
          <span className="text-primary cursor-pointer hover:underline">Regístrate como vendedor</span>
        </p>
      </div>
    </div>
  )
}
