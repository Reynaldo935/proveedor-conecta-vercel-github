import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await db.auditLog.deleteMany()
  await db.notification.deleteMany()
  await db.message.deleteMany()
  await db.chatRoom.deleteMany()
  await db.cotizacionResponse.deleteMany()
  await db.cotizacion.deleteMany()
  await db.savedProduct.deleteMany()
  await db.like.deleteMany()
  await db.follow.deleteMany()
  await db.wallPost.deleteMany()
  await db.transaction.deleteMany()
  await db.product.deleteMany()
  await db.businessProfile.deleteMany()
  await db.verificationToken.deleteMany()
  await db.user.deleteMany()

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
      description: 'Todo en materiales de construcción y ferretería. Más de 20 años de experiencia sirviendo a Nicaragua. Los mejores precios del mercado.',
      category: 'Construcción y Ferretería',
      address: 'Mercado Oriental, Managua',
      latitude: 12.1364,
      longitude: -86.2514,
      phone: '8888-1234',
      hours: 'Lun-Sáb 7am-6pm',
      paymentMethods: JSON.stringify(['PAYPAL', 'BANPRO', 'BAC']),
      coverImage: '/uploads/products/cemento.png',
      logo: '',
    },
  })

  await db.businessProfile.create({
    data: {
      userId: seller2.id,
      businessName: 'AgroServicios León',
      description: 'Insumos agrícolas, semillas, fertilizantes y herramientas para el campo nicaragüense. Calidad garantizada.',
      category: 'Agricultura y Ganadería',
      address: 'Centro, León',
      latitude: 12.0966,
      longitude: -86.2714,
      phone: '8777-5678',
      hours: 'Lun-Vie 8am-5pm, Sáb 8am-12pm',
      paymentMethods: JSON.stringify(['BANPRO', 'LAFISE', 'BILLETERA']),
      coverImage: '/uploads/products/fertilizante.png',
      logo: '',
    },
  })

  await db.businessProfile.create({
    data: {
      userId: seller3.id,
      businessName: 'Tech Solutions Nicaragua',
      description: 'Equipos tecnológicos, computadoras, impresoras y servicios de soporte técnico para empresas y hogares.',
      category: 'Tecnología y Electrónica',
      address: 'La Calzada, Granada',
      latitude: 11.9344,
      longitude: -85.9564,
      phone: '8666-9012',
      hours: 'Lun-Vie 9am-6pm',
      paymentMethods: JSON.stringify(['PAYPAL', 'BAC', 'BILLETERA']),
      coverImage: '/uploads/products/laptop.png',
      logo: '',
    },
  })

  // Create products with real images
  const products = [
    {
      sellerId: seller1.id,
      title: 'Cemento Portland 50kg',
      description: 'Cemento Portland de alta resistencia, ideal para construcciones residenciales y comerciales. Bolsa de 50kg. Marca Argos, la más confiable de Centroamérica.',
      price: 320,
      category: 'Construcción y Ferretería',
      tags: 'cemento,construccion,material,argos',
      quantity: 500,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/cemento.png']),
    },
    {
      sellerId: seller1.id,
      title: 'Varilla Corrugada 1/2" x 6m',
      description: 'Varilla corrugada de acero grado 60, ideal para refuerzo de concreto en losas, columnas y vigas. Cumple con normas ASTM.',
      price: 145,
      discountPrice: 125,
      discountPercent: 14,
      category: 'Construcción y Ferretería',
      tags: 'varilla,acero,construccion,refuerzo',
      quantity: 1000,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/varilla.png']),
    },
    {
      sellerId: seller1.id,
      title: 'Taladro Inalámbrico 20V',
      description: 'Taladro inalámbrico profesional con batería de litio 20V, 2 velocidades, mandril de 13mm. Incluye maletín y 2 baterías.',
      price: 2850,
      category: 'Construcción y Ferretería',
      tags: 'taladro,herramienta,inalambrico',
      quantity: 50,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/taladro.png']),
    },
    {
      sellerId: seller1.id,
      title: 'Pintura Vinílica 1 Galón',
      description: 'Pintura vinílica de alta calidad, cobertura extra. Colores disponibles: blanco, crema, beige, gris claro. Acabado mate.',
      price: 280,
      category: 'Construcción y Ferretería',
      tags: 'pintura,vinilica,construccion',
      quantity: 100,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/pintura.png']),
    },
    {
      sellerId: seller1.id,
      title: 'Tubo PVC 4" x 3m',
      description: 'Tubo PVC para conducción de agua, presión nominal 10 BAR. Conexión espiga-campana. Ideal para proyectos de plomería.',
      price: 165,
      category: 'Construcción y Ferretería',
      tags: 'tubo,pvc,plomeria,agua',
      quantity: 200,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/tubos.png']),
    },
    {
      sellerId: seller2.id,
      title: 'Fertilizante NPK 15-15-15 (qq)',
      description: 'Fertilizante granulado balanceado, ideal para todo tipo de cultivos. Quintal (100 libras). Alta eficiencia de absorción.',
      price: 850,
      discountPrice: 780,
      discountPercent: 8,
      category: 'Agricultura y Ganadería',
      tags: 'fertilizante,agricultura,cultivo,npk',
      quantity: 200,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/fertilizante.png']),
    },
    {
      sellerId: seller2.id,
      title: 'Semilla de Maíz Híbrido (lb)',
      description: 'Semilla de maíz híbrido de alto rendimiento, adaptada al trópico seco nicaragüense. Rendimiento hasta 120 qq/mz.',
      price: 95,
      category: 'Agricultura y Ganadería',
      tags: 'semilla,maiz,agricultura,hibrido',
      quantity: 500,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/semillas.png']),
    },
    {
      sellerId: seller2.id,
      title: 'Insecticida Agrícola (lt)',
      description: 'Insecticida sistémico de amplio espectro para control de plagas en cultivos. Dosis: 1-2 lt/mz. Seguro para el ambiente.',
      price: 350,
      category: 'Agricultura y Ganadería',
      tags: 'insecticida,plagas,agricultura',
      quantity: 150,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/pesticida.png']),
    },
    {
      sellerId: seller2.id,
      title: 'Tractor Agrícola 85HP',
      description: 'Tractor compacto 85HP, tracción 4x2, hidráulico, toma de fuerza 540/1000 RPM. Ideal para fincas medianas.',
      price: 385000,
      category: 'Agricultura y Ganadería',
      tags: 'tractor,maquinaria,agricultura,finka',
      quantity: 3,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/tractor.png']),
    },
    {
      sellerId: seller3.id,
      title: 'Laptop Lenovo IdeaPad 15"',
      description: 'Intel Core i5-1235U, 8GB RAM, 256GB SSD, pantalla 15.6" Full HD. Incluye Windows 11 y Office 365 trial.',
      price: 12500,
      discountPrice: 10900,
      discountPercent: 13,
      category: 'Tecnología y Electrónica',
      tags: 'laptop,computadora,tecnologia,lenovo',
      quantity: 20,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/laptop.png']),
    },
    {
      sellerId: seller3.id,
      title: 'Router WiFi 6 TP-Link',
      description: 'Router WiFi 6 de doble banda, velocidad hasta 1800 Mbps, 4 antenas, 4 puertos Gigabit. Ideal para oficina y hogar.',
      price: 2100,
      category: 'Tecnología y Electrónica',
      tags: 'router,wifi,redes,tp-link',
      quantity: 35,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/router.png']),
    },
    {
      sellerId: seller3.id,
      title: 'Cámara de Seguridad IP 4K',
      description: 'Cámara IP POE 4K, visión nocturna 30m, detector de movimiento, audio bidireccional. Compatible con NVR.',
      price: 2800,
      category: 'Tecnología y Electrónica',
      tags: 'camara,seguridad,vigilancia,ip',
      quantity: 40,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/camara.png']),
    },
    {
      sellerId: seller3.id,
      title: 'Impresora Multifuncional HP LaserJet',
      description: 'Impresora, escáner y copiadora láser. WiFi, impresión dúplex automática, bandeja 250 hojas. Económica en consumo.',
      price: 5800,
      discountPrice: 5200,
      discountPercent: 10,
      category: 'Tecnología y Electrónica',
      tags: 'impresora,hp,oficina,laser',
      quantity: 15,
      status: 'ACTIVE' as const,
      images: JSON.stringify(['/uploads/products/impresora.png']),
    },
  ]

  for (const p of products) {
    await db.product.create({
      data: {
        ...p,
        videoUrl: '',
        isFeatured: false,
      },
    })
  }

  // Create some sample notifications
  await db.notification.createMany({
    data: [
      { userId: buyer.id, type: 'WELCOME', title: '¡Bienvenido a ProveedorConecta!', message: 'Explora miles de productos de proveedores nicaragüenses.' },
      { userId: seller1.id, type: 'WELCOME', title: '¡Tu tienda está lista!', message: 'Comienza a publicar productos y llegar a más clientes.' },
    ],
  })

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
