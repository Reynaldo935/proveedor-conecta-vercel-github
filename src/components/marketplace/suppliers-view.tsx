"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/store/app-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ChevronLeft,
  Search,
  Users,
  MapPin,
  Phone,
  Globe,
  CheckCircle,
  Store,
  Filter,
  ExternalLink,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PRODUCT_CATEGORIES, NICARAGUA_DEPARTMENTS } from "@/lib/validators"
import { motion } from "framer-motion"

// Real 28 Nicaraguan Suppliers
const SEED_SUPPLIERS = [
  { name: "Ingenio San Antonio", category: "Alimentos y Bebidas", address: "Chichigalpa, Chinandega", phone: "2341-6000", website: "isa1890.com", description: "Mayor productor de azúcar y bioetanol de Centroamérica", verified: true },
  { name: "Casa Pellas", category: "Transporte y Logística", address: "Rotonda Rubén Darío, Managua", phone: "2255-5000", website: "grupocasapellas.com", description: "Conglomerado más grande de Nicaragua. +100 años", verified: true },
  { name: "PROINCO", category: "Construcción y Ferretería", address: "Km 14 Carretera a Masaya, Managua", phone: "2276-9410", website: "", description: "Distribuidor líder de materiales de construcción", verified: true },
  { name: "Suplidor Empresarial", category: "Construcción y Ferretería", address: "Rotonda Bello Horizonte, Managua", phone: "2249-5290", website: "", description: "Suministros industriales: soldadura, herramientas, seguridad", verified: true },
  { name: "DIMACO", category: "Construcción y Ferretería", address: "Carretera a La Refinería, Managua", phone: "2681-2000", website: "", description: "Materiales de construcción de primera calidad", verified: true },
  { name: "Grupo Petrop", category: "Otros", address: "Zona Franca, Managua", phone: "2266-3300", website: "grupopetrop.com", description: "Materias primas plásticas para la industria", verified: true },
  { name: "Plásticos San Martín", category: "Otros", address: "Granada, Nicaragua", phone: "2552-2188", website: "", description: "Fabricantes de empaques plásticos y bolsas", verified: true },
  { name: "Importaciones Blandón Lazo", category: "Construcción y Ferretería", address: "Mercado Oriental, Managua", phone: "2480-7474", website: "", description: "Materiales de construcción importados de primera calidad", verified: true },
  { name: "Ferretería Parrales", category: "Construcción y Ferretería", address: "Barrio Larreynaga, Managua", phone: "2255-3461", website: "", description: "Ferretería completa con +30 años de experiencia", verified: true },
  { name: "Agroexport", category: "Agricultura y Ganadería", address: "Carretera Norte, Managua", phone: "2278-4100", website: "", description: "Procesamiento y exportación de frijol y vegetales", verified: true },
  { name: "Disagro", category: "Agricultura y Ganadería", address: "Km 6 Carretera Masaya, Managua", phone: "2276-8800", website: "disagro.com", description: "Insumos agrícolas de última generación. 7 países", verified: true },
  { name: "CISA AGRO", category: "Agricultura y Ganadería", address: "Km 4.5 Carretera Masaya, Managua", phone: "2276-8710", website: "", description: "Insumos agrícolas integrales. 25+ años en el mercado", verified: true },
  { name: "AGRICORP", category: "Alimentos y Bebidas", address: "Zona Industrial, Managua", phone: "2265-0100", website: "agricorp.com", description: "Productores de sémola de arroz estabilizada", verified: true },
  { name: "Lala Nicaragua", category: "Alimentos y Bebidas", address: "Carretera Sur, Managua", phone: "2270-0700", website: "", description: "Líder en producción láctea y empaques plásticos", verified: true },
  { name: "Sol Orgánica", category: "Alimentos y Bebidas", address: "San Marcos, Carazo", phone: "2553-0090", website: "", description: "Procesamiento de frutas tropicales orgánicas", verified: true },
  { name: "Nicanaturals", category: "Belleza y Cuidado Personal", address: "San Juan del Sur, Rivas", phone: "8568-9900", website: "", description: "Cosméticos y alimentos naturales. +50 emprendedores", verified: true },
  { name: "Doselva", category: "Alimentos y Bebidas", address: "Managua, Nicaragua", phone: "2277-3300", website: "doselva.com", description: "Especias de origen nicaragüense: cúrcuma, jengibre", verified: true },
  { name: "COMERSA", category: "Construcción y Ferretería", address: "Zona Franca Industrial, Managua", phone: "2268-1000", website: "", description: "Repuestos industriales y mangueras hidráulicas", verified: true },
  { name: "Shin Han Nicaragua International", category: "Otros", address: "Zona Libre, Managua", phone: "2270-5000", website: "", description: "Suministros globales con $2.53M importaciones", verified: true },
  { name: "Fresinika", category: "Alimentos y Bebidas", address: "Matagalpa, Nicaragua", phone: "8877-6600", website: "", description: "Fresas con crema artesanales. 6 sucursales 🍓", verified: true },
  { name: "Delicias Caseras Yulia", category: "Alimentos y Bebidas", address: "Managua, Nicaragua", phone: "8566-3300", website: "", description: "Cajetas tradicionales nicaragüenses con receta familiar", verified: false },
  { name: "Fercar", category: "Textil y Calzado", address: "Managua, Nicaragua", phone: "8445-2200", website: "", description: "Calzado artesanal en cuero genuino. Hecho en Nicaragua 👞", verified: false },
  { name: "Dulcería López Merlo", category: "Alimentos y Bebidas", address: "Palacagüina, Madriz", phone: "8733-4400", website: "", description: "Dulces tradicionales. Premio Mujer Creativa 2026 🍬", verified: false },
  { name: "MOROD", category: "Artesanías y Manualidades", address: "Managua, Nicaragua", phone: "8222-5500", website: "", description: "Fibras naturales y bolsos artesanales. Colección Crama Solar 🌿", verified: false },
  { name: "Arcano 33", category: "Alimentos y Bebidas", address: "Managua, Nicaragua", phone: "8111-6600", website: "", description: "Sangría Artesanal Premium. La primera de Nicaragua 🍷", verified: false },
  { name: "AgroServicios León", category: "Agricultura y Ganadería", address: "Centro, León", phone: "2311-5500", website: "", description: "Insumos agrícolas, semillas y fertilizantes desde León", verified: true },
  { name: "Tech Solutions Nicaragua", category: "Tecnología y Electrónica", address: "La Calzada, Granada", phone: "2255-7890", website: "", description: "Equipos tecnológicos y servicios de soporte técnico", verified: true },
  { name: "MaxiSport Nicaragua", category: "Deportes y Recreación", address: "Galerías Santo Domingo, Managua", phone: "2277-4400", website: "", description: "Equipamiento deportivo y recreativo ⚽", verified: true },
]

export function SuppliersView() {
  const { navigate } = useAppStore()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  const categories = [...new Set(SEED_SUPPLIERS.map(s => s.category))].sort()

  const filtered = SEED_SUPPLIERS.filter(s => {
    if (categoryFilter !== "all" && s.category !== categoryFilter) return false
    if (departmentFilter !== "all" && !s.address.includes(departmentFilter)) return false
    if (search) {
      const q = search.toLowerCase()
      return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    }
    return true
  })

  const verifiedCount = SEED_SUPPLIERS.filter(s => s.verified).length

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate("home")}>
          <ChevronLeft className="h-4 w-4 mr-1" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Proveedores de Nicaragua
          </h1>
          <p className="text-sm text-muted-foreground">
            {SEED_SUPPLIERS.length} proveedores · {verifiedCount} verificados · 17 departamentos
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px]">
            <MapPin className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {NICARAGUA_DEPARTMENTS.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Proveedores", value: SEED_SUPPLIERS.length, color: "text-primary" },
          { label: "Verificados", value: verifiedCount, color: "text-green-600" },
          { label: "Categorías", value: categories.length, color: "text-dorado" },
          { label: "Encontrados", value: filtered.length, color: "text-volcan" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((supplier, i) => (
          <motion.div
            key={supplier.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {supplier.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm truncate">{supplier.name}</h3>
                      {supplier.verified && (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {supplier.category}
                    </Badge>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{supplier.address}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{supplier.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {supplier.phone && (
                        <a href={`tel:+505${supplier.phone.replace(/-/g, "")}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {supplier.phone}
                        </a>
                      )}
                      {supplier.website && (
                        <a
                          href={supplier.website.startsWith("http") ? supplier.website : `https://${supplier.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" /> {supplier.website}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No se encontraron proveedores con esos filtros</p>
            <Button variant="link" onClick={() => { setSearch(""); setCategoryFilter("all"); setDepartmentFilter("all") }}>
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View on Map button */}
      <div className="text-center">
        <Button variant="outline" className="gap-2" onClick={() => navigate("map")}>
          <MapPin className="h-4 w-4" /> Ver en Mapa Interactivo
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
