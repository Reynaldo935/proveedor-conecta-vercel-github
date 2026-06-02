/**
 * Seed Turso cloud database with demo data
 * Uses @libsql/client directly for Turso compatibility
 */
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'

const TURSO_URL = process.env.TURSO_DATABASE_URL!
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set')
  process.exit(1)
}

function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `c${timestamp}${random}`
}

async function main() {
  console.log('🌱 Seeding Turso database...')
  console.log(`   URL: ${TURSO_URL}`)

  const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  })

  // Clean existing data (reverse dependency order)
  const tablesToClean = [
    'ReviewVote', 'Review', 'PointHistory', 'LoyaltyPoint',
    'CalendarEvent', 'Appointment', 'CommissionLog', 'Advertisement',
    'QuantityDiscount', 'CotizacionResponse', 'Cotizacion',
    'SavedProduct', 'Like', 'Follow', 'PostComment', 'PostLike', 'WallPost',
    'Message', 'ChatRoom', 'Transaction', 'Notification',
    'Product', 'BusinessProfile', 'AuditLog',
    'PhoneVerification', 'VerificationToken', 'User'
  ]

  for (const table of tablesToClean) {
    try {
      await client.execute(`DELETE FROM "${table}"`)
    } catch {
      // Table might be empty
    }
  }
  console.log('🧹 Cleaned existing data')

  const passwordHash = await bcrypt.hash('supplier123', 4)
  const demoPasswordHash = await bcrypt.hash('demo123', 4)
  const adminPasswordHash = await bcrypt.hash('Rey7214935', 4)

  // ─── Admin User ──────────────────────────────────────────────────
  const adminId = generateCuid()
  await client.execute({
    sql: `INSERT INTO "User" (id, email, name, password, role, phone, address, avatar, isVerified, emailVerified, balance, "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [adminId, 'rey7214935@gmail.com', 'Reynaldo', adminPasswordHash, 'ADMIN', '+505 8888-0000', 'Managua, Nicaragua', '', 1, 1, 100000]
  })
  console.log('  👑 Admin: rey7214935@gmail.com')

  // ─── Demo Sellers ────────────────────────────────────────────────
  const seller1Id = generateCuid()
  await client.execute({
    sql: `INSERT INTO "User" (id, email, name, password, role, phone, address, avatar, isVerified, emailVerified, balance, "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [seller1Id, 'ferreteria@demo.ni', 'Carlos Hernández', demoPasswordHash, 'SELLER', '8888-1234', 'Managua, Nicaragua', '', 1, 1, 50000]
  })

  const seller2Id = generateCuid()
  await client.execute({
    sql: `INSERT INTO "User" (id, email, name, password, role, phone, address, avatar, isVerified, emailVerified, balance, "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [seller2Id, 'agroserv@demo.ni', 'María López', demoPasswordHash, 'SELLER', '8777-5678', 'León, Nicaragua', '', 1, 1, 50000]
  })

  const seller3Id = generateCuid()
  await client.execute({
    sql: `INSERT INTO "User" (id, email, name, password, role, phone, address, avatar, isVerified, emailVerified, balance, "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [seller3Id, 'tech@demo.ni', 'Roberto Gutiérrez', demoPasswordHash, 'SELLER', '8666-9012', 'Granada, Nicaragua', '', 1, 1, 50000]
  })

  // Demo buyer
  const buyerId = generateCuid()
  await client.execute({
    sql: `INSERT INTO "User" (id, email, name, password, role, phone, address, avatar, isVerified, emailVerified, balance, "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [buyerId, 'comprador@demo.ni', 'Ana Torres', demoPasswordHash, 'BUYER', '8555-3456', 'Masaya, Nicaragua', '', 1, 1, 50000]
  })
  console.log('  👤 Demo users created (3 sellers + 1 buyer)')

  // ─── Business Profiles ───────────────────────────────────────────
  await client.execute({
    sql: `INSERT INTO "BusinessProfile" (id, "userId", "businessName", description, category, address, latitude, longitude, phone, hours, "paymentMethods", "coverImage", logo, "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [generateCuid(), seller1Id, 'Ferretería Central Managua', 'Todo en materiales de construcción y ferretería. Más de 20 años de experiencia.', 'Construcción y Ferretería', 'Mercado Oriental, Managua', 12.1364, -86.2514, '8888-1234', 'Lun-Sáb 7am-6pm', '["PAYPAL","BANPRO","BAC"]', '/uploads/products/cemento.png', '']
  })

  await client.execute({
    sql: `INSERT INTO "BusinessProfile" (id, "userId", "businessName", description, category, address, latitude, longitude, phone, hours, "paymentMethods", "coverImage", logo, "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [generateCuid(), seller2Id, 'AgroServicios León', 'Insumos agrícolas, semillas, fertilizantes y herramientas.', 'Agricultura y Ganadería', 'Centro, León', 12.0966, -86.2714, '8777-5678', 'Lun-Vie 8am-5pm, Sáb 8am-12pm', '["BANPRO","LAFISE","BILLETERA"]', '/uploads/products/fertilizante.png', '']
  })

  await client.execute({
    sql: `INSERT INTO "BusinessProfile" (id, "userId", "businessName", description, category, address, latitude, longitude, phone, hours, "paymentMethods", "coverImage", logo, "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [generateCuid(), seller3Id, 'Tech Solutions Nicaragua', 'Equipos tecnológicos, computadoras, impresoras y servicios de soporte técnico.', 'Tecnología y Electrónica', 'La Calzada, Granada', 11.9344, -85.9564, '8666-9012', 'Lun-Vie 9am-6pm', '["PAYPAL","BAC","BILLETERA"]', '/uploads/products/laptop.png', '']
  })
  console.log('  🏢 Business profiles created')

  // ─── 20+ Verified Nicaraguan Suppliers ───────────────────────────
  const suppliers = [
    { email: 'supplier+ingenio@proveedorconecta.ni', name: 'Ingenio San Antonio', businessName: 'Ingenio San Antonio', description: 'Productor líder de azúcar y bioetanol en Nicaragua.', category: 'Alimentos y Bebidas', phone: '+505 2315 7000', address: 'Chinandega, Nicaragua', lat: 13.2878, lng: -87.1444, products: [
      { title: 'Azúcar Morena 5lb', price: 85, category: 'Alimentos y Bebidas', tags: 'azucar,morena,alimento', quantity: 1000 },
      { title: 'Alcohol Etílico 1L', price: 200, category: 'Alimentos y Bebidas', tags: 'alcohol,etilico,industrial', quantity: 500 },
      { title: 'Bioetanol Galón', price: 380, category: 'Energía y Combustible', tags: 'bioetanol,combustible,galon', quantity: 300 },
    ]},
    { email: 'supplier+flordecana@proveedorconecta.ni', name: 'Flor de Caña', businessName: 'Flor de Caña', description: 'Ron premium nicaragüense reconocido mundialmente.', category: 'Alimentos y Bebidas', phone: '+505 2255 3300', address: 'Chinandega, Nicaragua', lat: 12.6, lng: -87.15, products: [
      { title: 'Ron 7 Años 750ml', price: 580, category: 'Alimentos y Bebidas', tags: 'ron,premium,7anos', quantity: 200 },
      { title: 'Ron 12 Años 750ml', price: 950, category: 'Alimentos y Bebidas', tags: 'ron,premium,12anos', quantity: 150 },
      { title: 'Ron 18 Años 750ml', price: 1200, category: 'Alimentos y Bebidas', tags: 'ron,premium,18anos', quantity: 80 },
    ]},
    { email: 'supplier+lacuracao@proveedorconecta.ni', name: 'La Curacao Nicaragua', businessName: 'La Curacao Nicaragua', description: 'Electrodomésticos, tecnología y muebles para el hogar.', category: 'Tecnología y Electrónica', phone: '+505 2782 4191', address: 'Managua, Nicaragua', lat: 12.1364, lng: -86.2514, products: [
      { title: 'Refrigeradora Mabe 14\'', price: 15999, category: 'Hogar y Muebles', tags: 'refrigeradora,mabe,electrodomestico', quantity: 25 },
      { title: 'Lavadora Samsung 16kg', price: 18500, category: 'Hogar y Muebles', tags: 'lavadora,samsung,electrodomestico', quantity: 15 },
      { title: 'Smart TV LG 55"', price: 22999, category: 'Tecnología y Electrónica', tags: 'smartv,lg,pantalla', quantity: 10 },
    ]},
    { email: 'supplier+pollotiptop@proveedorconecta.ni', name: 'Pollo Tip Top', businessName: 'Deli Pollo - Pollo Tip Top', description: 'Alimentos avícolas de la más alta calidad.', category: 'Alimentos y Bebidas', phone: '+505 2278 2519', address: 'Managua, Nicaragua', lat: 12.15, lng: -86.27, products: [
      { title: 'Pollo Entero', price: 185, category: 'Alimentos y Bebidas', tags: 'pollo,entero,aves', quantity: 500 },
      { title: 'Combo Familiar 8 piezas', price: 420, category: 'Alimentos y Bebidas', tags: 'pollo,combo,familiar', quantity: 300 },
      { title: 'Canasta de Pollo', price: 280, category: 'Alimentos y Bebidas', tags: 'pollo,canasta,aves', quantity: 200 },
    ]},
    { email: 'supplier+ferromax@proveedorconecta.ni', name: 'Grupo Ferromax', businessName: 'Grupo Ferromax', description: 'Materiales de construcción y acero.', category: 'Construcción y Ferretería', phone: '+505 2255 4400', address: 'Managua, Nicaragua', lat: 12.12, lng: -86.25, products: [
      { title: 'Varilla Corrugada 1/2"', price: 145, category: 'Construcción y Ferretería', tags: 'varilla,corrugada,acero', quantity: 2000 },
      { title: 'Lámina Zinc 3m', price: 380, category: 'Construcción y Ferretería', tags: 'lamina,zinc,techo', quantity: 800 },
      { title: 'Tubo Estructural 4"', price: 650, category: 'Construcción y Ferretería', tags: 'tubo,estructural,acero', quantity: 400 },
    ]},
    { email: 'supplier+ccn@proveedorconecta.ni', name: 'Cervecería Nicaragua', businessName: 'CCN - Cervecería Nicaragua', description: 'Cerveza Toña, Agua Viva y más bebidas nacionales.', category: 'Alimentos y Bebidas', phone: '+505 2255 5500', address: 'Managua, Nicaragua', lat: 12.14, lng: -86.26, products: [
      { title: 'Cerveza Toña 6-pack', price: 150, category: 'Alimentos y Bebidas', tags: 'cerveza,tona,pack', quantity: 1000 },
      { title: 'Agua Viva 1 Galón', price: 45, category: 'Alimentos y Bebidas', tags: 'agua,galon,bebida', quantity: 2000 },
      { title: 'Ron Plata 750ml', price: 220, category: 'Alimentos y Bebidas', tags: 'ron,plata,bebida', quantity: 500 },
    ]},
    { email: 'supplier+sanmartin@proveedorconecta.ni', name: 'Plásticos San Martín', businessName: 'Plásticos San Martín', description: 'Empaques plásticos industriales y domésticos.', category: 'Otros', phone: '+505 2552 2188', address: 'Granada, Nicaragua', lat: 11.9344, lng: -85.956, products: [
      { title: 'Bolsas Plásticas 100u', price: 120, category: 'Otros', tags: 'bolsas,plasticas,empaques', quantity: 800 },
      { title: 'Contenedor Plástico 5L', price: 85, category: 'Otros', tags: 'contenedor,plastico,almacen', quantity: 500 },
      { title: 'Rollo Película', price: 250, category: 'Otros', tags: 'rollo,pelicula,empaque', quantity: 300 },
    ]},
    { email: 'supplier+puratos@proveedorconecta.ni', name: 'Puratos Nicaragua', businessName: 'Puratos Nicaragua', description: 'Insumos profesionales para panificación y pastelería.', category: 'Alimentos y Bebidas', phone: '+505 2278 3300', address: 'Managua, Nicaragua', lat: 12.13, lng: -86.24, products: [
      { title: 'Harina Especial 25kg', price: 890, category: 'Alimentos y Bebidas', tags: 'harina,especial,panificacion', quantity: 200 },
      { title: 'Mejorador Panificación 5kg', price: 450, category: 'Alimentos y Bebidas', tags: 'mejorador,panificacion,insumo', quantity: 150 },
      { title: 'Levadura Seca 500g', price: 185, category: 'Alimentos y Bebidas', tags: 'levadura,seca,panificacion', quantity: 400 },
    ]},
    { email: 'supplier+cisaagro@proveedorconecta.ni', name: 'CISA AGRO', businessName: 'CISA AGRO', description: 'Insumos agrícolas de calidad para el campo nicaragüense.', category: 'Agricultura y Ganadería', phone: '+505 2276 8710', address: 'Managua, Nicaragua', lat: 12.11, lng: -86.23, products: [
      { title: 'Fertilizante 15-15-15 50kg', price: 680, category: 'Agricultura y Ganadería', tags: 'fertilizante,npk,agricultura', quantity: 300 },
      { title: 'Herbicida Glifosato 1L', price: 320, category: 'Agricultura y Ganadería', tags: 'herbicida,glifosato,agricultura', quantity: 500 },
      { title: 'Semilla Maíz 5kg', price: 450, category: 'Agricultura y Ganadería', tags: 'semilla,maiz,agricultura', quantity: 400 },
    ]},
    { email: 'supplier+agricorp@proveedorconecta.ni', name: 'AGRICORP', businessName: 'AGRICORP', description: 'Sémola de arroz y productos arroceros premium.', category: 'Alimentos y Bebidas', phone: '+505 2255 6600', address: 'Managua, Nicaragua', lat: 12.135, lng: -86.255, products: [
      { title: 'Arroz Sémola 5lb', price: 75, category: 'Alimentos y Bebidas', tags: 'arroz,semola,alimento', quantity: 2000 },
      { title: 'Arroz Premium 5lb', price: 90, category: 'Alimentos y Bebidas', tags: 'arroz,premium,alimento', quantity: 1500 },
      { title: 'Arroz Integral 2lb', price: 65, category: 'Alimentos y Bebidas', tags: 'arroz,integral,saludable', quantity: 800 },
    ]},
    { email: 'supplier+disagro@proveedorconecta.ni', name: 'Disagro', businessName: 'Disagro Nicaragua', description: 'Insumos agrícolas, fungicidas, insecticidas y fertilizantes.', category: 'Agricultura y Ganadería', phone: '+505 2276 8800', address: 'Managua, Nicaragua', lat: 12.125, lng: -86.245, products: [
      { title: 'Fungicida 1L', price: 480, category: 'Agricultura y Ganadería', tags: 'fungicida,agricultura,cultivo', quantity: 300 },
      { title: 'Insecticida 500ml', price: 350, category: 'Agricultura y Ganadería', tags: 'insecticida,plagas,agricultura', quantity: 400 },
      { title: 'Fertilizante Foliar 1L', price: 280, category: 'Agricultura y Ganadería', tags: 'fertilizante,foliar,agricultura', quantity: 500 },
    ]},
    { email: 'supplier+brenntag@proveedorconecta.ni', name: 'Brenntag Nicaragua', businessName: 'Brenntag Nicaragua', description: 'Distribuidor de productos químicos industriales.', category: 'Otros', phone: '+505 2278 9900', address: 'Managua, Nicaragua', lat: 12.115, lng: -86.235, products: [
      { title: 'Ácido Clorhídrico 5L', price: 550, category: 'Otros', tags: 'acido,clorhidrico,quimico', quantity: 100 },
      { title: 'Sosa Cáustica 25kg', price: 380, category: 'Otros', tags: 'sosa,caustica,quimico', quantity: 150 },
      { title: 'Solvente Industrial 4L', price: 420, category: 'Otros', tags: 'solvente,industrial,quimico', quantity: 200 },
    ]},
    { email: 'supplier+casapellas@proveedorconecta.ni', name: 'Casa Pellas', businessName: 'Casa Pellas', description: 'Vehículos, repuestos y accesorios automotrices.', category: 'Transporte y Logística', phone: '+505 2255 3300', address: 'Managua, Nicaragua', lat: 12.145, lng: -86.265, products: [
      { title: 'Llanta Michelin 185/65', price: 3200, category: 'Transporte y Logística', tags: 'llanta,michelin,automotriz', quantity: 50 },
      { title: 'Batería 12V 60Ah', price: 2800, category: 'Transporte y Logística', tags: 'bateria,automotriz,12v', quantity: 30 },
      { title: 'Aceite Motor 5W-30 4L', price: 750, category: 'Transporte y Logística', tags: 'aceite,motor,5w30', quantity: 200 },
    ]},
    { email: 'supplier+petrop@proveedorconecta.ni', name: 'Grupo Petrop', businessName: 'Grupo Petrop', description: 'Materias primas plásticas y resinas para la industria.', category: 'Otros', phone: '+505 2278 7700', address: 'Managua, Nicaragua', lat: 12.105, lng: -86.225, products: [
      { title: 'Pellets PE 25kg', price: 580, category: 'Otros', tags: 'pellets,pe,plastico', quantity: 300 },
      { title: 'Pellets PP 25kg', price: 620, category: 'Otros', tags: 'pellets,pp,plastico', quantity: 250 },
      { title: 'Resina PVC 25kg', price: 550, category: 'Otros', tags: 'resina,pvc,plastico', quantity: 200 },
    ]},
    { email: 'supplier+atlantic@proveedorconecta.ni', name: 'Exportadora Atlantic', businessName: 'Exportadora Atlantic', description: 'Exportación de café verde, maní y ajonjolí.', category: 'Agricultura y Ganadería', phone: '+505 2255 8800', address: 'Managua, Nicaragua', lat: 12.095, lng: -86.215, products: [
      { title: 'Café Green Bean 60kg', price: 4500, category: 'Agricultura y Ganadería', tags: 'cafe,green bean,exportacion', quantity: 50 },
      { title: 'Mani Crudo 25kg', price: 1200, category: 'Agricultura y Ganadería', tags: 'mani,crudo,exportacion', quantity: 100 },
      { title: 'Ajonjolí 25kg', price: 1800, category: 'Agricultura y Ganadería', tags: 'ajonjoli,sesamo,exportacion', quantity: 80 },
    ]},
    { email: 'supplier+santodomingo@proveedorconecta.ni', name: 'Empaques Santo Domingo', businessName: 'Empaques Santo Domingo', description: 'Cajas de cartón, bolsas de papel y etiquetas adhesivas.', category: 'Otros', phone: '+505 2278 1100', address: 'Managua, Nicaragua', lat: 12.085, lng: -86.205, products: [
      { title: 'Caja Cartón 30x30', price: 35, category: 'Otros', tags: 'caja,carton,empaque', quantity: 5000 },
      { title: 'Bolsa Papel 100u', price: 180, category: 'Otros', tags: 'bolsa,papel,empaque', quantity: 2000 },
      { title: 'Etiqueta Adhesiva 1000u', price: 250, category: 'Otros', tags: 'etiqueta,adhesiva,empaque', quantity: 1000 },
    ]},
    { email: 'supplier+hanter@proveedorconecta.ni', name: 'Hanter Metals', businessName: 'Hanter Metals', description: 'Metales industriales: aluminio, acero, cobre.', category: 'Construcción y Ferretería', phone: '+505 2278 2200', address: 'Managua, Nicaragua', lat: 12.075, lng: -86.195, products: [
      { title: 'Plancha Aluminio 1m²', price: 890, category: 'Construcción y Ferretería', tags: 'aluminio,plancha,metal', quantity: 150 },
      { title: 'Barra Acero 6m', price: 520, category: 'Construcción y Ferretería', tags: 'barra,acero,metal', quantity: 300 },
      { title: 'Tubo Cobre 3m', price: 780, category: 'Construcción y Ferretería', tags: 'tubo,cobre,metal', quantity: 200 },
    ]},
    { email: 'supplier+nicatecno@proveedorconecta.ni', name: 'Nicatecno', businessName: 'Nicatecno', description: 'Equipos de red y conectividad para empresas.', category: 'Tecnología y Electrónica', phone: '+505 2278 5500', address: 'Managua, Nicaragua', lat: 12.065, lng: -86.185, products: [
      { title: 'Router WiFi', price: 1800, category: 'Tecnología y Electrónica', tags: 'router,wifi,redes', quantity: 100 },
      { title: 'Switch 8 Puertos', price: 950, category: 'Tecnología y Electrónica', tags: 'switch,puertos,redes', quantity: 80 },
      { title: 'Cable UTP 100m', price: 650, category: 'Tecnología y Electrónica', tags: 'cable,utp,redes', quantity: 200 },
    ]},
    { email: 'supplier+nicatech@proveedorconecta.ni', name: 'NicaTech', businessName: 'NicaTech Soluciones', description: 'Soluciones tecnológicas con energía solar.', category: 'Tecnología y Electrónica', phone: '+505 2278 6600', address: 'Managua, Nicaragua', lat: 12.055, lng: -86.175, products: [
      { title: 'Panel Solar 100W', price: 3500, category: 'Energía y Combustible', tags: 'panel,solar,energia', quantity: 50 },
      { title: 'Batería Litio 12V', price: 4200, category: 'Energía y Combustible', tags: 'bateria,litio,solar', quantity: 30 },
      { title: 'Controlador Carga', price: 1200, category: 'Energía y Combustible', tags: 'controlador,carga,solar', quantity: 60 },
    ]},
    { email: 'supplier+cafesoluble@proveedorconecta.ni', name: 'Café Soluble', businessName: 'Café Soluble Exportadora', description: 'Café soluble, molido y tostado de Matagalpa.', category: 'Alimentos y Bebidas', phone: '+505 2772 3300', address: 'Matagalpa, Nicaragua', lat: 12.9256, lng: -85.9175, products: [
      { title: 'Café Instantáneo 200g', price: 85, category: 'Alimentos y Bebidas', tags: 'cafe,instantaneo,soluble', quantity: 1000 },
      { title: 'Café Molido 500g', price: 120, category: 'Alimentos y Bebidas', tags: 'cafe,molido,premium', quantity: 800 },
      { title: 'Café Tostado 1kg', price: 280, category: 'Alimentos y Bebidas', tags: 'cafe,tostado,grano', quantity: 500 },
    ]},
  ]

  console.log('🏢 Creating 20+ verified Nicaraguan suppliers...')
  let totalProducts = 0

  for (const supplier of suppliers) {
    const sId = generateCuid()
    await client.execute({
      sql: `INSERT INTO "User" (id, email, name, password, role, phone, address, avatar, "isVerified", "emailVerified", balance, "createdAt", "updatedAt")
            VALUES (?, ?, ?, ?, 'SELLER', ?, ?, '', 1, 1, 50000, datetime('now'), datetime('now'))`,
      args: [sId, supplier.email, supplier.name, passwordHash, supplier.phone, supplier.address]
    })

    await client.execute({
      sql: `INSERT INTO "BusinessProfile" (id, "userId", "businessName", description, category, address, latitude, longitude, phone, hours, "paymentMethods", "coverImage", logo, "createdAt", "updatedAt")
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Lun-Vie 8am-5pm, Sáb 8am-12pm', '["BANPRO","BAC","BILLETERA"]', '', '', datetime('now'), datetime('now'))`,
      args: [generateCuid(), sId, supplier.businessName, supplier.description, supplier.category, supplier.address, supplier.lat, supplier.lng, supplier.phone]
    })

    for (const product of supplier.products) {
      await client.execute({
        sql: `INSERT INTO "Product" (id, "sellerId", title, description, price, category, tags, quantity, status, images, "videoUrl", "isFeatured", "publishedAt", "createdAt", "updatedAt")
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', '[]', '', 0, datetime('now'), datetime('now'), datetime('now'))`,
        args: [generateCuid(), sId, product.title, `${product.title} - Proveedor: ${supplier.businessName}. ${supplier.description}`, product.price, product.category, product.tags, product.quantity]
      })
      totalProducts++
    }
    console.log(`  ✅ ${supplier.businessName} (${supplier.products.length} productos)`)
  }

  // ─── Original Demo Products ──────────────────────────────────────
  const demoProducts = [
    { sellerId: seller1Id, title: 'Cement Portland 50kg', desc: 'Cemento Portland de alta resistencia.', price: 320, category: 'Construcción y Ferretería', tags: 'cemento,construccion,material', qty: 500, images: '["/uploads/products/cemento.png"]' },
    { sellerId: seller1Id, title: 'Varilla Corrugada 1/2" x 6m', desc: 'Varilla corrugada de acero grado 60.', price: 145, category: 'Construcción y Ferretería', tags: 'varilla,acero,construccion', qty: 1000, images: '["/uploads/products/varilla.png"]', discountPrice: 125, discountPercent: 14 },
    { sellerId: seller1Id, title: 'Taladro Inalámbrico 20V', desc: 'Taladro inalámbrico profesional con batería de litio.', price: 2850, category: 'Construcción y Ferretería', tags: 'taladro,herramienta,inalambrico', qty: 50, images: '["/uploads/products/taladro.png"]' },
    { sellerId: seller1Id, title: 'Pintura Vinílica 1 Galón', desc: 'Pintura vinílica de alta calidad, cobertura extra.', price: 280, category: 'Construcción y Ferretería', tags: 'pintura,vinilica,construccion', qty: 100, images: '["/uploads/products/pintura.png"]' },
    { sellerId: seller1Id, title: 'Tubo PVC 4" x 3m', desc: 'Tubo PVC para conducción de agua, presión 10 BAR.', price: 165, category: 'Construcción y Ferretería', tags: 'tubo,pvc,plomeria', qty: 200, images: '["/uploads/products/tubos.png"]' },
    { sellerId: seller2Id, title: 'Fertilizante NPK 15-15-15 (qq)', desc: 'Fertilizante granulado balanceado para todo tipo de cultivos.', price: 850, category: 'Agricultura y Ganadería', tags: 'fertilizante,agricultura,npk', qty: 200, images: '["/uploads/products/fertilizante.png"]', discountPrice: 780, discountPercent: 8 },
    { sellerId: seller2Id, title: 'Semilla de Maíz Híbrido (lb)', desc: 'Semilla de maíz híbrido de alto rendimiento.', price: 95, category: 'Agricultura y Ganadería', tags: 'semilla,maiz,agricultura', qty: 500, images: '["/uploads/products/semillas.png"]' },
    { sellerId: seller2Id, title: 'Insecticida Agrícola (lt)', desc: 'Insecticida sistémico de amplio espectro.', price: 350, category: 'Agricultura y Ganadería', tags: 'insecticida,plagas,agricultura', qty: 150, images: '["/uploads/products/pesticida.png"]' },
    { sellerId: seller2Id, title: 'Tractor Agrícola 85HP', desc: 'Tractor compacto 85HP, tracción 4x2, hidráulico.', price: 385000, category: 'Agricultura y Ganadería', tags: 'tractor,maquinaria,agricultura', qty: 3, images: '["/uploads/products/tractor.png"]' },
    { sellerId: seller3Id, title: 'Laptop Lenovo IdeaPad 15"', desc: 'Intel Core i5-1235U, 8GB RAM, 256GB SSD, FHD.', price: 12500, category: 'Tecnología y Electrónica', tags: 'laptop,computadora,lenovo', qty: 20, images: '["/uploads/products/laptop.png"]', discountPrice: 10900, discountPercent: 13 },
    { sellerId: seller3Id, title: 'Router WiFi 6 TP-Link', desc: 'Router WiFi 6 doble banda, hasta 1800 Mbps.', price: 2100, category: 'Tecnología y Electrónica', tags: 'router,wifi,redes', qty: 35, images: '["/uploads/products/router.png"]' },
    { sellerId: seller3Id, title: 'Cámara de Seguridad IP 4K', desc: 'Cámara IP POE 4K, visión nocturna 30m.', price: 2800, category: 'Tecnología y Electrónica', tags: 'camara,seguridad,ip', qty: 40, images: '["/uploads/products/camara.png"]' },
    { sellerId: seller3Id, title: 'Impresora Multifuncional HP', desc: 'Impresora, escáner y copiadora láser. WiFi.', price: 5800, category: 'Tecnología y Electrónica', tags: 'impresora,hp,oficina', qty: 15, images: '["/uploads/products/impresora.png"]', discountPrice: 5200, discountPercent: 10 },
  ]

  for (const p of demoProducts) {
    await client.execute({
      sql: `INSERT INTO "Product" (id, "sellerId", title, description, price, "discountPrice", "discountPercent", category, tags, quantity, status, images, "videoUrl", "isFeatured", "publishedAt", "createdAt", "updatedAt")
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, '', 0, datetime('now'), datetime('now'), datetime('now'))`,
      args: [generateCuid(), p.sellerId, p.title, p.desc, p.price, p.discountPrice || null, p.discountPercent || null, p.category, p.tags, p.qty, p.images]
    })
    totalProducts++
  }
  console.log(`  ✅ ${demoProducts.length} demo products added`)

  // ─── Notifications ───────────────────────────────────────────────
  await client.execute({
    sql: `INSERT INTO "Notification" (id, "userId", type, title, message, "isRead", link, "createdAt")
          VALUES (?, ?, 'WELCOME', '¡Bienvenido a ProveedorConecta!', 'Explora miles de productos de proveedores nicaragüenses.', 0, '', datetime('now'))`,
    args: [generateCuid(), buyerId]
  })
  await client.execute({
    sql: `INSERT INTO "Notification" (id, "userId", type, title, message, "isRead", link, "createdAt")
          VALUES (?, ?, 'WELCOME', '¡Tu tienda está lista!', 'Comienza a publicar productos y llegar a más clientes.', 0, '', datetime('now'))`,
    args: [generateCuid(), seller1Id]
  })

  // ─── Verify ──────────────────────────────────────────────────────
  const userCount = await client.execute('SELECT COUNT(*) as count FROM "User"')
  const productCount = await client.execute('SELECT COUNT(*) as count FROM "Product"')
  const bpCount = await client.execute('SELECT COUNT(*) as count FROM "BusinessProfile"')
  const notifCount = await client.execute('SELECT COUNT(*) as count FROM "Notification"')

  console.log('\n📊 ═══════════════════════════════════════')
  console.log('   TURSO DATABASE SEEDED SUCCESSFULLY!')
  console.log('   ═══════════════════════════════════════')
  console.log(`   Users:            ${userCount.rows[0].count}`)
  console.log(`   Products:         ${productCount.rows[0].count}`)
  console.log(`   Business Profiles: ${bpCount.rows[0].count}`)
  console.log(`   Notifications:    ${notifCount.rows[0].count}`)
  console.log('   ═══════════════════════════════════════')
  console.log('\n📧 Demo accounts:')
  console.log('   Admin:  rey7214935@gmail.com / Rey7214935')
  console.log('   Seller: ferreteria@demo.ni / demo123')
  console.log('   Seller: agroserv@demo.ni / demo123')
  console.log('   Seller: tech@demo.ni / demo123')
  console.log('   Buyer:  comprador@demo.ni / demo123')
  console.log('   All suppliers: supplier+XXX@proveedorconecta.ni / supplier123')

  client.close()
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
