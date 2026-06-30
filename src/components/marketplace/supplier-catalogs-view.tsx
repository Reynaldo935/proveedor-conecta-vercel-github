"use client"

import { useState } from "react"
import { SUPPLIER_CATALOGS, SupplierCatalog } from "@/data/supplier-catalogs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ExternalLink, Store, Phone, MapPin, Package, Search, ChevronRight, Building2 } from "lucide-react"
import { motion } from "framer-motion"

function SupplierCard({ supplier }: { supplier: SupplierCatalog }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:border-primary/50 transition-all duration-300 border-border bg-card overflow-hidden group">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {supplier.name.charAt(0)}
              </div>
              <div>
                <CardTitle className="text-lg font-[family-name:var(--font-poppins)] group-hover:text-primary transition-colors">
                  {supplier.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {supplier.department}
                  </Badge>
                </div>
              </div>
            </div>
            {supplier.featured && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                Destacado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {supplier.description}
          </p>
          
          {/* Product Categories */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Package className="h-3 w-3" /> PRODUCTOS
            </p>
            <div className="flex flex-wrap gap-1.5">
              {supplier.productCategories.map((cat) => (
                <Badge key={cat} variant="outline" className="text-xs bg-muted/50 border-border">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{supplier.phone}</span>
          </div>

          {/* CTA Button */}
          <a 
            href={supplier.websiteUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button 
              variant="default" 
              className="w-full group/btn font-semibold"
            >
              <ExternalLink className="h-4 w-4 mr-2 group-hover/btn:translate-x-0.5 transition-transform" />
              Ver Catálogo Real en {supplier.name.split(' ')[0]}
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </a>
          <p className="text-[10px] text-muted-foreground text-center">
            Precios y productos actualizados en tiempo real en el sitio oficial
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function SupplierCatalogsView() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas")

  const categories = ["Todas", ...new Set(SUPPLIER_CATALOGS.map(s => s.category))]

  const filtered = SUPPLIER_CATALOGS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.productCategories.some(c => c.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = selectedCategory === "Todas" || s.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold font-[family-name:var(--font-poppins)] flex items-center justify-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Catálogos Oficiales de Proveedores
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Conecta directo con los sitios oficiales de proveedores nicaragüenses. 
          Precios reales, productos actualizados, sin intermediarios.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedor o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity text-xs"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Store className="h-4 w-4" />
          {filtered.length} proveedor(es)
        </span>
        <span className="flex items-center gap-1">
          <ExternalLink className="h-4 w-4" />
          Catálogos oficiales en tiempo real
        </span>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No se encontraron proveedores con esos filtros.</p>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-center text-muted-foreground mt-8">
        Al hacer clic en &ldquo;Ver Catálogo Real&rdquo; serás redirigido al sitio web oficial del proveedor.
        Los precios y disponibilidad son administrados directamente por cada proveedor.
      </p>
    </div>
  )
}
