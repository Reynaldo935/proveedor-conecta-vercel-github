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
  await db.reviewVote.deleteMany()
  await db.review.deleteMany()
  await db.pointHistory.deleteMany()
  await db.loyaltyPoint.deleteMany()
  await db.calendarEvent.deleteMany()
  await db.appointment.deleteMany()
  await db.product.deleteMany()
  await db.businessProfile.deleteMany()
  await db.verificationToken.deleteMany()
  await db.user.deleteMany()

  const passwordHash = await bcrypt.hash('supplier123', 12)
  const demoPasswordHash = await bcrypt.hash('demo123', 12)
  const adminPasswordHash = await bcrypt.hash('admin123', 12)

  // ─── Admin User ────────────────────────────────────────────────────────
  const admin = await db.user.create({
    data: {
      email: 'rey7214935@gmail.com',
      name: 'Reynaldo Admin',
      password: adminPasswordHash,
      role: 'ADMIN',
      phone: '8999-0000',
      address: 'Managua, Nicaragua',
      avatar: '',
      isVerified: true,
      emailVerified: true,
      helperRole: 'FULLSTACK',
      balance: 100000,
    },
  })

  await db.businessProfile.create({
    data: {
      userId: admin.id,
      businessName: 'ProveedorConecta Nicaragua - Admin',
      description: 'Administrador principal de la plataforma ProveedorConecta Nicaragua',
      category: 'Tecnología y Electrónica',
      address: 'Managua, Nicaragua',
      latitude: 12.1364,
      longitude: -86.2514,
      phone: '8999-0000',
      paymentMethods: JSON.stringify(['PAYPAL', 'BANPRO', 'BAC', 'LAFISE', 'BILLETERA']),
      logo: '',
      coverImage: '',
    },
  })

  // ─── Original Demo Sellers ─────────────────────────────────────────────
  const seller1 = await db.user.create({
    data: {
      email: 'ferreteria@demo.ni',
      name: 'Carlos Hernández',
      password: demoPasswordHash,
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
      password: demoPasswordHash,
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
      password: demoPasswordHash,
      role: 'SELLER',
      phone: '8666-9012',
      address: 'Granada, Nicaragua',
      avatar: '',
      isVerified: true,
      emailVerified: true,
    },
  })

  // Demo buyer
  const buyer = await db.user.create({
    data: {
      email: 'comprador@demo.ni',
      name: 'Ana Torres',
      password: demoPasswordHash,
      role: 'BUYER',
      phone: '8555-3456',
      address: 'Masaya, Nicaragua',
      avatar: '',
      isVerified: true,
      emailVerified: true,
    },
  })

  // ─── Original Demo Business Profiles ───────────────────────────────────
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
      coverImage: '/uploads/products/cemento.png',
      logo: '',
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

  // ─── 20+ Verified Nicaraguan Suppliers ─────────────────────────────────
  const suppliers = [
    {
      email: 'supplier+ingenio@proveedorconecta.ni',
      name: 'Ingenio San Antonio',
      businessName: 'Ingenio San Antonio',
      description: 'Productor líder de azúcar y bioetanol en Nicaragua. https://isa1890.com',
      category: 'Alimentos y Bebidas',
      phone: '+505 2315 7000',
      address: 'Chinandega, Nicaragua',
      city: 'Chinandega',
      latitude: 13.2878,
      longitude: -87.1444,
      products: [
        { title: 'Azúcar Morena 5lb', price: 85, category: 'Alimentos y Bebidas', tags: 'azucar,morena,alimento', quantity: 1000 },
        { title: 'Alcohol Etílico 1L', price: 200, category: 'Alimentos y Bebidas', tags: 'alcohol,etilico,industrial', quantity: 500 },
        { title: 'Bioetanol Galón', price: 380, category: 'Energía y Combustible', tags: 'bioetanol,combustible,galon', quantity: 300 },
      ],
    },
    {
      email: 'supplier+flordecana@proveedorconecta.ni',
      name: 'Flor de Caña',
      businessName: 'Flor de Caña',
      description: 'Ron premium nicaragüense reconocido mundialmente. https://www.flordecana.com/es',
      category: 'Alimentos y Bebidas',
      phone: '+505 2255 3300',
      address: 'Chinandega, Nicaragua',
      city: 'Chinandega',
      latitude: 12.6,
      longitude: -87.15,
      products: [
        { title: 'Ron 7 Años 750ml', price: 580, category: 'Alimentos y Bebidas', tags: 'ron,premium,7anos', quantity: 200 },
        { title: 'Ron 12 Años 750ml', price: 950, category: 'Alimentos y Bebidas', tags: 'ron,premium,12anos', quantity: 150 },
        { title: 'Ron 18 Años 750ml', price: 1200, category: 'Alimentos y Bebidas', tags: 'ron,premium,18anos,reserva', quantity: 80 },
      ],
    },
    {
      email: 'supplier+lacuracao@proveedorconecta.ni',
      name: 'La Curacao Nicaragua',
      businessName: 'La Curacao Nicaragua',
      description: 'Electrodomésticos, tecnología y muebles para el hogar nicaragüense. https://www.lacuracaonline.com/nicaragua/',
      category: 'Tecnología y Electrónica',
      phone: '+505 2782 4191',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.1364,
      longitude: -86.2514,
      products: [
        { title: 'Refrigeradora Mabe 14\'', price: 15999, category: 'Hogar y Muebles', tags: 'refrigeradora,mabe,electrodomestico', quantity: 25 },
        { title: 'Lavadora Samsung 16kg', price: 18500, category: 'Hogar y Muebles', tags: 'lavadora,samsung,electrodomestico', quantity: 15 },
        { title: 'Smart TV LG 55"', price: 22999, category: 'Tecnología y Electrónica', tags: 'smartv,lg,pantalla,televisor', quantity: 10 },
      ],
    },
    {
      email: 'supplier+pollotiptop@proveedorconecta.ni',
      name: 'Pollo Tip Top (Deli Pollo)',
      businessName: 'Deli Pollo - Pollo Tip Top',
      description: 'Alimentos avícolas de la más alta calidad. https://www.delipollo.com',
      category: 'Alimentos y Bebidas',
      phone: '+505 2278 2519',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.15,
      longitude: -86.27,
      products: [
        { title: 'Pollo Entero', price: 185, category: 'Alimentos y Bebidas', tags: 'pollo,entero,aves', quantity: 500 },
        { title: 'Combo Familiar 8 piezas', price: 420, category: 'Alimentos y Bebidas', tags: 'pollo,combo,familiar,piezas', quantity: 300 },
        { title: 'Canasta de Pollo', price: 280, category: 'Alimentos y Bebidas', tags: 'pollo,canasta,aves', quantity: 200 },
      ],
    },
    {
      email: 'supplier+ferromax@proveedorconecta.ni',
      name: 'Grupo Ferromax',
      businessName: 'Grupo Ferromax',
      description: 'Materiales de construcción y acero para proyectos grandes y pequeños.',
      category: 'Construcción y Ferretería',
      phone: '+505 2255 4400',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.12,
      longitude: -86.25,
      products: [
        { title: 'Varilla Corrugada 1/2"', price: 145, category: 'Construcción y Ferretería', tags: 'varilla,corrugada,acero,construccion', quantity: 2000 },
        { title: 'Lámina Zinc 3m', price: 380, category: 'Construcción y Ferretería', tags: 'lamina,zinc,techo,construccion', quantity: 800 },
        { title: 'Tubo Estructural 4"', price: 650, category: 'Construcción y Ferretería', tags: 'tubo,estructural,acero,construccion', quantity: 400 },
      ],
    },
    {
      email: 'supplier+ccn@proveedorconecta.ni',
      name: 'Compañía Cervecera de Nicaragua',
      businessName: 'CCN - Cervecería Nicaragua',
      description: 'Cerveza Toña, Agua Viva y más bebidas nacionales. https://www.ccn.com.ni',
      category: 'Alimentos y Bebidas',
      phone: '+505 2255 5500',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.14,
      longitude: -86.26,
      products: [
        { title: 'Cerveza Toña 6-pack', price: 150, category: 'Alimentos y Bebidas', tags: 'cerveza,tona,pack,bebida', quantity: 1000 },
        { title: 'Agua Viva 1 Galón', price: 45, category: 'Alimentos y Bebidas', tags: 'agua,galon,bebida,potable', quantity: 2000 },
        { title: 'Ron Plata 750ml', price: 220, category: 'Alimentos y Bebidas', tags: 'ron,plata,bebida,licor', quantity: 500 },
      ],
    },
    {
      email: 'supplier+sanmartin@proveedorconecta.ni',
      name: 'Plásticos San Martín',
      businessName: 'Plásticos San Martín',
      description: 'Empaques plásticos industriales y domésticos desde Granada. +505 2552 2188',
      category: 'Otros',
      phone: '+505 2552 2188',
      address: 'Granada, Nicaragua',
      city: 'Granada',
      latitude: 11.9344,
      longitude: -85.956,
      products: [
        { title: 'Bolsas Plásticas 100u', price: 120, category: 'Otros', tags: 'bolsas,plasticas,empaques', quantity: 800 },
        { title: 'Contenedor Plástico 5L', price: 85, category: 'Otros', tags: 'contenedor,plastico,almacen', quantity: 500 },
        { title: 'Rollo Película', price: 250, category: 'Otros', tags: 'rollo,pelicula,empaque,industrial', quantity: 300 },
      ],
    },
    {
      email: 'supplier+puratos@proveedorconecta.ni',
      name: 'Puratos Nicaragua',
      businessName: 'Puratos Nicaragua',
      description: 'Insumos profesionales para panificación, pastelería y chocolate.',
      category: 'Alimentos y Bebidas',
      phone: '+505 2278 3300',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.13,
      longitude: -86.24,
      products: [
        { title: 'Harina Especial 25kg', price: 890, category: 'Alimentos y Bebidas', tags: 'harina,especial,panificacion', quantity: 200 },
        { title: 'Mejorador Panificación 5kg', price: 450, category: 'Alimentos y Bebidas', tags: 'mejorador,panificacion,insumo', quantity: 150 },
        { title: 'Levadura Seca 500g', price: 185, category: 'Alimentos y Bebidas', tags: 'levadura,seca,panificacion', quantity: 400 },
      ],
    },
    {
      email: 'supplier+cisaagro@proveedorconecta.ni',
      name: 'CISA AGRO',
      businessName: 'CISA AGRO',
      description: 'Insumos agrícolas de calidad para el campo nicaragüense. +505 2276 8710',
      category: 'Agricultura y Ganadería',
      phone: '+505 2276 8710',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.11,
      longitude: -86.23,
      products: [
        { title: 'Fertilizante 15-15-15 50kg', price: 680, category: 'Agricultura y Ganadería', tags: 'fertilizante,npk,agricultura', quantity: 300 },
        { title: 'Herbicida Glifosato 1L', price: 320, category: 'Agricultura y Ganadería', tags: 'herbicida,glifosato,agricultura', quantity: 500 },
        { title: 'Semilla Maíz 5kg', price: 450, category: 'Agricultura y Ganadería', tags: 'semilla,maiz,agricultura,hibrido', quantity: 400 },
      ],
    },
    {
      email: 'supplier+agricorp@proveedorconecta.ni',
      name: 'AGRICORP',
      businessName: 'AGRICORP',
      description: 'Sémola de arroz y productos arroceros premium de Nicaragua. https://agricorp.com',
      category: 'Alimentos y Bebidas',
      phone: '+505 2255 6600',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.135,
      longitude: -86.255,
      products: [
        { title: 'Arroz Sémola 5lb', price: 75, category: 'Alimentos y Bebidas', tags: 'arroz,semola,alimento,basico', quantity: 2000 },
        { title: 'Arroz Premium 5lb', price: 90, category: 'Alimentos y Bebidas', tags: 'arroz,premium,alimento', quantity: 1500 },
        { title: 'Arroz Integral 2lb', price: 65, category: 'Alimentos y Bebidas', tags: 'arroz,integral,saludable', quantity: 800 },
      ],
    },
    {
      email: 'supplier+disagro@proveedorconecta.ni',
      name: 'Disagro',
      businessName: 'Disagro Nicaragua',
      description: 'Insumos agrícolas, fungicidas, insecticidas y fertilizantes. https://disagro.com',
      category: 'Agricultura y Ganadería',
      phone: '+505 2276 8800',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.125,
      longitude: -86.245,
      products: [
        { title: 'Fungicida 1L', price: 480, category: 'Agricultura y Ganadería', tags: 'fungicida,agricultura,cultivo', quantity: 300 },
        { title: 'Insecticida 500ml', price: 350, category: 'Agricultura y Ganadería', tags: 'insecticida,plagas,agricultura', quantity: 400 },
        { title: 'Fertilizante Foliar 1L', price: 280, category: 'Agricultura y Ganadería', tags: 'fertilizante,foliar,agricultura', quantity: 500 },
      ],
    },
    {
      email: 'supplier+brenntag@proveedorconecta.ni',
      name: 'Brenntag Nicaragua',
      businessName: 'Brenntag Nicaragua',
      description: 'Distribuidor de productos químicos industriales y especiales. https://brenntag.com',
      category: 'Otros',
      phone: '+505 2278 9900',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.115,
      longitude: -86.235,
      products: [
        { title: 'Ácido Clorhídrico 5L', price: 550, category: 'Otros', tags: 'acido,clorhidrico,quimico,industrial', quantity: 100 },
        { title: 'Sosa Cáustica 25kg', price: 380, category: 'Otros', tags: 'sosa,caustica,quimico,industrial', quantity: 150 },
        { title: 'Solvente Industrial 4L', price: 420, category: 'Otros', tags: 'solvente,industrial,quimico', quantity: 200 },
      ],
    },
    {
      email: 'supplier+casapellas@proveedorconecta.ni',
      name: 'Casa Pellas',
      businessName: 'Casa Pellas',
      description: 'Vehículos, repuestos y accesorios automotrices. https://grupocasapellas.com',
      category: 'Transporte y Logística',
      phone: '+505 2255 3300',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.145,
      longitude: -86.265,
      products: [
        { title: 'Llanta Michelin 185/65', price: 3200, category: 'Transporte y Logística', tags: 'llanta,michelin,automotriz', quantity: 50 },
        { title: 'Batería 12V 60Ah', price: 2800, category: 'Transporte y Logística', tags: 'bateria,automotriz,12v', quantity: 30 },
        { title: 'Aceite Motor 5W-30 4L', price: 750, category: 'Transporte y Logística', tags: 'aceite,motor,5w30,automotriz', quantity: 200 },
      ],
    },
    {
      email: 'supplier+petrop@proveedorconecta.ni',
      name: 'Grupo Petrop',
      businessName: 'Grupo Petrop',
      description: 'Materias primas plásticas y resinas para la industria. https://grupopetrop.com',
      category: 'Otros',
      phone: '+505 2278 7700',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.105,
      longitude: -86.225,
      products: [
        { title: 'Pellets PE 25kg', price: 580, category: 'Otros', tags: 'pellets,pe,plastico,materia prima', quantity: 300 },
        { title: 'Pellets PP 25kg', price: 620, category: 'Otros', tags: 'pellets,pp,plastico,materia prima', quantity: 250 },
        { title: 'Resina PVC 25kg', price: 550, category: 'Otros', tags: 'resina,pvc,plastico,industrial', quantity: 200 },
      ],
    },
    {
      email: 'supplier+atlantic@proveedorconecta.ni',
      name: 'Exportadora Atlantic',
      businessName: 'Exportadora Atlantic',
      description: 'Exportación de café verde, maní y ajonjolí nicaragüense.',
      category: 'Agricultura y Ganadería',
      phone: '+505 2255 8800',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.095,
      longitude: -86.215,
      products: [
        { title: 'Café Green Bean 60kg', price: 4500, category: 'Agricultura y Ganadería', tags: 'cafe,green bean,exportacion', quantity: 50 },
        { title: 'Mani Crudo 25kg', price: 1200, category: 'Agricultura y Ganadería', tags: 'mani,crudo,exportacion', quantity: 100 },
        { title: 'Ajonjolí 25kg', price: 1800, category: 'Agricultura y Ganadería', tags: 'ajonjoli,sesamo,exportacion', quantity: 80 },
      ],
    },
    {
      email: 'supplier+santodomingo@proveedorconecta.ni',
      name: 'Empaques Santo Domingo',
      businessName: 'Empaques Santo Domingo',
      description: 'Cajas de cartón, bolsas de papel y etiquetas adhesivas para negocios.',
      category: 'Otros',
      phone: '+505 2278 1100',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.085,
      longitude: -86.205,
      products: [
        { title: 'Caja Cartón 30x30', price: 35, category: 'Otros', tags: 'caja,carton,empaque', quantity: 5000 },
        { title: 'Bolsa Papel 100u', price: 180, category: 'Otros', tags: 'bolsa,papel,empaque,ecologico', quantity: 2000 },
        { title: 'Etiqueta Adhesiva 1000u', price: 250, category: 'Otros', tags: 'etiqueta,adhesiva,empaque', quantity: 1000 },
      ],
    },
    {
      email: 'supplier+hanter@proveedorconecta.ni',
      name: 'Hanter Metals',
      businessName: 'Hanter Metals',
      description: 'Metales industriales: aluminio, acero, cobre y más.',
      category: 'Construcción y Ferretería',
      phone: '+505 2278 2200',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.075,
      longitude: -86.195,
      products: [
        { title: 'Plancha Aluminio 1m²', price: 890, category: 'Construcción y Ferretería', tags: 'aluminio,plancha,metal', quantity: 150 },
        { title: 'Barra Acero 6m', price: 520, category: 'Construcción y Ferretería', tags: 'barra,acero,metal,construccion', quantity: 300 },
        { title: 'Tubo Cobre 3m', price: 780, category: 'Construcción y Ferretería', tags: 'tubo,cobre,metal,plomeria', quantity: 200 },
      ],
    },
    {
      email: 'supplier+nicatecno@proveedorconecta.ni',
      name: 'Nicatecno',
      businessName: 'Nicatecno',
      description: 'Equipos de red y conectividad para empresas y hogares nicaragüenses.',
      category: 'Tecnología y Electrónica',
      phone: '+505 2278 5500',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.065,
      longitude: -86.185,
      products: [
        { title: 'Router WiFi', price: 1800, category: 'Tecnología y Electrónica', tags: 'router,wifi,redes,internet', quantity: 100 },
        { title: 'Switch 8 Puertos', price: 950, category: 'Tecnología y Electrónica', tags: 'switch,puertos,redes', quantity: 80 },
        { title: 'Cable UTP 100m', price: 650, category: 'Tecnología y Electrónica', tags: 'cable,utp,redes,conectividad', quantity: 200 },
      ],
    },
    {
      email: 'supplier+nicatech@proveedorconecta.ni',
      name: 'NicaTech',
      businessName: 'NicaTech Soluciones',
      description: 'Soluciones tecnológicas con energía solar y componentes electrónicos.',
      category: 'Tecnología y Electrónica',
      phone: '+505 2278 6600',
      address: 'Managua, Nicaragua',
      city: 'Managua',
      latitude: 12.055,
      longitude: -86.175,
      products: [
        { title: 'Panel Solar 100W', price: 3500, category: 'Energía y Combustible', tags: 'panel,solar,energia,renovable', quantity: 50 },
        { title: 'Batería Litio 12V', price: 4200, category: 'Energía y Combustible', tags: 'bateria,litio,solar,energia', quantity: 30 },
        { title: 'Controlador Carga', price: 1200, category: 'Energía y Combustible', tags: 'controlador,carga,solar,energia', quantity: 60 },
      ],
    },
    {
      email: 'supplier+cafesoluble@proveedorconecta.ni',
      name: 'Café Soluble Exportadora',
      businessName: 'Café Soluble Exportadora',
      description: 'Café soluble, molido y tostado de las montañas de Matagalpa.',
      category: 'Alimentos y Bebidas',
      phone: '+505 2772 3300',
      address: 'Matagalpa, Nicaragua',
      city: 'Matagalpa',
      latitude: 12.9256,
      longitude: -85.9175,
      products: [
        { title: 'Café Instantáneo 200g', price: 85, category: 'Alimentos y Bebidas', tags: 'cafe,instantaneo,soluble', quantity: 1000 },
        { title: 'Café Molido 500g', price: 120, category: 'Alimentos y Bebidas', tags: 'cafe,molido,premium', quantity: 800 },
        { title: 'Café Tostado 1kg', price: 280, category: 'Alimentos y Bebidas', tags: 'cafe,tostado,grano,premium', quantity: 500 },
      ],
    },
  ]

  // ─── Create Suppliers ──────────────────────────────────────────────────
  console.log('🏢 Creating 20+ verified Nicaraguan suppliers...')

  for (const supplier of suppliers) {
    const sellerUser = await db.user.create({
      data: {
        email: supplier.email,
        name: supplier.name,
        password: passwordHash,
        role: 'SELLER',
        phone: supplier.phone,
        address: supplier.address,
        avatar: '',
        isVerified: true,
        emailVerified: true,
      },
    })

    await db.businessProfile.create({
      data: {
        userId: sellerUser.id,
        businessName: supplier.businessName,
        description: supplier.description,
        category: supplier.category,
        address: supplier.address,
        latitude: supplier.latitude,
        longitude: supplier.longitude,
        phone: supplier.phone,
        hours: 'Lun-Vie 8am-5pm, Sáb 8am-12pm',
        paymentMethods: JSON.stringify(['BANPRO', 'BAC', 'BILLETERA']),
        logo: '',
        coverImage: '',
      },
    })

    for (const product of supplier.products) {
      await db.product.create({
        data: {
          sellerId: sellerUser.id,
          title: product.title,
          description: `${product.title} - Proveedor: ${supplier.businessName}. ${supplier.description}`,
          price: product.price,
          category: product.category,
          tags: product.tags,
          quantity: product.quantity,
          status: 'ACTIVE',
          images: JSON.stringify([]),
          videoUrl: '',
          isFeatured: false,
        },
      })
    }

    console.log(`  ✅ ${supplier.businessName} (${supplier.products.length} productos)`)
  }

  // ─── Original Demo Products ────────────────────────────────────────────
  const products = [
    {
      sellerId: seller1.id,
      title: 'Cemento Portland 50kg',
      description: 'Cemento Portland de alta resistencia, ideal para construcciones residenciales y comerciales. Bolsa de 50kg.',
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
      description: 'Varilla corrugada de acero grado 60, ideal para refuerzo de concreto.',
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
      description: 'Taladro inalámbrico profesional con batería de litio 20V, 2 velocidades.',
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
      description: 'Pintura vinílica de alta calidad, cobertura extra.',
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
      description: 'Tubo PVC para conducción de agua, presión nominal 10 BAR.',
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
      description: 'Fertilizante granulado balanceado, ideal para todo tipo de cultivos.',
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
      description: 'Semilla de maíz híbrido de alto rendimiento, adaptada al trópico seco.',
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
      description: 'Insecticida sistémico de amplio espectro para control de plagas.',
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
      description: 'Tractor compacto 85HP, tracción 4x2, hidráulico.',
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
      description: 'Intel Core i5-1235U, 8GB RAM, 256GB SSD, pantalla 15.6" Full HD.',
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
      description: 'Router WiFi 6 de doble banda, velocidad hasta 1800 Mbps.',
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
      description: 'Cámara IP POE 4K, visión nocturna 30m, detector de movimiento.',
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
      description: 'Impresora, escáner y copiadora láser. WiFi, impresión dúplex automática.',
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

  // ─── Sample Notifications ──────────────────────────────────────────────
  await db.notification.createMany({
    data: [
      { userId: buyer.id, type: 'WELCOME', title: '¡Bienvenido a ProveedorConecta!', message: 'Explora miles de productos de proveedores nicaragüenses.' },
      { userId: seller1.id, type: 'WELCOME', title: '¡Tu tienda está lista!', message: 'Comienza a publicar productos y llegar a más clientes.' },
    ],
  })

  const totalProducts = products.length + suppliers.reduce((acc, s) => acc + s.products.length, 0)
  const totalSellers = 3 + suppliers.length

  console.log(`✅ Seeded ${totalProducts} products, ${totalSellers} sellers (3 demo + ${suppliers.length} verified), 1 buyer`)
  console.log('📧 Demo accounts:')
  console.log('  Admin:  rey7214935@gmail.com / admin123')
  console.log('  Seller: ferreteria@demo.ni / demo123')
  console.log('  Seller: agroserv@demo.ni / demo123')
  console.log('  Seller: tech@demo.ni / demo123')
  console.log('  Buyer:  comprador@demo.ni / demo123')
  console.log('  All suppliers: supplier+XXX@proveedorconecta.ni / supplier123')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
