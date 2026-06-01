"use client"

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
} from "react"
import type { MapInnerHandle, SampleVendor, Vendor } from "./map-data"
import {
  NICARAGUA_CENTER,
  NICARAGUA_DEFAULT_ZOOM,
  CITY_COORDS,
} from "./map-data"
import { Button } from "@/components/ui/button"
import { Satellite, MapIcon } from "lucide-react"

// ── Props ──────────────────────────────────────────────────────────────────

interface LeafletMapInnerProps {
  sampleVendors: SampleVendor[]
  vendors: Vendor[]
  onVendorSelect: (vendor: SampleVendor | Vendor) => void
}

// ── Component ──────────────────────────────────────────────────────────────

const LeafletMapInner = forwardRef<MapInnerHandle, LeafletMapInnerProps>(
  function LeafletMapInner(props, ref) {
    const { sampleVendors, vendors, onVendorSelect } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const LRef = useRef<any>(null)
    const currentTileLayerRef = useRef<any>(null)
    const [tileMode, setTileMode] = useState<"osm" | "satellite">("osm")

    // Expose flyTo via imperative handle
    useImperativeHandle(ref, () => ({
      flyTo: (lat: number, lng: number, zoom: number) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.5 })
        }
      },
    }))

    // Initialize map
    useEffect(() => {
      let map: any = null
      let L: any = null

      const initMap = async () => {
        try {
          L = (await import("leaflet")).default
          await import("leaflet/dist/leaflet.css")
          LRef.current = L

          if (!containerRef.current) return

          // Create map centered on Nicaragua
          map = L.map(containerRef.current, {
            zoomControl: false,
          }).setView(
            [NICARAGUA_CENTER.lat, NICARAGUA_CENTER.lng],
            NICARAGUA_DEFAULT_ZOOM
          )

          // Add zoom control to top-right
          L.control.zoom({ position: "topright" }).addTo(map)

          // OpenStreetMap tile layer
          const osmLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
              maxZoom: 19,
            }
          )

          // Esri World Imagery (satellite) tile layer
          const satelliteLayer = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
              attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
              maxZoom: 19,
            }
          )

          // Esri Reference Overlay (labels on satellite)
          const labelsOverlay = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            {
              maxZoom: 19,
            }
          )

          // Start with OSM
          osmLayer.addTo(map)
          currentTileLayerRef.current = { tile: osmLayer, labels: null, mode: "osm" }

          // Store layers for switching
          ;(map as any)._pcLayers = { osmLayer, satelliteLayer, labelsOverlay }

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

          // Custom vendor marker icon (teal pin with store emoji)
          const vendorIcon = L.divIcon({
            html: `<div style="background:#1A5276;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="transform:rotate(45deg);color:white;font-size:14px">🏪</span></div>`,
            className: "",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
          })

          // Department capital marker icon (blue circle)
          const deptIcon = L.divIcon({
            html: `<div style="background:#1565C0;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><span style="color:white;font-size:11px">📍</span></div>`,
            className: "",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12],
          })

          // Add department capital markers
          Object.entries(CITY_COORDS).forEach(([dept, coords]) => {
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
              onVendorSelect(v)
            })

            marker.bindPopup(
              `<strong style="font-size:14px">${v.businessProfile?.businessName || v.name}</strong><br/><span style="color:#666">${v.address}</span><br/><em style="color:#1A5276">${v.businessProfile?.category || ""}</em>`
            )
          })

          // Add sample markers if no real coords
          if (dbVendorsWithCoords.length === 0) {
            sampleVendors.forEach((v) => {
              const marker = L.marker([v.lat, v.lng], { icon: vendorIcon }).addTo(map)
              marker.on("click", () => {
                onVendorSelect(v)
              })
              marker.bindPopup(
                `<strong style="font-size:14px">${v.name}</strong><br/><em style="color:#1A5276">${v.cat}</em>`
              )
            })
          }

          mapInstanceRef.current = map
        } catch {
          // Leaflet map init failed — component will show fallback
        }
      }

      initMap()

      return () => {
        if (map) map.remove()
      }
    }, [vendors, sampleVendors, onVendorSelect])

    // Tile layer switching
    useEffect(() => {
      const map = mapInstanceRef.current
      const L = LRef.current
      if (!map || !L) return

      const layers = (map as any)._pcLayers
      if (!layers) return

      const { osmLayer, satelliteLayer, labelsOverlay } = layers

      // Remove current tile layers
      if (currentTileLayerRef.current?.tile) {
        map.removeLayer(currentTileLayerRef.current.tile)
      }
      if (currentTileLayerRef.current?.labels) {
        map.removeLayer(currentTileLayerRef.current.labels)
      }

      if (tileMode === "satellite") {
        satelliteLayer.addTo(map)
        labelsOverlay.addTo(map)
        currentTileLayerRef.current = {
          tile: satelliteLayer,
          labels: labelsOverlay,
          mode: "satellite",
        }
      } else {
        osmLayer.addTo(map)
        currentTileLayerRef.current = {
          tile: osmLayer,
          labels: null,
          mode: "osm",
        }
      }
    }, [tileMode])

    return (
      <div className="relative h-[400px] sm:h-[500px]">
        <div
          ref={containerRef}
          className="h-full w-full"
          style={{ zIndex: 1 }}
        />

        {/* Satellite toggle button */}
        <div className="absolute top-3 left-3 z-[1000]">
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 shadow-md bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 text-xs"
            onClick={() =>
              setTileMode((prev) =>
                prev === "osm" ? "satellite" : "osm"
              )
            }
          >
            {tileMode === "osm" ? (
              <>
                <Satellite className="h-3.5 w-3.5" />
                Satélite
              </>
            ) : (
              <>
                <MapIcon className="h-3.5 w-3.5" />
                Mapa
              </>
            )}
          </Button>
        </div>

        {/* Map provider badge */}
        <div className="absolute bottom-3 left-3 z-[1000]">
          <span className="text-[10px] px-2 py-1 rounded bg-white/80 dark:bg-gray-800/80 text-muted-foreground shadow">
            OpenStreetMap + Esri
          </span>
        </div>
      </div>
    )
  }
)

export default LeafletMapInner
