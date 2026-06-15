"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
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
import {
  SAMPLE_VENDORS,
  CITY_COORDS,
  NICARAGUA_CENTER,
  NICARAGUA_DEFAULT_ZOOM,
  DEPARTMENT_ZOOM,
} from "./map-data"
import type { MapInnerHandle, SampleVendor, Vendor } from "./map-data"
import { isVendor } from "./map-data"

// ── Dynamic imports (SSR disabled for map libraries) ───────────────────────

const GoogleMapInner = dynamic(() => import("./google-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] sm:h-[500px] flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Cargando Google Maps...</p>
      </div>
    </div>
  ),
})

const LeafletMapInner = dynamic(() => import("./leaflet-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] sm:h-[500px] flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Cargando mapa...</p>
      </div>
    </div>
  ),
})

// ── API key detection ──────────────────────────────────────────────────────

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
const GOOGLE_MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ""
const hasGoogleMapsKey = !!GOOGLE_MAPS_API_KEY

// ── Main Component ─────────────────────────────────────────────────────────

export function MapView() {
  const { navigate } = useAppStore()
  const mapRef = useRef<MapInnerHandle>(null)

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<
    SampleVendor | Vendor | null
  >(null)
  const [searchLocation, setSearchLocation] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Runtime fallback: if Google Maps fails, switch to Leaflet
  const [useGoogleMaps, setUseGoogleMaps] = useState(hasGoogleMapsKey)

  // Get user's geolocation on mount
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        // Geolocation denied or unavailable — fallback to Managua
        setUserLocation(null)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  // Load vendors from API
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

  // Count vendors (derived)
  const vendorCount = (() => {
    const dbVendorsWithCoords = vendors.filter(
      (v) => v.businessProfile?.latitude && v.businessProfile?.longitude
    )
    return dbVendorsWithCoords.length > 0
      ? dbVendorsWithCoords.length
      : SAMPLE_VENDORS.length
  })()

  // Filtered vendors by department
  const filteredVendors =
    selectedDepartment === "all"
      ? SAMPLE_VENDORS
      : SAMPLE_VENDORS.filter((v) => v.address === selectedDepartment)

  // Search by location
  const handleLocationSearch = useCallback(() => {
    if (!searchLocation) return

    const coords = CITY_COORDS[searchLocation]
    if (coords && mapRef.current) {
      mapRef.current.flyTo(coords[0], coords[1], DEPARTMENT_ZOOM)
    } else {
      toast.error("Ubicación no encontrada. Intenta con un departamento.")
    }
  }, [searchLocation])

  // Fly to my location (user GPS or fallback to Managua)
  const flyToMyLocation = () => {
    if (mapRef.current) {
      if (userLocation) {
        mapRef.current.flyTo(userLocation.lat, userLocation.lng, 14)
      } else {
        // Fallback to Managua
        mapRef.current.flyTo(12.1364, -86.2514, 12)
      }
    }
  }

  // Fly to department
  const flyToDepartment = (dept: string) => {
    const coords = CITY_COORDS[dept]
    if (coords && mapRef.current) {
      setSearchLocation(dept)
      setSelectedDepartment(dept)
      mapRef.current.flyTo(coords[0], coords[1], DEPARTMENT_ZOOM)
    }
  }

  // Show all of Nicaragua
  const showAllNicaragua = () => {
    setSelectedDepartment("all")
    setSearchLocation("")
    if (mapRef.current) {
      mapRef.current.flyTo(
        NICARAGUA_CENTER.lat,
        NICARAGUA_CENTER.lng,
        NICARAGUA_DEFAULT_ZOOM
      )
    }
  }

  // Handle Google Maps error → fallback to Leaflet
  const handleGoogleMapsError = useCallback(() => {
    console.warn(
      "Google Maps failed to load, falling back to Leaflet (OpenStreetMap)"
    )
    setUseGoogleMaps(false)
    toast.info(
      "Google Maps no disponible. Usando OpenStreetMap como alternativa."
    )
  }, [])

  // Handle vendor selection from map
  const handleVendorSelect = useCallback(
    (vendor: SampleVendor | Vendor) => {
      setSelectedVendor(vendor)
    },
    []
  )

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
          <Badge
            variant={useGoogleMaps ? "default" : "secondary"}
            className="text-xs gap-1"
          >
            {useGoogleMaps ? "🌐 Google Maps" : "🗺️ OpenStreetMap"}
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
          title={userLocation ? "Mi ubicación (GPS)" : "Mi ubicación (Managua)"}
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
        {Object.keys(CITY_COORDS).map((city) => (
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
          ) : useGoogleMaps ? (
            <GoogleMapInner
              ref={mapRef}
              apiKey={GOOGLE_MAPS_API_KEY}
              mapId={GOOGLE_MAPS_MAP_ID}
              sampleVendors={SAMPLE_VENDORS}
              vendors={vendors}
              onVendorSelect={handleVendorSelect}
              onError={handleGoogleMapsError}
            />
          ) : (
            <LeafletMapInner
              ref={mapRef}
              sampleVendors={SAMPLE_VENDORS}
              vendors={vendors}
              onVendorSelect={handleVendorSelect}
              userLocation={userLocation}
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
                  <span className="text-sm font-medium">
                    {selectedDepartment}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {filteredVendors.length} proveedor
                  {filteredVendors.length !== 1 ? "es" : ""}
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
                    <AvatarImage
                      src={
                        isVendor(selectedVendor)
                          ? selectedVendor.avatar
                          : undefined
                      }
                    />
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
                      {selectedVendor.address}
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
        🇳🇮 Haz clic en los marcadores para ver información de los proveedores
        · 17 departamentos de Nicaragua
        {useGoogleMaps
          ? " · Google Maps"
          : " · OpenStreetMap + Esri Satellite"}
      </p>
    </div>
  )
}
