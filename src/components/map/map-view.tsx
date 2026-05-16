"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  MapPin,
  ChevronLeft,
  Search,
  Navigation,
  Store,
  X,
  Filter,
} from "lucide-react"
import { NICARAGUA_DEPARTMENTS } from "@/lib/validators"
import { motion, AnimatePresence } from "framer-motion"

interface Vendor {
  id: string
  name: string
  avatar: string
  address: string
  businessProfile?: {
    businessName: string
    logo: string
    category: string
    description: string
    latitude: number | null
    longitude: number | null
  } | null
}

interface SampleVendor {
  lat: number
  lng: number
  name: string
  cat: string
  address: string
}

const SAMPLE_VENDORS: SampleVendor[] = [
  // Managua (4)
  { lat: 12.1364, lng: -86.2514, name: "Ferretería Managua", cat: "Construcción y Ferretería", address: "Managua" },
  { lat: 12.0966, lng: -86.2714, name: "AgroServicios Centro", cat: "Agricultura y Ganadería", address: "Managua" },
  { lat: 12.1464, lng: -86.2914, name: "Tech Solutions Nica", cat: "Tecnología y Electrónica", address: "Managua" },
  { lat: 12.1164, lng: -86.2314, name: "Textiles Nicarao", cat: "Textil y Calzado", address: "Managua" },
  // León (2)
  { lat: 12.4354, lng: -86.8784, name: "León Industrial", cat: "Construcción y Ferretería", address: "León" },
  { lat: 12.4554, lng: -86.8584, name: "Distribuidora León", cat: "Alimentos y Bebidas", address: "León" },
  // Granada (2)
  { lat: 11.9344, lng: -85.9564, name: "Distribuidora Granada", cat: "Alimentos y Bebidas", address: "Granada" },
  { lat: 11.9144, lng: -85.9364, name: "Granada Textil", cat: "Textil y Calzado", address: "Granada" },
  // Masaya (2)
  { lat: 12.1544, lng: -86.2714, name: "Masaya Artesanías", cat: "Artesanías y Manualidades", address: "Masaya" },
  { lat: 12.1744, lng: -86.2514, name: "Mercado Masaya", cat: "Alimentos y Bebidas", address: "Masaya" },
  // Carazo (2)
  { lat: 11.7344, lng: -86.3144, name: "Carazo Agropecuaria", cat: "Agricultura y Ganadería", address: "Carazo" },
  { lat: 11.7544, lng: -86.2944, name: "Café Carazo", cat: "Alimentos y Bebidas", address: "Carazo" },
  // Rivas (2)
  { lat: 11.4344, lng: -85.8244, name: "Rivas Servicios", cat: "Servicios Profesionales", address: "Rivas" },
  { lat: 11.4544, lng: -85.8044, name: "Playas Rivas", cat: "Turismo y Hospedaje", address: "Rivas" },
  // Chinandega (2)
  { lat: 12.6244, lng: -87.1344, name: "Chinandega Agro", cat: "Agricultura y Ganadería", address: "Chinandega" },
  { lat: 12.6044, lng: -87.1144, name: "Azucarera del Norte", cat: "Alimentos y Bebidas", address: "Chinandega" },
  // Estelí (2)
  { lat: 13.0844, lng: -86.3544, name: "Estelí Agro", cat: "Agricultura y Ganadería", address: "Estelí" },
  { lat: 13.0644, lng: -86.3344, name: "Tabacos Estelí", cat: "Otros", address: "Estelí" },
  // Matagalpa (2)
  { lat: 12.9244, lng: -85.9144, name: "Matagalpa Café", cat: "Alimentos y Bebidas", address: "Matagalpa" },
  { lat: 12.9444, lng: -85.8944, name: "Café de Altura", cat: "Alimentos y Bebidas", address: "Matagalpa" },
  // Jinotega (2)
  { lat: 13.0944, lng: -86.0044, name: "Jinotega Café Orgánico", cat: "Alimentos y Bebidas", address: "Jinotega" },
  { lat: 13.1144, lng: -85.9844, name: "Flor de Jinotega", cat: "Agricultura y Ganadería", address: "Jinotega" },
  // Nueva Segovia (2)
  { lat: 13.7544, lng: -86.0944, name: "Segovia Maderas", cat: "Construcción y Ferretería", address: "Nueva Segovia" },
  { lat: 13.7344, lng: -86.0744, name: "Ocotal Servicios", cat: "Servicios Profesionales", address: "Nueva Segovia" },
  // Madriz (2)
  { lat: 13.4744, lng: -86.4644, name: "Madriz Distribuidora", cat: "Alimentos y Bebidas", address: "Madriz" },
  { lat: 13.4944, lng: -86.4444, name: "Somoto Miel", cat: "Alimentos y Bebidas", address: "Madriz" },
  // Boaco (2)
  { lat: 12.4744, lng: -85.6644, name: "Boaco Lácteos", cat: "Alimentos y Bebidas", address: "Boaco" },
  { lat: 12.4944, lng: -85.6444, name: "Ganadera Boaco", cat: "Agricultura y Ganadería", address: "Boaco" },
  // Chontales (2)
  { lat: 12.0944, lng: -85.2644, name: "Chontales Ganadera", cat: "Agricultura y Ganadería", address: "Chontales" },
  { lat: 12.1144, lng: -85.2444, name: "Quesos Chontales", cat: "Alimentos y Bebidas", address: "Chontales" },
  // Río San Juan (1)
  { lat: 11.5544, lng: -84.7744, name: "Río San Juan Pesca", cat: "Alimentos y Bebidas", address: "Río San Juan" },
  // Región Autónoma Caribe Norte (2)
  { lat: 13.0744, lng: -84.3944, name: "Caribe Norte Servicios", cat: "Servicios Profesionales", address: "Región Autónoma Caribe Norte" },
  { lat: 13.0544, lng: -84.3744, name: "Puerto Cabezas Maderas", cat: "Construcción y Ferretería", address: "Región Autónoma Caribe Norte" },
  // Región Autónoma Caribe Sur (2)
  { lat: 12.1544, lng: -83.7744, name: "Caribe Sur Distribuidora", cat: "Alimentos y Bebidas", address: "Región Autónoma Caribe Sur" },
  { lat: 12.1344, lng: -83.7544, name: "Bluefields Pescados", cat: "Alimentos y Bebidas", address: "Región Autónoma Caribe Sur" },
]

export function MapView() {
  const { navigate } = useAppStore()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const LRef = useRef<any>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<SampleVendor | Vendor | null>(null)
  const [searchLocation, setSearchLocation] = useState("")
  const [vendorCount, setVendorCount] = useState(0)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")

  // All 17 Nicaragua department coordinates
  const cityCoords: Record<string, [number, number]> = {
    "Managua": [12.1364, -86.2514],
    "León": [12.4354, -86.8784],
    "Granada": [11.9344, -85.9564],
    "Masaya": [12.1544, -86.2714],
    "Carazo": [11.7344, -86.3144],
    "Rivas": [11.4344, -85.8244],
    "Chinandega": [12.6244, -87.1344],
    "Estelí": [13.0844, -86.3544],
    "Matagalpa": [12.9244, -85.9144],
    "Jinotega": [13.0944, -86.0044],
    "Nueva Segovia": [13.7544, -86.0944],
    "Madriz": [13.4744, -86.4644],
    "Boaco": [12.4744, -85.6644],
    "Chontales": [12.0944, -85.2644],
    "Río San Juan": [11.5544, -84.7744],
    "Región Autónoma Caribe Norte": [13.0744, -84.3944],
    "Región Autónoma Caribe Sur": [12.1544, -83.7744],
  }

  // Load vendors
  useEffect(() => {
    fetch("/api/products?limit=50")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const sellerMap = new Map<string, Vendor>()
          d.data.forEach((p: any) => {
            if (!sellerMap.has(p.seller.id))
              sellerMap.set(p.seller.id, p.seller)
          })
          setVendors(
            Array.from(sellerMap.values()).filter((s: any) => s.address)
          )
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Initialize map
  useEffect(() => {
    let map: any = null
    let L: any = null

    const initMap = async () => {
      try {
        L = (await import("leaflet")).default
        await import("leaflet/dist/leaflet.css")
        LRef.current = L

        if (!mapRef.current) return

        // Default center: all of Nicaragua
        map = L.map(mapRef.current, {
          zoomControl: false,
        }).setView([12.8, -85.5], 7)

        // Add zoom control to top-right
        L.control.zoom({ position: "topright" }).addTo(map)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)

        // Fix default marker icon
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        })

        // Custom green marker for vendors
        const vendorIcon = L.divIcon({
          html: `<div style="background:#1A5276;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);color:white;font-size:14px">🏪</span></div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        })

        // Department capital blue circle markers
        const deptIcon = L.divIcon({
          html: `<div style="background:#1565C0;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><span style="color:white;font-size:11px">📍</span></div>`,
          className: "",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        })

        // Add department capital markers
        Object.entries(cityCoords).forEach(([dept, coords]) => {
          const marker = L.marker(coords, { icon: deptIcon }).addTo(map)
          marker.bindPopup(
            `<strong style="font-size:14px;color:#1565C0">📍 ${dept}</strong><br/><span style="color:#666">Capital departamental</span>`
          )
        })

        // Add DB vendor markers
        const dbVendorsWithCoords = vendors.filter(
          (v) => v.businessProfile?.latitude && v.businessProfile?.longitude
        )

        dbVendorsWithCoords.forEach((v) => {
          const marker = L.marker(
            [v.businessProfile!.latitude!, v.businessProfile!.longitude!],
            { icon: vendorIcon }
          ).addTo(map)

          marker.on("click", () => {
            setSelectedVendor(v)
          })

          marker.bindPopup(
            `<strong style="font-size:14px">${v.businessProfile?.businessName || v.name}</strong><br/><span style="color:#666">${v.address}</span><br/><em style="color:#1A5276">${v.businessProfile?.category || ""}</em>`
          )
        })

        // Add sample markers if no real coords
        if (dbVendorsWithCoords.length === 0) {
          SAMPLE_VENDORS.forEach((v) => {
            const marker = L.marker([v.lat, v.lng], { icon: vendorIcon }).addTo(map)
            marker.on("click", () => {
              setSelectedVendor(v)
            })
            marker.bindPopup(
              `<strong style="font-size:14px">${v.name}</strong><br/><em style="color:#1A5276">${v.cat}</em>`
            )
          })
          setVendorCount(SAMPLE_VENDORS.length)
        } else {
          setVendorCount(dbVendorsWithCoords.length)
        }

        mapInstanceRef.current = map
      } catch (err) {
        console.error("Map init error:", err)
      }
    }

    initMap()

    return () => {
      if (map) map.remove()
    }
  }, [vendors])

  // Filtered vendors by department
  const filteredVendors =
    selectedDepartment === "all"
      ? SAMPLE_VENDORS
      : SAMPLE_VENDORS.filter((v) => v.address === selectedDepartment)

  // Search by location
  const handleLocationSearch = useCallback(() => {
    if (!searchLocation || !mapInstanceRef.current) return

    const coords = cityCoords[searchLocation]
    if (coords) {
      mapInstanceRef.current.flyTo(coords, 13, { duration: 1.5 })
    } else {
      toast.error("Ubicación no encontrada. Intenta con un departamento.")
    }
  }, [searchLocation, cityCoords])

  // Fly to my location (Managua default)
  const flyToMyLocation = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([12.1364, -86.2514], 12, { duration: 1.5 })
    }
  }

  // Fly to department
  const flyToDepartment = (dept: string) => {
    const coords = cityCoords[dept]
    if (coords && mapInstanceRef.current) {
      setSearchLocation(dept)
      setSelectedDepartment(dept)
      mapInstanceRef.current.flyTo(coords, 12, { duration: 1.5 })
    }
  }

  // Show all of Nicaragua
  const showAllNicaragua = () => {
    if (mapInstanceRef.current) {
      setSelectedDepartment("all")
      setSearchLocation("")
      mapInstanceRef.current.flyTo([12.8, -85.5], 7, { duration: 1.5 })
    }
  }

  const isVendor = (v: any): v is Vendor => {
    return v.id !== undefined
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate("home")}>
          <ChevronLeft className="h-4 w-4 mr-1" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🇳🇮</span>
          <h1 className="text-xl font-bold font-[family-name:var(--font-poppins)]">
            Mapa de Proveedores
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="text-xs gap-1">
            🗺️ 17 Departamentos
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Store className="h-3 w-3" />
            {vendorCount} proveedores
          </Badge>
        </div>
      </div>

      {/* Search bar with department filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por departamento..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
            className="pl-9"
          />
        </div>
        <Select
          value={selectedDepartment}
          onValueChange={(val) => {
            if (val === "all") {
              showAllNicaragua()
            } else {
              flyToDepartment(val)
            }
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🇳🇮 Todos</SelectItem>
            {NICARAGUA_DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                📍 {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={flyToMyLocation}
          title="Mi ubicación (Managua)"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick location buttons - ALL 17 departments */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        <button
          onClick={showAllNicaragua}
          className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
            selectedDepartment === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "hover:bg-primary/10 hover:border-primary/30"
          }`}
        >
          🇳🇮 Todos
        </button>
        {Object.keys(cityCoords).map((city) => (
          <button
            key={city}
            onClick={() => flyToDepartment(city)}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
              searchLocation === city || selectedDepartment === city
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-primary/10 hover:border-primary/30"
            }`}
          >
            <MapPin className="h-3 w-3 inline mr-1" />
            {city}
          </button>
        ))}
      </div>

      {/* Map container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden">
          {loading ? (
            <Skeleton className="h-[400px] sm:h-[500px] w-full" />
          ) : (
            <div
              ref={mapRef}
              className="h-[400px] sm:h-[500px]"
              style={{ zIndex: 1 }}
            />
          )}
        </Card>
      </motion.div>

      {/* Department vendor count */}
      {selectedDepartment !== "all" && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{selectedDepartment}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {filteredVendors.length} proveedor{filteredVendors.length !== 1 ? "es" : ""}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Selected vendor info panel */}
      <AnimatePresence>
        {selectedVendor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Store className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {isVendor(selectedVendor)
                          ? selectedVendor.businessProfile?.businessName ||
                            selectedVendor.name
                          : selectedVendor.name}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSelectedVendor(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {isVendor(selectedVendor)
                        ? selectedVendor.address
                        : selectedVendor.address}
                    </p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {isVendor(selectedVendor)
                        ? selectedVendor.businessProfile?.category
                        : selectedVendor.cat}
                    </Badge>
                    {isVendor(selectedVendor) &&
                      selectedVendor.businessProfile?.description && (
                        <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                          {selectedVendor.businessProfile.description}
                        </p>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info footer */}
      <p className="text-sm text-muted-foreground text-center">
        🇳🇮 Haz clic en los marcadores para ver información de los proveedores · 17 departamentos de Nicaragua
      </p>
    </div>
  )
}
