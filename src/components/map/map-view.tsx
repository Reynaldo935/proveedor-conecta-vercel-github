"use client"

import { useEffect, useRef, useState } from "react"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { MapPin, ChevronLeft } from "lucide-react"

export function MapView() {
  const { navigate } = useAppStore()
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [vendors, setVendors] = useState<any[]>([])

  useEffect(() => {
    // Load vendors with business profiles
    fetch("/api/products?limit=50")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const sellerMap = new Map()
          d.data.forEach((p: any) => {
            if (!sellerMap.has(p.seller.id)) sellerMap.set(p.seller.id, p.seller)
          })
          setVendors(Array.from(sellerMap.values()).filter((s: any) => s.address))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let map: any = null
    let L: any = null

    const initMap = async () => {
      try {
        L = (await import("leaflet")).default
        await import("leaflet/dist/leaflet.css")

        if (!mapRef.current) return

        // Default center: Managua, Nicaragua
        map = L.map(mapRef.current).setView([12.1364, -86.2514], 12)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)

        // Fix default marker icon
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        })

        // Add vendor markers
        vendors.forEach((v) => {
          if (v.businessProfile?.latitude && v.businessProfile?.longitude) {
            const marker = L.marker([v.businessProfile.latitude, v.businessProfile.longitude]).addTo(map)
            marker.bindPopup(`<strong>${v.businessProfile.businessName || v.name}</strong><br/>${v.address || ""}<br/><em>${v.businessProfile.category || ""}</em>`)
          }
        })

        // If no vendors with coords, add sample markers for Nicaragua
        if (vendors.filter((v: any) => v.businessProfile?.latitude).length === 0) {
          const sampleVendors = [
            { lat: 12.1364, lng: -86.2514, name: "Ferretería Managua", cat: "Construcción" },
            { lat: 12.0966, lng: -86.2714, name: "AgroServicios Centro", cat: "Agricultura" },
            { lat: 12.1464, lng: -86.2914, name: "Tech Solutions Nica", cat: "Tecnología" },
            { lat: 12.1164, lng: -86.2314, name: "Textiles Nicarao", cat: "Textil" },
            { lat: 11.9344, lng: -85.9564, name: "Distribuidora Granada", cat: "Alimentos" },
          ]
          sampleVendors.forEach(v => {
            const marker = L.marker([v.lat, v.lng]).addTo(map)
            marker.bindPopup(`<strong>${v.name}</strong><br/><em>${v.cat}</em>`)
          })
        }

        setMapInstance(map)
      } catch (err) {
        console.error("Map init error:", err)
      }
    }

    initMap()

    return () => { if (map) map.remove() }
  }, [vendors])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate("home")}><ChevronLeft className="h-4 w-4 mr-1" /></Button>
        <h1 className="text-xl font-bold font-[family-name:var(--font-poppins)]">Mapa de Proveedores</h1>
      </div>
      <Card>
        <div ref={mapRef} className="h-[500px] rounded-lg" style={{ zIndex: 1 }} />
      </Card>
      <p className="text-sm text-muted-foreground text-center">
        🇳🇮 Haz clic en los marcadores para ver información de los proveedores
      </p>
    </div>
  )
}
