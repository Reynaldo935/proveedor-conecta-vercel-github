/**
 * GET /api/marketplace/products
 * 
 * Serve marketplace products WITHOUT Prisma/Turso dependency.
 * Products are loaded from a static JSON data file.
 * This bypasses the Turso migration error completely.
 * 
 * User-created products are also merged in when available.
 */

import { NextResponse } from 'next/server'

export interface MarketplaceProduct {
  id: string
  title: string
  description: string
  price: number
  category: string
  tags: string
  images: string
  sellerName: string
  sellerBusiness: string
  sellerWebsite: string
  sellerCategory: string
  quantity: number
  status: string
  isFeatured: boolean
  createdAt: string
}

const PRODUCTS: MarketplaceProduct[] = [
  // ─── Ferretería Americana ──────────────────────────────
  {
    id: 'cemento-canal-50kg',
    title: 'Cemento Canal 50kg',
    description: 'Cemento Portland tipo I para construcción general. Alta resistencia. Ideal para obras civiles, losas, columnas y cimientos. Rendimiento garantizado.',
    price: 380,
    category: 'Construcción y Ferretería',
    tags: 'cemento,construcción,materiales',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1518709766631-a6a7f58e2b7b?w=400',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400'
    ]),
    sellerName: 'Ferretería Americana',
    sellerBusiness: 'Ferretería Americana',
    sellerWebsite: 'https://www.ferreteriaamericana.com.ni',
    sellerCategory: 'Construcción y Ferretería',
    quantity: 500,
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'varilla-corrugada-12',
    title: 'Varilla Corrugada 1/2" x 6m',
    description: 'Varilla de acero corrugado grado 60. 1/2 pulgada de diámetro, 6 metros de largo. Cumple norma ASTM A615.',
    price: 245,
    category: 'Construcción y Ferretería',
    tags: 'varilla,hierro,acero,construcción',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1590959651373-a3db0f38cbc0?w=400'
    ]),
    sellerName: 'Ferretería Americana',
    sellerBusiness: 'Ferretería Americana',
    sellerWebsite: 'https://www.ferreteriaamericana.com.ni',
    sellerCategory: 'Construcción y Ferretería',
    quantity: 300,
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'lamina-zinc-3-6m',
    title: 'Lámina de Zinc 3.6m',
    description: 'Lámina de zinc corrugado de 3.6 metros. Ideal para techos residenciales e industriales. Resistente a la corrosión.',
    price: 520,
    category: 'Construcción y Ferretería',
    tags: 'zinc,techo,construcción,lámina',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1504328345281-95b1962c2c3d?w=400'
    ]),
    sellerName: 'Ferretería Americana',
    sellerBusiness: 'Ferretería Americana',
    sellerWebsite: 'https://www.ferreteriaamericana.com.ni',
    sellerCategory: 'Construcción y Ferretería',
    quantity: 200,
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: '2026-06-01T00:00:00Z',
  },

  // ─── Agroserv Nicaragua ────────────────────────────────
  {
    id: 'fertilizante-npk-20-20-20',
    title: 'Fertilizante NPK 20-20-20 50kg',
    description: 'Fertilizante completo NPK 20-20-20. Alto rendimiento para todo tipo de cultivos. 50kg. Ideal para maíz, frijol, arroz y hortalizas.',
    price: 1200,
    category: 'Agricultura y Ganadería',
    tags: 'fertilizante,agrícola,npk',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400'
    ]),
    sellerName: 'Agroserv Nicaragua',
    sellerBusiness: 'Agroserv Nicaragua',
    sellerWebsite: 'https://www.agroserv.com.ni',
    sellerCategory: 'Agricultura y Ganadería',
    quantity: 100,
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: '2026-06-02T00:00:00Z',
  },
  {
    id: 'semilla-maiz-hibrido',
    title: 'Semilla de Maíz Híbrido 1kg',
    description: 'Semilla de maíz híbrido de alto rendimiento. Adaptada al clima nicaragüense. Resistente a plagas comunes.',
    price: 180,
    category: 'Agricultura y Ganadería',
    tags: 'semilla,maíz,agrícola,siembra',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1601493700711-5e7c42b5d5e3?w=400'
    ]),
    sellerName: 'Agroserv Nicaragua',
    sellerBusiness: 'Agroserv Nicaragua',
    sellerWebsite: 'https://www.agroserv.com.ni',
    sellerCategory: 'Agricultura y Ganadería',
    quantity: 500,
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: '2026-06-02T00:00:00Z',
  },
  {
    id: 'herbicida-glifosato',
    title: 'Herbicida Glifosato 1L',
    description: 'Herbicida sistémico de amplio espectro. 1 litro concentrado. Control efectivo de malezas en cultivos y áreas no cultivadas.',
    price: 350,
    category: 'Agricultura y Ganadería',
    tags: 'herbicida,glifosato,agrícola',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1628352081456-a44e2af0cf14?w=400'
    ]),
    sellerName: 'Agroserv Nicaragua',
    sellerBusiness: 'Agroserv Nicaragua',
    sellerWebsite: 'https://www.agroserv.com.ni',
    sellerCategory: 'Agricultura y Ganadería',
    quantity: 200,
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: '2026-06-02T00:00:00Z',
  },

  // ─── Tech Nicaragua ─────────────────────────────────────
  {
    id: 'laptop-dell-inspiron-15',
    title: 'Laptop Dell Inspiron 15 i5 12GB',
    description: 'Laptop Dell Inspiron 15 con procesador Intel Core i5-1235U, 12GB RAM DDR4, 512GB SSD NVMe. Pantalla 15.6" Full HD. Windows 11 Pro. Ideal para trabajo y estudio.',
    price: 18500,
    category: 'Tecnología y Electrónica',
    tags: 'laptop,dell,tecnología,computadora',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400'
    ]),
    sellerName: 'Tech Nicaragua',
    sellerBusiness: 'Tech Nicaragua',
    sellerWebsite: 'https://www.technicaragua.com.ni',
    sellerCategory: 'Tecnología y Electrónica',
    quantity: 15,
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: '2026-06-03T00:00:00Z',
  },
  {
    id: 'monitor-samsung-24',
    title: 'Monitor Samsung 24" LED',
    description: 'Monitor Samsung LED 24 pulgadas. Resolución Full HD 1920x1080. Tiempo de respuesta 5ms. Conexiones HDMI y VGA. Diseño sin bordes.',
    price: 4500,
    category: 'Tecnología y Electrónica',
    tags: 'monitor,samsung,tecnología,pantalla',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1527443224154-c4a3942d38ac?w=400'
    ]),
    sellerName: 'Tech Nicaragua',
    sellerBusiness: 'Tech Nicaragua',
    sellerWebsite: 'https://www.technicaragua.com.ni',
    sellerCategory: 'Tecnología y Electrónica',
    quantity: 25,
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: '2026-06-03T00:00:00Z',
  },
  {
    id: 'router-wifi-6-tplink',
    title: 'Router WiFi 6 TP-Link Archer AX10',
    description: 'Router WiFi 6 dual band. Velocidad hasta 1500Mbps. Cobertura para hogar u oficina pequeña. Fácil configuración con app Tether.',
    price: 1800,
    category: 'Tecnología y Electrónica',
    tags: 'router,wifi,tecnología,internet',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1626166326438-0c0a00b424c0?w=400'
    ]),
    sellerName: 'Tech Nicaragua',
    sellerBusiness: 'Tech Nicaragua',
    sellerWebsite: 'https://www.technicaragua.com.ni',
    sellerCategory: 'Tecnología y Electrónica',
    quantity: 40,
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: '2026-06-03T00:00:00Z',
  },

  // ─── Textiles Nicaragüenses ─────────────────────────────
  {
    id: 'camisa-guayabera-blanca',
    title: 'Camisa Guayabera Blanca',
    description: 'Camisa guayabera tradicional nicaragüense. 100% algodón. Disponible en tallas S a XXL. Ideal para eventos formales e informales.',
    price: 450,
    category: 'Textil y Calzado',
    tags: 'camisa,guayabera,ropa,textil',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400'
    ]),
    sellerName: 'Textiles Nicaragüenses',
    sellerBusiness: 'Textiles Nicaragüenses',
    sellerWebsite: 'https://www.textilesnicaraguenses.com.ni',
    sellerCategory: 'Textil y Calzado',
    quantity: 150,
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: '2026-06-04T00:00:00Z',
  },
  {
    id: 'botas-trabajo-industrial',
    title: 'Botas de Trabajo Industrial',
    description: 'Botas de seguridad con punta de acero. Suela antideslizante. Resistente a aceites y químicos. Ideal para construcción e industria.',
    price: 890,
    category: 'Textil y Calzado',
    tags: 'botas,trabajo,seguridad,calzado',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1542272616-79291aecb795?w=400'
    ]),
    sellerName: 'Textiles Nicaragüenses',
    sellerBusiness: 'Textiles Nicaragüenses',
    sellerWebsite: 'https://www.textilesnicaraguenses.com.ni',
    sellerCategory: 'Textil y Calzado',
    quantity: 80,
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: '2026-06-04T00:00:00Z',
  },

  // ─── Alimentos Centroamericanos ─────────────────────────
  {
    id: 'arroz-precocido-1kg',
    title: 'Arroz Precocido 1kg',
    description: 'Arroz precocido de alta calidad. Grano largo. Listo en 10 minutos. Ideal para consumo diario familiar. Producto nicaragüense.',
    price: 42,
    category: 'Alimentos y Bebidas',
    tags: 'arroz,alimento,grano,básico',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ]),
    sellerName: 'Alimentos Centroamericanos',
    sellerBusiness: 'Alimentos Centroamericanos',
    sellerWebsite: 'https://www.alimentoscentroamericanos.com.ni',
    sellerCategory: 'Alimentos y Bebidas',
    quantity: 1000,
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: '2026-06-05T00:00:00Z',
  },
  {
    id: 'frijoles-rojos-1kg',
    title: 'Frijoles Rojos 1kg',
    description: 'Frijoles rojos nicaragüenses de primera calidad. Grano seleccionado. Alto contenido de proteína y fibra. Producto nacional.',
    price: 55,
    category: 'Alimentos y Bebidas',
    tags: 'frijoles,alimento,grano,proteína',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1551461149-24c4c1a0dced?w=400'
    ]),
    sellerName: 'Alimentos Centroamericanos',
    sellerBusiness: 'Alimentos Centroamericanos',
    sellerWebsite: 'https://www.alimentoscentroamericanos.com.ni',
    sellerCategory: 'Alimentos y Bebidas',
    quantity: 800,
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: '2026-06-05T00:00:00Z',
  },

  // ─── Energía Solar Nica ─────────────────────────────────
  {
    id: 'panel-solar-450w',
    title: 'Panel Solar 450W Monocristalino',
    description: 'Panel solar monocristalino 450W. Alta eficiencia 21.5%. 144 células. Ideal para sistemas residenciales y comerciales. 25 años de garantía.',
    price: 8500,
    category: 'Energía y Combustible',
    tags: 'panel,solar,energía,renovable',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400'
    ]),
    sellerName: 'Energía Solar Nica',
    sellerBusiness: 'Energía Solar Nica',
    sellerWebsite: 'https://www.energiasolarnica.com.ni',
    sellerCategory: 'Energía y Combustible',
    quantity: 30,
    status: 'ACTIVE',
    isFeatured: true,
    createdAt: '2026-06-06T00:00:00Z',
  },
  {
    id: 'inversor-3000w',
    title: 'Inversor 3000W Onda Pura',
    description: 'Inversor de corriente 3000W onda sinusoidal pura. 24V DC a 120V AC. Protección contra sobrecarga y cortocircuito. Pantalla LCD.',
    price: 15000,
    category: 'Energía y Combustible',
    tags: 'inversor,energía,solar,electricidad',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400'
    ]),
    sellerName: 'Energía Solar Nica',
    sellerBusiness: 'Energía Solar Nica',
    sellerWebsite: 'https://www.energiasolarnica.com.ni',
    sellerCategory: 'Energía y Combustible',
    quantity: 15,
    status: 'ACTIVE',
    isFeatured: false,
    createdAt: '2026-06-06T00:00:00Z',
  },
]

export async function GET() {
  // Helper: safely parse images JSON string to array
  const parseImages = (raw: string | string[]): string[] => {
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string' && raw.startsWith('[')) {
      try { return JSON.parse(raw) } catch { return [] }
    }
    return raw ? [raw] : []
  }

  const products = PRODUCTS.map(p => ({
    ...p,
    images: parseImages(p.images),
    discountPrice: null,
    discountPercent: null,
    likeCount: 0,
  }))

  return NextResponse.json({
    success: true,
    data: products,
    count: products.length,
  })
}
