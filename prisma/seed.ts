import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo sellers
  const seller1 = await db.user.create({
    data: {
      email: 'ferreteria@demo.ni',
      name: 'Carlos Hernández',
      password: await bcrypt.hash('demo123', 12),
      role: 'SELLER',
      phone: '8888-1234',
      address: 'Managua, Nicaragua',
      avatar: '',
      isVerified: true,
      emailVerified: true,
    },
  })

  const seller2 = await db.user.create({
    data: {
      email: 'agroserv@demo.ni',
      name: 'María López',
      password: await bcrypt.hash('demo123', 12),
      role: 'SELLER',
      phone: '8777-5678',
      address: 'León, Nicaragua',
      avatar: '',
      isVerified: true,
      emailVerified: true,
    },
  })

  const seller3 = await db.user.create({
    data: {
      email: 'tech@demo.ni',
      name: 'Roberto Gutiérrez',
      password: await bcrypt.hash('demo123', 12),
      role: 'SELLER',
      phone: '8666-9012',
      address: 'Granada, Nicaragua',
      avatar: '',
      isVerified: true,
      emailVerified: true,
    },
  })

  // Create demo buyer
  const buyer = await db.user.create({
    data: {
      email: 'comprador@demo.ni',
      name: 'Ana Torres',
      password: await bcrypt.hash('demo123', 12),
      role: 'BUYER',
      phone: '8555-3456',
      address: 'Masaya, Nicaragua',
      avatar: '',
      isVerified: true,
      emailVerified: true,
    },
  })

  // Create business profiles
  await db.businessProfile.create({
    data: {
      userId: seller1.id,
      businessName: 'Ferretería Central Managua',
      description: 'Todo en materiales de construcción y ferretería. Más de 20 años de experiencia sirviendo a Nicaragua.',
      category: 'Construcción y Ferretería',
      address: 'Mercado Oriental, Managua',
      latitude: 12.1364,
      longitude: -86.2514,
      phone: '8888-1234',
      hours: 'Lun-Sáb 7am-6pm',
      paymentMethods: JSON.stringify(['PAYPAL', 'BANPRO', 'BAC']),
    },
  })

  await db.businessProfile.create({
    data: {
      userId: seller2.id,
      businessName: 'AgroServicios León',
      description: 'Insumos agrícolas, semillas, fertilizantes y herramientas para el campo nicaragüense.',
      category: 'Agricultura y Ganadería',
      address: 'Centro, León',
      latitude: 12.0966,
      longitude: -86.2714,
      phone: '8777-5678',
      hours: 'Lun-Vie 8am-5pm, Sáb 8am-12pm',
      paymentMethods: JSON.stringify(['BANPRO', 'LAFISE', 'BILLETERA']),
    },
  })

  await db.businessProfile.create({
    data: {
      userId: seller3.id,
      businessName: 'Tech Solutions Nicaragua',
      description: 'Equipos tecnológicos, computadoras, impresoras y servicios de soporte técnico para empresas.',
      category: 'Tecnología y Electrónica',
      address: 'La Calzada, Granada',
      latitude: 11.9344,
      longitude: -85.9564,
      phone: '8666-9012',
      hours: 'Lun-Vie 9am-6pm',
      paymentMethods: JSON.stringify(['PAYPAL', 'BAC', 'BILLETERA']),
    },
  })

  // Create products
  const products = [
    {
      sellerId: seller1.id, title: 'Cemento Portland 50kg', description: 'Cemento Portland de alta resistencia, ideal para construcciones residenciales y comerciales. Bolsa de 50kg.', price: 320, category: 'Construcción y Ferretería', tags: 'cemento,construccion,material', quantity: 500, status: 'ACTIVE',
    },
    {
      sellerId: seller1.id, title: 'Varilla de Acero 1/2" x 6m', description: 'Varilla corrugada de acero grado 60, ideal para refuerzo de concreto.', price: 145, category: 'Construcción y Ferretería', tags: 'varilla,acero,construccion', quantity: 1000, status: 'ACTIVE', discountPrice: 125, discountPercent: 14,
    },
    {
      sellerId: seller1.id, title: 'Martillo de Uña 16oz', description: 'Martillo profesional con mango de fibra de vidrio, anti-vibración.', price: 185, category: 'Construcción y Ferretería', tags: 'martillo,herramienta', quantity: 50, status: 'ACTIVE',
    },
    {
      sellerId: seller2.id, title: 'Fertilizante NPK 15-15-15 (qq)', description: 'Fertilizante granulado balanceado, ideal para todo tipo de cultivos. Quintal.', price: 850, category: 'Agricultura y Ganadería', tags: 'fertilizante,agricultura,cultivo', quantity: 200, status: 'ACTIVE', discountPrice: 780, discountPercent: 8,
    },
    {
      sellerId: seller2.id, title: 'Semilla de Maíz Híbrido (lb)', description: 'Semilla de maíz híbrido de alto rendimiento, adaptada al trópico seco.', price: 95, category: 'Agricultura y Ganadería', tags: 'semilla,maiz,agricultura', quantity: 500, status: 'ACTIVE',
    },
    {
      sellerId: seller2.id, title: 'Bomba de Agua 2HP', description: 'Bomba centrifuga para riego agrícola, motor de 2HP, 220V.', price: 4500, category: 'Agricultura y Ganadería', tags: 'bomba,riego,agua', quantity: 15, status: 'ACTIVE',
    },
    {
      sellerId: seller3.id, title: 'Laptop Lenovo IdeaPad 15"', description: 'Intel Core i5, 8GB RAM, 256GB SSD. Ideal para trabajo y estudio.', price: 12500, category: 'Tecnología y Electrónica', tags: 'laptop,computadora,tecnologia', quantity: 20, status: 'ACTIVE', discountPrice: 10900, discountPercent: 13,
    },
    {
      sellerId: seller3.id, title: 'Impresora Multifuncional HP', description: 'Impresora, escáner y copiadora. WiFi, impresión a color, económica.', price: 3800, category: 'Tecnología y Electrónica', tags: 'impresora,hp,oficina', quantity: 30, status: 'ACTIVE',
    },
    {
      sellerId: seller3.id, title: 'Monitor Samsung 22" Full HD', description: 'Monitor LED 22 pulgadas, resolución 1920x1080, entrada HDMI y VGA.', price: 3200, category: 'Tecnología y Electrónica', tags: 'monitor,samsung,pantalla', quantity: 25, status: 'ACTIVE',
    },
    {
      sellerId: seller1.id, title: 'Pintura Vinílica 1 Galón', description: 'Pintura vinílica de alta calidad, cobertura extra, colores disponibles.', price: 280, category: 'Construcción y Ferretería', tags: 'pintura,vinilica,construccion', quantity: 100, status: 'ACTIVE',
    },
    {
      sellerId: seller2.id, title: 'Insecticida Agrícola (lt)', description: 'Insecticida sistémico de amplio espectro para control de plagas.', price: 350, category: 'Agricultura y Ganadería', tags: 'insecticida,plagas,agricultura', quantity: 150, status: 'ACTIVE',
    },
    {
      sellerId: seller1.id, title: 'Soldadora Inverter 200A', description: 'Soldadora inverter portátil, electrodos 6013/7018, ideal para taller.', price: 5800, category: 'Construcción y Ferretería', tags: 'soldadora,inverter,herramienta', quantity: 10, status: 'ACTIVE', discountPrice: 5200, discountPercent: 10,
    },
  ]

  for (const p of products) {
    await db.product.create({
      data: {
        ...p,
        images: JSON.stringify([]),
        videoUrl: '',
        isFeatured: false,
      },
    })
  }

  console.log(`✅ Seeded ${products.length} products, 3 sellers, 1 buyer`)
  console.log('📧 Demo accounts:')
  console.log('  Seller: ferreteria@demo.ni / demo123')
  console.log('  Seller: agroserv@demo.ni / demo123')
  console.log('  Seller: tech@demo.ni / demo123')
  console.log('  Buyer:  comprador@demo.ni / demo123')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
