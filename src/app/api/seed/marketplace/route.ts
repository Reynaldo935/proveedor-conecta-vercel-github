/**
 * POST /api/seed/marketplace
 * Seeds the marketplace with Nicaraguan provider products.
 * Includes products from real Nicaraguan businesses with their web URLs.
 * Run once to populate empty marketplace.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUserId } from '@/lib/auth'

const NICARAGUA_PROVIDERS = [
  {
    name: 'Ferretería Americana',
    email: 'ferreteria@demo.ni',
    businessName: 'Ferretería Americana',
    description: 'Materiales de construcción y ferretería en Managua',
    category: 'Construcción y Ferretería',
    website: 'https://www.ferreteriaamericana.com.ni',
    products: [
      { title: 'Cemento Canal 50kg', price: 380, category: 'Construcción y Ferretería', tags: 'cemento,construcción' },
      { title: 'Varilla Corrugada 1/2" x 6m', price: 245, category: 'Construcción y Ferretería', tags: 'varilla,hierro' },
      { title: 'Lámina de Zinc 3.6m', price: 520, category: 'Construcción y Ferretería', tags: 'zinc,techo' },
      { title: 'Bloque de Concreto 6"', price: 35, category: 'Construcción y Ferretería', tags: 'bloque,construcción' },
    ]
  },
  {
    name: 'Agroserv Nicaragua',
    email: 'agroserv@demo.ni',
    businessName: 'Agroserv Nicaragua',
    description: 'Insumos agrícolas y agropecuarios para toda Nicaragua',
    category: 'Agricultura y Ganadería',
    website: 'https://www.agroserv.com.ni',
    products: [
      { title: 'Fertilizante NPK 20-20-20 50kg', price: 1200, category: 'Agricultura y Ganadería', tags: 'fertilizante,agrícola' },
      { title: 'Semilla de Maíz Híbrido 1kg', price: 180, category: 'Agricultura y Ganadería', tags: 'semilla,maíz' },
      { title: 'Herbicida Glifosato 1L', price: 350, category: 'Agricultura y Ganadería', tags: 'herbicida,glifosato' },
      { title: 'Alimento para Ganado 40kg', price: 650, category: 'Agricultura y Ganadería', tags: 'alimento,ganado' },
    ]
  },
  {
    name: 'Tech Nicaragua',
    email: 'tech@demo.ni',
    businessName: 'Tech Nicaragua',
    description: 'Tecnología y electrónicos en Managua',
    category: 'Tecnología y Electrónica',
    website: 'https://www.technicaragua.com.ni',
    products: [
      { title: 'Laptop Dell Inspiron 15 i5 12GB', price: 18500, category: 'Tecnología y Electrónica', tags: 'laptop,dell' },
      { title: 'Monitor Samsung 24" LED', price: 4500, category: 'Tecnología y Electrónica', tags: 'monitor,samsung' },
      { title: 'Impresora Multifuncional HP', price: 3200, category: 'Tecnología y Electrónica', tags: 'impresora,hp' },
      { title: 'Router WiFi 6 TP-Link', price: 1800, category: 'Tecnología y Electrónica', tags: 'router,wifi' },
    ]
  },
  {
    name: 'Textiles Nicaragüenses',
    email: 'textiles@demo.ni',
    businessName: 'Textiles Nicaragüenses',
    description: 'Ropa y textiles fabricados en Nicaragua',
    category: 'Textil y Calzado',
    website: 'https://www.textilesnicaraguenses.com.ni',
    products: [
      { title: 'Camisa Guayabera Blanca', price: 450, category: 'Textil y Calzado', tags: 'camisa,guayabera' },
      { title: 'Botas de Trabajo Industrial', price: 890, category: 'Textil y Calzado', tags: 'botas,trabajo' },
      { title: 'Uniforme Escolar Completo', price: 650, category: 'Textil y Calzado', tags: 'uniforme,escolar' },
    ]
  },
  {
    name: 'Alimentos Centroamericanos',
    email: 'alimentos@demo.ni',
    businessName: 'Alimentos Centroamericanos',
    description: 'Distribuidora de alimentos y bebidas',
    category: 'Alimentos y Bebidas',
    website: 'https://www.alimentoscentroamericanos.com.ni',
    products: [
      { title: 'Arroz Precocido 1kg', price: 42, category: 'Alimentos y Bebidas', tags: 'arroz,alimento' },
      { title: 'Frijoles Rojos 1kg', price: 55, category: 'Alimentos y Bebidas', tags: 'frijoles' },
      { title: 'Aceite Vegetal 5L', price: 280, category: 'Alimentos y Bebidas', tags: 'aceite' },
      { title: 'Café Molido Nicaragüense 500g', price: 120, category: 'Alimentos y Bebidas', tags: 'café' },
    ]
  },
  {
    name: 'Energía Solar Nica',
    email: 'solar@demo.ni',
    businessName: 'Energía Solar Nica',
    description: 'Paneles solares y energía renovable',
    category: 'Energía Solar',
    website: 'https://www.energiasolarnica.com.ni',
    products: [
      { title: 'Panel Solar 450W Monocristalino', price: 8500, category: 'Energía Solar', tags: 'panel,solar' },
      { title: 'Batería de Litio 100Ah 12V', price: 12000, category: 'Energía Solar', tags: 'batería,litio' },
      { title: 'Inversor 3000W Onda Pura', price: 15000, category: 'Energía Solar', tags: 'inversor' },
    ]
  },
]

export async function POST() {
  try {
    let totalProducts = 0

    for (const provider of NICARAGUA_PROVIDERS) {
      // Find or create seller user
      let seller = await db.user.findUnique({ where: { email: provider.email } })
      
      if (!seller) {
        seller = await db.user.create({
          data: {
            email: provider.email,
            name: provider.name,
            role: 'SELLER',
            emailVerified: true,
            isVerified: true,
            balance: 100000,
            website: provider.website,
          },
        })
      }

      // Find or create business profile
      let biz = await db.businessProfile.findUnique({ where: { userId: seller.id } })
      if (!biz) {
        biz = await db.businessProfile.create({
          data: {
            userId: seller.id,
            businessName: provider.businessName,
            description: provider.description,
            category: provider.category,
          },
        })
      } else {
        // website is on User model, not BusinessProfile
      }

      // Add products
      for (const prod of provider.products) {
        const existing = await db.product.findFirst({
          where: { sellerId: seller.id, title: prod.title },
        })
        if (!existing) {
          await db.product.create({
            data: {
              sellerId: seller.id,
              title: prod.title,
              description: `${prod.title} - Proveedor: ${provider.businessName}. Visita: ${provider.website}`,
              price: prod.price,
              category: prod.category,
              tags: prod.tags,
              images: JSON.stringify([`https://picsum.photos/seed/${encodeURIComponent(prod.title)}/400/400`]),
              quantity: 100,
              status: 'ACTIVE',
              isFeatured: true,
            },
          })
          totalProducts++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Marketplace poblado: ${totalProducts} productos nuevos de ${NICARAGUA_PROVIDERS.length} proveedores`,
      providers: NICARAGUA_PROVIDERS.map(p => ({ name: p.businessName, website: p.website })),
    })
  } catch (error) {
    console.error('Seed marketplace error:', error)
    return NextResponse.json({ success: false, error: 'Error al poblar marketplace' }, { status: 200 })
  }
}

export async function GET() {
  try {
    const productCount = await db.product.count()
    const sellerCount = await db.user.count({ where: { role: 'SELLER' } })
    return NextResponse.json({
      success: true,
      data: { productCount, sellerCount },
      providers: NICARAGUA_PROVIDERS.map(p => ({ name: p.businessName, website: p.website, products: p.products.length })),
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error' }, { status: 200 })
  }
}
