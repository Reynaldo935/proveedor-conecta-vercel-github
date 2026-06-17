"use client"

import {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useCallback,
} from "react"
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps"
import type { MapInnerHandle, SampleVendor, Vendor } from "./map-data"
import { NICARAGUA_CENTER, NICARAGUA_DEFAULT_ZOOM, CITY_COORDS } from "./map-data"
import { Button } from "@/components/ui/button"
import { Satellite, MapIcon } from "lucide-react"

// ── Props ──────────────────────────────────────────────────────────────────

interface GoogleMapInnerProps {
  apiKey: string
  mapId: string
  sampleVendors: SampleVendor[]
  vendors: Vendor[]
  onVendorSelect: (vendor: SampleVendor | Vendor) => void
  onError: () => void
}

// ── Map Controller (uses useMap hook) ──────────────────────────────────────

function MapController({
  onMapReady,
}: {
  onMapReady: (map: any) => void
}) {
  const map = useMap()
  useEffect(() => {
    if (map) onMapReady(map)
  }, [map, onMapReady])
  return null
}

// ── Main Component ─────────────────────────────────────────────────────────

const GoogleMapInner = forwardRef<MapInnerHandle, GoogleMapInnerProps>(
  function GoogleMapInner(props, ref) {
    const {
      apiKey,
      mapId,
      sampleVendors,
      vendors,
      onVendorSelect,
      onError,
    } = props

    // Tipado de Google Maps: evitar error en builds si los tipos globales "google" no están disponibles
    const [mapInstance, setMapInstance] = useState<any>(null)
    const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap")
    const [selectedInfo, setSelectedInfo] = useState<{
      lat: number
      lng: number
      name: string
      category: string
      address: string
      vendorData: SampleVendor | Vendor
    } | null>(null)

    // Expose flyTo via imperative handle
    useImperativeHandle(ref, () => ({
      flyTo: (lat: number, lng: number, zoom: number) => {
        if (mapInstance) {
          mapInstance.panTo({ lat, lng })
          mapInstance.setZoom(zoom)
        }
      },
    }))

    const handleMapReady = useCallback(
      // Evitar referencia al namespace global `google` en build (types no disponibles)
      (map: any) => {
        setMapInstance(map)
      },
      []
    )

    // DB vendors with coordinates
    const dbVendorsWithCoords = vendors.filter(
      (v) => v.businessProfile?.latitude && v.businessProfile?.longitude
    )
    const useSampleVendors = dbVendorsWithCoords.length === 0

    // Handle marker click
    const handleMarkerClick = useCallback(
      (
        lat: number,
        lng: number,
        name: string,
        category: string,
        address: string,
        vendorData: SampleVendor | Vendor
      ) => {
        setSelectedInfo({ lat, lng, name, category, address, vendorData })
        onVendorSelect(vendorData)
      },
      [onVendorSelect]
    )

    return (
      <div className="relative h-[400px] sm:h-[500px]">
        <APIProvider
          apiKey={apiKey}
          onError={() => {
            // Google Maps API failed — trigger fallback to Leaflet
            onError()
          }}
        >
          <Map
            defaultCenter={{
              lat: NICARAGUA_CENTER.lat,
              lng: NICARAGUA_CENTER.lng,
            }}
            defaultZoom={NICARAGUA_DEFAULT_ZOOM}
            mapId={mapId || "DEMO_MAP_ID"}
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={true}
            style={{ width: "100%", height: "100%" }}
          >
            {/* Map controller to get map instance */}
            <MapController onMapReady={handleMapReady} />

            {/* Department capital markers */}
            {Object.entries(CITY_COORDS).map(([dept, coords]) => (
              <AdvancedMarker
                key={`dept-${dept}`}
                position={{ lat: coords[0], lng: coords[1] }}
                title={dept}
                onClick={() => {
                  setSelectedInfo({
                    lat: coords[0],
                    lng: coords[1],
                    name: dept,
                    category: "Capital departamental",
                    address: dept,
                    vendorData: {
                      lat: coords[0],
                      lng: coords[1],
                      name: dept,
                      cat: "Capital departamental",
                      address: dept,
                    },
                  })
                }}
              >
                <Pin
                  background="#1565C0"
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                  scale={0.8}
                />
              </AdvancedMarker>
            ))}

            {/* DB Vendor markers */}
            {dbVendorsWithCoords.map((v) => (
              <AdvancedMarker
                key={`db-${v.id}`}
                position={{
                  lat: v.businessProfile!.latitude!,
                  lng: v.businessProfile!.longitude!,
                }}
                title={v.businessProfile?.businessName || v.name}
                onClick={() =>
                  handleMarkerClick(
                    v.businessProfile!.latitude!,
                    v.businessProfile!.longitude!,
                    v.businessProfile?.businessName || v.name,
                    v.businessProfile?.category || "",
                    v.address,
                    v
                  )
                }
              >
                <Pin
                  background="#1A5276"
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                  scale={1.0}
                />
              </AdvancedMarker>
            ))}

            {/* Sample vendor markers (fallback) */}
            {useSampleVendors &&
              sampleVendors.map((v, i) => (
                <AdvancedMarker
                  key={`sample-${i}`}
                  position={{ lat: v.lat, lng: v.lng }}
                  title={v.name}
                  onClick={() =>
                    handleMarkerClick(
                      v.lat,
                      v.lng,
                      v.name,
                      v.cat,
                      v.address,
                      v
                    )
                  }
                >
                  <Pin
                    background="#1A5276"
                    borderColor="#ffffff"
                    glyphColor="#ffffff"
                    scale={1.0}
                  />
                </AdvancedMarker>
              ))}

            {/* InfoWindow for selected marker */}
            {selectedInfo && (
              <InfoWindow
                position={{ lat: selectedInfo.lat, lng: selectedInfo.lng }}
                onCloseClick={() => setSelectedInfo(null)}
                pixelOffset={[0, -40] as any}
              >
                <div className="p-1 min-w-[180px]">
                  <h3 className="font-semibold text-sm">{selectedInfo.name}</h3>
                  {selectedInfo.address && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {selectedInfo.address}
                    </p>
                  )}
                  {selectedInfo.category && (
                    <span className="inline-block text-xs mt-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {selectedInfo.category}
                    </span>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Satellite toggle button */}
        <div className="absolute top-3 left-3 z-10">
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 shadow-md bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 text-xs"
            onClick={() =>
              setMapType((prev) =>
                prev === "roadmap" ? "satellite" : "roadmap"
              )
            }
          >
            {mapType === "roadmap" ? (
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
        <div className="absolute bottom-3 left-3 z-10">
          <span className="text-[10px] px-2 py-1 rounded bg-white/80 dark:bg-gray-800/80 text-muted-foreground shadow">
            Google Maps
          </span>
        </div>
      </div>
    )
  }
)

export default GoogleMapInner
