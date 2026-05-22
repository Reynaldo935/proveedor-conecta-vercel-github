/**
 * Shared map data and types for ProveedorConecta Nicaragua
 * Used by both Google Maps and Leaflet map implementations
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface Vendor {
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

export interface SampleVendor {
  lat: number
  lng: number
  name: string
  cat: string
  address: string
}

/** Imperative handle exposed by map inner components for flyTo etc. */
export interface MapInnerHandle {
  flyTo: (lat: number, lng: number, zoom: number) => void
}

// ── Constants ──────────────────────────────────────────────────────────────

export const NICARAGUA_CENTER = { lat: 12.8654, lng: -85.2072 }
export const NICARAGUA_DEFAULT_ZOOM = 7
export const DEPARTMENT_ZOOM = 12

/** All 17 Nicaragua department capital coordinates */
export const CITY_COORDS: Record<string, [number, number]> = {
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

/** Sample vendor markers for demo / fallback when no DB vendors have coords */
export const SAMPLE_VENDORS: SampleVendor[] = [
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

// ── Helper ─────────────────────────────────────────────────────────────────

export function isVendor(v: SampleVendor | Vendor): v is Vendor {
  return (v as Vendor).id !== undefined
}
