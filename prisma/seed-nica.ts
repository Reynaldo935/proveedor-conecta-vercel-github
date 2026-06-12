import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Password Hashing ────────────────────────────────────────────────────────
const SALT_ROUNDS = 12
const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS)

// ─── 32 REAL Nicaraguan Suppliers ─────────────────────────────────────────────
const suppliers = [
  {
    email: 'ventas@ferreteríaamericana.com.ni',
    name: 'Ferretería Americana',
    businessName: 'Ferretería Americana',
    description: 'La ferretería más grande de Nicaragua con más de 40 años de experiencia. Todo en ferretería, plomería, electricidad y construcción.',
    category: 'Ferretería',
    phone: '2266-1010',
    website: 'ferreteríaamericana.com.ni',
    address: 'Km 5.5 Carretera Sur, Managua',
    department: 'Managua',
    latitude: 12.1105,
    longitude: -86.2658,
    hours: 'Lun-Sáb 7:00am-6:00pm, Dom 8:00am-12:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA', 'PAYPAL'],
    products: [
      { title: 'Cemento Portland 42.5kg Argos', price: 335, category: 'Ferretería', tags: 'cemento,portland,argos,construccion', quantity: 500, description: 'Cemento Portland tipo I, bolsa de 42.5kg. Ideal para construcciones residenciales y comerciales.' },
      { title: 'Varilla Corrugada 1/2" x 6m Grado 60', price: 148, category: 'Ferretería', tags: 'varilla,corrugada,acero,construccion', quantity: 1000, description: 'Varilla corrugada de acero grado 60 para refuerzo de concreto.' },
      { title: 'Tubo PVC Hidráulico 4" x 3m', price: 168, category: 'Ferretería', tags: 'tubo,pvc,hidraulico,plomeria', quantity: 300, description: 'Tubo PVC hidráulico clase 10, para conducción de agua potable.' },
      { title: 'Pintura Vinílica Premium 1 Galón', price: 295, category: 'Ferretería', tags: 'pintura,vinilica,pared,construccion', quantity: 200, description: 'Pintura vinílica de alta cobertura, acabado mate. Rinde hasta 40m² por galón.' },
      { title: 'Taladro Inalámbrico DeWalt 20V', price: 4250, category: 'Ferretería', tags: 'taladro,inalambrico,dewalt,herramienta', quantity: 30, description: 'Taladro inalámbrico profesional 20V MAX, 2 velocidades, incluye 2 baterías y cargador.' },
      { title: 'Llave Inglesa Ajustable 12"', price: 485, category: 'Ferretería', tags: 'llave,inglesa,ajustable,herramienta', quantity: 50, description: 'Llave inglesa ajustable de 12 pulgadas, acero al cromo.' },
      { title: 'Manguera PVC 1/2" x 30m', price: 580, category: 'Ferretería', tags: 'manguera,pvc,jardin,agua', quantity: 80, description: 'Manguera de PVC reforzada, 30 metros, resistente a la intemperie.' },
      { title: 'Candado de Seguridad 50mm', price: 195, category: 'Ferretería', tags: 'candado,seguridad,cerradura', quantity: 100, description: 'Candado de latón con cuerpo de 50mm, cilindro de seguridad.' },
    ],
  },
  {
    email: 'ventas@distribuidorasanmarcos.com',
    name: 'Distribuidora San Martín',
    businessName: 'Distribuidora San Martín',
    description: 'Distribuidor mayorista de materiales de construcción con cobertura nacional. Precios competitivos al mayoreo.',
    category: 'Materiales de Construcción',
    phone: '2255-3344',
    website: 'distribuidorasanmarcos.com',
    address: 'Zona Franca, Managua',
    department: 'Managua',
    latitude: 12.1354,
    longitude: -86.2439,
    hours: 'Lun-Vie 7:00am-5:30pm, Sáb 7:00am-12:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Bloque de Concreto 6x8x16', price: 18, category: 'Construcción', tags: 'bloque,concreto,muro,construccion', quantity: 5000, description: 'Bloque de concreto estándar 6x8x16 pulgadas. Resistencia f\'c=70kg/cm².' },
      { title: 'Arena de Río m³', price: 1250, category: 'Construcción', tags: 'arena,rio,construccion,agregado', quantity: 200, description: 'Arena de río lavada, grado fino. Metro cúbico entregado en Managua.' },
      { title: 'Grava de 3/4" m³', price: 1450, category: 'Construcción', tags: 'grava,agregado,concreto,construccion', quantity: 150, description: 'Grava triturada de 3/4 pulgada para concreto y base de pavimentos.' },
      { title: 'Teja Colonial Cerámica', price: 42, category: 'Construcción', tags: 'teja,colonial,ceramica,techo', quantity: 3000, description: 'Teja colonial de barro cocido. Pieza individual, color terracota natural.' },
      { title: 'Puerta de Madera Cedro 32x80', price: 4800, category: 'Construcción', tags: 'puerta,madera,cedro,interior', quantity: 25, description: 'Puerta interior de cedro macizo, 32x80 pulgadas, con marco incluido.' },
    ],
  },
  {
    email: 'info@agropecuariaporvenir.com',
    name: 'Agropecuaria El Porvenir',
    businessName: 'Agropecuaria El Porvenir',
    description: 'Insumos agropecuarios de calidad en León. Fertilizantes, semillas, herramientas y todo para el campo nicaragüense.',
    category: 'Agropecuaria',
    phone: '2252-7788',
    website: 'agropecuariaporvenir.com',
    address: 'Barrio El Laborío, León',
    department: 'León',
    latitude: 12.0966,
    longitude: -86.2714,
    hours: 'Lun-Vie 7:30am-5:30pm, Sáb 7:30am-12:30pm',
    paymentMethods: ['BANPRO', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Fertilizante NPK 15-15-15 50kg', price: 695, category: 'Agropecuaria', tags: 'fertilizante,npk,agricultura,cultivo', quantity: 300, description: 'Fertilizante granulado NPK 15-15-15, bolsa de 50kg. Uso general en todos los cultivos.' },
      { title: 'Pesticida Cipermetrina 1L', price: 385, category: 'Agropecuaria', tags: 'pesticida,cipermetrina,plagas,agricultura', quantity: 200, description: 'Insecticida Cipermetrina concentrado emulsionable. Control de plagas en hortalizas y granos básicos.' },
      { title: 'Semilla de Frijol Rojo 25kg', price: 1450, category: 'Agropecuaria', tags: 'semilla,frijol,rojo,agricultura', quantity: 100, description: 'Semilla de frijol rojo de la variedad INTA Rojo, alta productividad.' },
      { title: 'Bomba de Agua 2HP Sumergible', price: 6800, category: 'Agropecuaria', tags: 'bomba,agua,sumergible,riego', quantity: 15, description: 'Bomba sumergible de 2HP para pozo profundo. Caudal máximo 60 L/min.' },
      { title: 'Semilla de Maíz Híbrido 5kg', price: 465, category: 'Agropecuaria', tags: 'semilla,maiz,hibrido,agricultura', quantity: 150, description: 'Semilla de maíz híbrido NB-6, adaptada al trópico seco nicaragüense.' },
    ],
  },
  {
    email: 'ventas@grupopellas.com',
    name: 'Grupo Pellas',
    businessName: 'Grupo Pellas',
    description: 'Conglomerado nicaragüense líder en bebidas, consumo y energía. Distribución nacional de marcas reconocidas.',
    category: 'Bebidas y Consumo',
    phone: '2255-0000',
    website: 'grupopellas.com',
    address: 'Torre Pellas, Managua',
    department: 'Managua',
    latitude: 12.1405,
    longitude: -86.2688,
    hours: 'Lun-Vie 8:00am-5:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA', 'PAYPAL'],
    products: [
      { title: 'Ron Flor de Caña 7 Años 750ml', price: 580, category: 'Alimentos', tags: 'ron,flordecana,premium,bebida', quantity: 200, description: 'Ron Flor de Caña 7 Años Gran Reserva. Premium nicaragüense reconocido mundialmente.' },
      { title: 'Ron Flor de Caña 12 Años 750ml', price: 950, category: 'Alimentos', tags: 'ron,flordecana,12anos,premium', quantity: 100, description: 'Ron Flor de Caña 12 Años Centenario Gold. Sabor suave y complejo.' },
      { title: 'Cerveza Toña 6-pack Lata 355ml', price: 152, category: 'Alimentos', tags: 'cerveza,tona,nicaragua,bebida', quantity: 1000, description: 'Cerveza Toña, la cerveza de Nicaragua. Pack de 6 latas de 355ml.' },
    ],
  },
  {
    email: 'ventas@cementoscatat.com',
    name: 'Cementos CATAT',
    businessName: 'Cementos CATAT',
    description: 'Productor nacional de cemento Portland con planta en Tipitape. Distribución directa a constructores.',
    category: 'Cemento',
    phone: '2265-4321',
    website: 'cementoscatat.com',
    address: 'Km 16 Carretera Norte, Tipitapa',
    department: 'Managua',
    latitude: 12.1850,
    longitude: -86.0986,
    hours: 'Lun-Sáb 6:00am-5:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Cemento CATAT Portland 42.5kg', price: 310, category: 'Construcción', tags: 'cemento,catat,portland,construccion', quantity: 800, description: 'Cemento Portland tipo I CATAT, bolsa de 42.5kg. Fabricado en Nicaragua.' },
      { title: 'Cemento CATAT Mortero 25kg', price: 195, category: 'Construcción', tags: 'cemento,mortero,catat,construccion', quantity: 500, description: 'Cemento mortero CATAT para pegar bloques y ladrillos. Bolsa de 25kg.' },
      { title: 'Concreto Premezclado m³', price: 4200, category: 'Construcción', tags: 'concreto,premezclado,construccion', quantity: 100, description: 'Concreto premezclado f\'c=250kg/cm². Entregado con mixer en obra.' },
    ],
  },
  {
    email: 'ventas@laperfecta.com.ni',
    name: 'Comercializadora La Perfecta',
    businessName: 'Comercializadora La Perfecta',
    description: 'Supermercado y distribuidora al mayoreo con sucursales en todo Managua. Alimentos, limpieza y artículos del hogar.',
    category: 'Supermercado/Mayoreo',
    phone: '2255-6677',
    website: 'laperfecta.com.ni',
    address: 'Colonia Centroamérica, Managua',
    department: 'Managua',
    latitude: 12.1210,
    longitude: -86.2502,
    hours: 'Lun-Dom 7:00am-9:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA', 'PIXELPAY'],
    products: [
      { title: 'Arroz La Perfecta 5lb', price: 78, category: 'Alimentos', tags: 'arroz,alimento,basico,mayoreo', quantity: 2000, description: 'Arroz grano largo La Perfecta, bolsa de 5 libras.' },
      { title: 'Aceite Vegetal 1 Galón', price: 285, category: 'Alimentos', tags: 'aceite,vegetal,cocina,alimento', quantity: 800, description: 'Aceite vegetal comestible, galón (3.78L). Ideal para uso comercial.' },
      { title: 'Azúcar Refinada 5lb', price: 82, category: 'Alimentos', tags: 'azucar,refinada,alimento,basico', quantity: 1500, description: 'Azúcar refinada, bolsa de 5 libras.' },
      { title: 'Frijoles Negros 5lb', price: 155, category: 'Alimentos', tags: 'frijoles,negros,alimento,basico', quantity: 600, description: 'Frijoles negros selección, bolsa de 5 libras.' },
    ],
  },
  {
    email: 'ventas@agroipsa.com.ni',
    name: 'Agroipsa',
    businessName: 'Agroipsa',
    description: 'Distribuidor líder de agroquímicos, fertilizantes y semillas en Nicaragua. Representantes de marcas internacionales.',
    category: 'Agroquímicos',
    phone: '2268-1234',
    website: 'agroipsa.com.ni',
    address: 'Pista Jean Paul Genie, Managua',
    department: 'Managua',
    latitude: 12.1070,
    longitude: -86.2525,
    hours: 'Lun-Vie 8:00am-5:00pm, Sáb 8:00am-12:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Herbicida Glifosato 1L', price: 325, category: 'Agropecuaria', tags: 'herbicida,glifosato,malezas,agricultura', quantity: 400, description: 'Herbicida sistémico Glifosato 48% concentrado. Control total de malezas.' },
      { title: 'Fungicida Mancozeb 1kg', price: 285, category: 'Agropecuaria', tags: 'fungicida,mancozeb,hongos,agricultura', quantity: 350, description: 'Fungicida preventivo Mancozeb 80% WP. Protección contra hongos en cultivos.' },
      { title: 'Fertilizante Urea 50kg', price: 745, category: 'Agropecuaria', tags: 'fertilizante,urea,nitrogeno,agricultura', quantity: 250, description: 'Urea agrícola 46% nitrógeno. Bolsa de 50kg.' },
      { title: 'Insecticida Imidacloprid 500ml', price: 420, category: 'Agropecuaria', tags: 'insecticida,imidacloprid,plagas,agricultura', quantity: 200, description: 'Insecticida sistémico Imidacloprid 35% SC. Control de insectos chupadores.' },
    ],
  },
  {
    email: 'ventas@alunsa.com',
    name: 'Alunsa',
    businessName: 'Alunsa',
    description: 'Especialistas en aluminio, vidrio y cristalería para construcción. Perfiles, puertas, ventanas y más.',
    category: 'Aluminio y Vidrio',
    phone: '2266-5544',
    website: 'alunsa.com',
    address: 'Carretera Masaya Km 7, Managua',
    department: 'Managua',
    latitude: 12.0950,
    longitude: -86.2255,
    hours: 'Lun-Vie 8:00am-5:30pm, Sáb 8:00am-12:30pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Perfil de Aluminio 6m Serie 45', price: 890, category: 'Construcción', tags: 'aluminio,perfil,ventana,construccion', quantity: 100, description: 'Perfil de aluminio serie 45 para ventanas corredizas. 6 metros de largo.' },
      { title: 'Vidrio Templado 6mm m²', price: 1250, category: 'Construcción', tags: 'vidrio,templado,seguridad,construccion', quantity: 80, description: 'Vidrio templado de seguridad 6mm. Precio por metro cuadrado, cortado a medida.' },
      { title: 'Puerta de Aluminio y Vidrio', price: 8500, category: 'Construcción', tags: 'puerta,aluminio,vidrio,construccion', quantity: 20, description: 'Puerta principal de aluminio con vidrio templado. Incluye marco y herraje.' },
    ],
  },
  {
    email: 'ventas@novex.com.ni',
    name: 'Novex',
    businessName: 'Novex',
    description: 'Distribuidor mayorista de materiales eléctricos. Cable, conduit, breakers, paneles y todo para instalación eléctrica.',
    category: 'Electricidad',
    phone: '2255-8800',
    website: 'novex.com.ni',
    address: 'Mercado Oriental, Managua',
    department: 'Managua',
    latitude: 12.1420,
    longitude: -86.2558,
    hours: 'Lun-Sáb 7:30am-5:30pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Cable THW Calibre 10 100m', price: 1850, category: 'Tecnología', tags: 'cable,thw,electrico,construccion', quantity: 150, description: 'Cable THW calibre 10 AWG, cobre suave, 100 metros. Para instalaciones eléctricas residenciales.' },
      { title: 'Breaker Termomagnético 2x40A', price: 485, category: 'Tecnología', tags: 'breaker,termomagnetico,electrico,panel', quantity: 80, description: 'Breaker termomagnético bipolar 40 amperios. Para panel de distribución.' },
      { title: 'Conduit PVC 1/2" x 3m', price: 65, category: 'Tecnología', tags: 'conduit,pvc,electrico,construccion', quantity: 400, description: 'Tubo conduit PVC 1/2 pulgada, 3 metros. Para protección de cableado eléctrico.' },
      { title: 'Panel de Distribución 8 Circuitos', price: 2200, category: 'Tecnología', tags: 'panel,distribucion,electrico,circuitos', quantity: 40, description: 'Panel de distribución para 8 circuitos con barramiento de tierra y neutro.' },
    ],
  },
  {
    email: 'ventas@casapellas.com',
    name: 'Casa Pellas',
    businessName: 'Casa Pellas',
    description: 'La tienda más grande de Nicaragua. Vehículos, motocicletas, repuestos, electrónica y artículos generales.',
    category: 'Automotriz/General',
    phone: '2266-0000',
    website: 'casapellas.com',
    address: 'Centro Comercial Managua',
    department: 'Managua',
    latitude: 12.1455,
    longitude: -86.2708,
    hours: 'Lun-Sáb 9:00am-8:00pm, Dom 10:00am-6:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA', 'PAYPAL', 'PIXELPAY'],
    products: [
      { title: 'Llanta Michelin 185/65R15', price: 3200, category: 'Automotriz', tags: 'llanta,michelin,automotriz,auto', quantity: 50, description: 'Llanta Michelin Energy Saver 185/65R15. Alta durabilidad y ahorro de combustible.' },
      { title: 'Batería 12V 60Ah', price: 2850, category: 'Automotriz', tags: 'bateria,12v,automotriz,auto', quantity: 30, description: 'Batería de automóvil 12V 60Ah. Garantía de 12 meses.' },
      { title: 'Aceite de Motor 5W-30 4L', price: 780, category: 'Automotriz', tags: 'aceite,motor,5w30,automotriz', quantity: 200, description: 'Aceite de motor sintético 5W-30, 4 litros. Para motores gasolina modernos.' },
      { title: 'Filtro de Aire Toyota', price: 385, category: 'Automotriz', tags: 'filtro,aire,toyota,repuesto', quantity: 60, description: 'Filtro de aire para Toyota Corolla/Camry. Repuesto original.' },
      { title: 'Filtro de Aceite Universal', price: 195, category: 'Automotriz', tags: 'filtro,aceite,automotriz,repuesto', quantity: 100, description: 'Filtro de aceite universal para múltiples modelos.' },
    ],
  },
  {
    email: 'ventas@siman.com',
    name: 'SIMAN Nicaragua',
    businessName: 'SIMAN Nicaragua',
    description: 'Almacén por departamentos con lo último en tecnología, moda, hogar y más. Compra online o en tienda.',
    category: 'Retail',
    phone: '2266-4444',
    website: 'siman.com',
    address: 'Galerías Santo Domingo, Managua',
    department: 'Managua',
    latitude: 12.1005,
    longitude: -86.2625,
    hours: 'Lun-Sáb 10:00am-8:00pm, Dom 11:00am-7:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA', 'PAYPAL', 'PIXELPAY', 'KASH'],
    products: [
      { title: 'Laptop HP 15" i5/8GB/256GB SSD', price: 14500, category: 'Tecnología', tags: 'laptop,hp,computadora,tecnologia', quantity: 20, description: 'Laptop HP 15.6" FHD, Intel Core i5-1235U, 8GB RAM, 256GB SSD.' },
      { title: 'Smart TV Samsung 55" 4K', price: 24900, category: 'Tecnología', tags: 'smartv,samsung,4k,televisor', quantity: 12, description: 'Smart TV Samsung 55" Crystal UHD 4K. Smart TV Tizen con Bluetooth.' },
      { title: 'iPhone 15 128GB', price: 28900, category: 'Tecnología', tags: 'iphone,apple,celular,tecnologia', quantity: 15, description: 'iPhone 15 128GB. Pantalla Super Retina XDR de 6.1", chip A16 Bionic.' },
    ],
  },
  {
    email: 'ventas@farmaciaunion.com.ni',
    name: 'Farmacia Unión',
    businessName: 'Farmacia Unión',
    description: 'La farmacia más grande de Nicaragua con más de 50 sucursales. Medicamentos, productos de salud y bienestar.',
    category: 'Farmacéutico',
    phone: '2255-2222',
    website: 'farmaciaunion.com.ni',
    address: 'Frente a Metro Centro, Managua',
    department: 'Managua',
    latitude: 12.1290,
    longitude: -86.2695,
    hours: 'Lun-Dom 7:00am-10:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA', 'PIXELPAY'],
    products: [
      { title: 'Kit Botiquín Primeros Auxilios', price: 1250, category: 'Salud', tags: 'botiquin,primeros auxilios,salud,emergencia', quantity: 40, description: 'Botiquín completo de primeros auxilios con 45 piezas. Ideal para hogares y empresas.' },
      { title: 'Alcohol Isopropílico 1 Galón', price: 320, category: 'Salud', tags: 'alcohol,isopropilico,desinfeccion,salud', quantity: 100, description: 'Alcohol isopropílico al 70%, 1 galón. Uso hospitalario e industrial.' },
      { title: 'Guantes de Látex Caja 100', price: 285, category: 'Salud', tags: 'guantes,latex,proteccion,salud', quantity: 150, description: 'Guantes de látex examination, caja de 100 unidades. Talla mediana.' },
    ],
  },
  {
    email: 'ventas@distribuidoraabc.com.ni',
    name: 'Distribuidora ABC',
    businessName: 'Distribuidora ABC',
    description: 'Distribuidora de productos de limpieza, aseo y consumo masivo. Venta al mayoreo y detalle.',
    category: 'Limpieza/Consumo',
    phone: '2266-3344',
    website: 'distribuidoraabc.com.ni',
    address: 'Mercado Oriental, Managua',
    department: 'Managua',
    latitude: 12.1410,
    longitude: -86.2565,
    hours: 'Lun-Sáb 6:00am-5:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'BILLETERA'],
    products: [
      { title: 'Detergente en Polvo 5kg', price: 215, category: 'Alimentos', tags: 'detergente,polvo,limpieza,mayoreo', quantity: 500, description: 'Detergente en polvo multiuso, bolsa de 5kg. Alta concentración.' },
      { title: 'Desinfectante Pino 4L', price: 185, category: 'Alimentos', tags: 'desinfectante,pino,limpieza,pisos', quantity: 300, description: 'Desinfectante con aroma a pino, galón de 4 litros. Para pisos y superficies.' },
      { title: 'Jabón de Lavatrastes 4L', price: 195, category: 'Alimentos', tags: 'jabon,lavatrastes,limpieza,cocina', quantity: 400, description: 'Jabón líquido lavatrastes concentrado, 4 litros. Desengrasante.' },
    ],
  },
  {
    email: 'ventas@constructormeco.com',
    name: 'Constructora Meco',
    businessName: 'Constructora Meco',
    description: 'Constructora con experiencia en proyectos viales, edificaciones y obras civiles en Centroamérica.',
    category: 'Construcción',
    phone: '2268-5566',
    website: 'constructormeco.com',
    address: 'Las Colinas, Managua',
    department: 'Managua',
    latitude: 12.1080,
    longitude: -86.2585,
    hours: 'Lun-Vie 8:00am-5:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE'],
    products: [
      { title: 'Acero Estructural W8x31 6m', price: 4800, category: 'Construcción', tags: 'acero,estructural,viga,construccion', quantity: 30, description: 'Viga de acero estructural W8x31, 6 metros. Para estructuras industriales.' },
      { title: 'Lámina de Zinc 3m Galvanizada', price: 395, category: 'Construcción', tags: 'lamina,zinc,galvanizada,techo', quantity: 500, description: 'Lámina de zinc galvanizada calibre 28, 3 metros. Para techos y cerramientos.' },
      { title: 'Concrete Block Retén 8x8x16', price: 35, category: 'Construcción', tags: 'bloque,reten,concreto,muro', quantity: 2000, description: 'Bloque de concreto tipo retén 8x8x16. Para muros de contención y divisorios.' },
    ],
  },
  {
    email: 'ventas@lafil.com.ni',
    name: 'Distribuidora Lafil',
    businessName: 'Distribuidora Lafil',
    description: 'Distribuidora de alimentos y productos de consumo masivo. Servicio a supermercados y pulperías.',
    category: 'Alimentos',
    phone: '2252-1100',
    website: 'lafil.com.ni',
    address: 'Zona Franca Las Mercedes, Managua',
    department: 'Managua',
    latitude: 12.1530,
    longitude: -86.2975,
    hours: 'Lun-Vie 6:00am-4:00pm, Sáb 6:00am-11:00am',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Arroz Grano Largo 100lb', price: 1250, category: 'Alimentos', tags: 'arroz,grano largo,mayoreo,alimento', quantity: 300, description: 'Arroz grano largo, saco de 100 libras. Precio al mayoreo.' },
      { title: 'Azúcar Blanca 100lb', price: 1480, category: 'Alimentos', tags: 'azucar,blanca,mayoreo,alimento', quantity: 250, description: 'Azúcar blanca refinada, saco de 100 libras. Calidad exportación.' },
      { title: 'Aceite de Soya 5 Galones', price: 1420, category: 'Alimentos', tags: 'aceite,soya,mayoreo,cocina', quantity: 150, description: 'Aceite de soya comestible, 5 galones (18.9L). Para uso comercial.' },
    ],
  },
  {
    email: 'ventas@agrofertil.com.ni',
    name: 'Agrofértil',
    businessName: 'Agrofértil',
    description: 'Fertilizantes y agroquímicos de calidad en León. Asesoría técnica para el agricultor nicaragüense.',
    category: 'Fertilizantes',
    phone: '2268-7788',
    website: 'agrofertil.com.ni',
    address: 'Barrio Subtiava, León',
    department: 'León',
    latitude: 12.0880,
    longitude: -86.2900,
    hours: 'Lun-Vie 7:00am-5:00pm, Sáb 7:00am-12:00pm',
    paymentMethods: ['BANPRO', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Fertilizante Completo 12-30-10 50kg', price: 825, category: 'Agropecuaria', tags: 'fertilizante,12-30-10,agricultura,cultivo', quantity: 200, description: 'Fertilizante granulado 12-30-10, formulación para etapa de crecimiento.' },
      { title: 'Abono Orgánico Bokashi 50kg', price: 380, category: 'Agropecuaria', tags: 'abono,organico,bokashi,agricultura', quantity: 150, description: 'Abono orgánico Bokashi fermentado, bolsa de 50kg. Mejora la estructura del suelo.' },
      { title: 'Cal Agrícola 50kg', price: 290, category: 'Agropecuaria', tags: 'cal,agricola,suelo,encalado', quantity: 300, description: 'Cal agrícola para encalado de suelos ácidos. Bolsa de 50kg.' },
    ],
  },
  {
    email: 'ventas@tecniagro.com.ni',
    name: 'Tecniagro',
    businessName: 'Tecniagro',
    description: 'Maquinaria agrícola y equipos de riego. Representantes de las mejores marcas internacionales.',
    category: 'Maquinaria Agrícola',
    phone: '2255-9988',
    website: 'tecniagro.com.ni',
    address: 'Pista Suburbana, Managua',
    department: 'Managua',
    latitude: 12.1180,
    longitude: -86.2650,
    hours: 'Lun-Vie 8:00am-5:00pm, Sáb 8:00am-12:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Tractor John Deere 75HP 4x2', price: 485000, category: 'Agropecuaria', tags: 'tractor,johndeere,maquinaria,agricultura', quantity: 5, description: 'Tractor John Deere 75HP, tracción 4x2, con hidráulico y TDF. Garantía de 2 años.' },
      { title: 'Sistema de Riego por Goteo 1ha', price: 35000, category: 'Agropecuaria', tags: 'riego,goteo,sistema,agricultura', quantity: 10, description: 'Sistema completo de riego por goteo para 1 hectárea. Incluye cintas, filtros y accesorios.' },
      { title: 'Motobomba Diesel 5HP', price: 12500, category: 'Agropecuaria', tags: 'motobomba,diesel,riego,agricultura', quantity: 12, description: 'Motobomba diesel de 5HP para irrigación. Caudal máximo 120 L/min.' },
    ],
  },
  {
    email: 'ventas@kague.com.ni',
    name: 'Ferretería Kagüé',
    businessName: 'Ferretería Kagüé',
    description: 'Ferretería de tradición en Nicaragua. Herramientas, cerrajería, plomería y materiales de construcción.',
    category: 'Ferretería',
    phone: '2266-2200',
    website: 'kague.com.ni',
    address: 'Barrio Martha Quezada, Managua',
    department: 'Managua',
    latitude: 12.1350,
    longitude: -86.2605,
    hours: 'Lun-Sáb 7:00am-6:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Cerradura de Seguro Yale', price: 895, category: 'Ferretería', tags: 'cerradura,yale,seguridad,puerta', quantity: 60, description: 'Cerradura de seguro Yale con cilindro de 5 pines. Acabado en bronce.' },
      { title: 'Martillo de Uña 16oz', price: 225, category: 'Ferretería', tags: 'martillo,uña,herramienta,construccion', quantity: 80, description: 'Martillo de uña de acero forjado, mango de fibra de vidrio, 16oz.' },
      { title: 'Sierra Caladora Bosch 650W', price: 3200, category: 'Ferretería', tags: 'sierra,caladora,bosch,herramienta', quantity: 25, description: 'Sierra caladora Bosch 650W con control de velocidad. Incluye 3 hojas.' },
    ],
  },
  {
    email: 'ventas@lubricentroamerica.com',
    name: 'Lubricantes de Centroamérica',
    businessName: 'Lubricantes de Centroamérica',
    description: 'Distribuidor exclusivo de lubricantes Shell y Mobil para Nicaragua. Aceites industriales y automotrices.',
    category: 'Lubricantes',
    phone: '2268-3300',
    website: 'lubricentroamerica.com',
    address: 'Zona Franca, Managua',
    department: 'Managua',
    latitude: 12.1555,
    longitude: -86.3010,
    hours: 'Lun-Vie 8:00am-5:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Aceite Shell Helix 15W-40 4L', price: 890, category: 'Automotriz', tags: 'aceite,shell,helix,automotriz', quantity: 200, description: 'Aceite de motor Shell Helix HX5 15W-40, 4 litros. Para motores gasolina y diésel.' },
      { title: 'Grasa Lithium 1kg', price: 285, category: 'Automotriz', tags: 'grasa,lithium,lubricante,industrial', quantity: 150, description: 'Grasa lubricante multiuso base lithium, 1kg. Para rodamientos y engranajes.' },
      { title: 'Aceite Hidráulico 5 Galones', price: 2850, category: 'Automotriz', tags: 'aceite,hidraulico,industrial,maquinaria', quantity: 50, description: 'Aceite hidráulico ISO 68, 5 galones. Para sistemas hidráulicos industriales.' },
    ],
  },
  {
    email: 'ventas@lanacional.com.ni',
    name: 'Distribuidora La Nacional',
    businessName: 'Distribuidora La Nacional',
    description: 'Distribuidora de alimentos y productos de consumo al mayoreo con cobertura nacional.',
    category: 'Alimentos/Mayoreo',
    phone: '2255-4455',
    website: 'lanacional.com.ni',
    address: 'Colonia Primero de Mayo, Managua',
    department: 'Managua',
    latitude: 12.1265,
    longitude: -86.2540,
    hours: 'Lun-Vie 6:00am-4:00pm, Sáb 6:00am-12:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Frijoles Rojos 100lb', price: 2850, category: 'Alimentos', tags: 'frijoles,rojos,mayoreo,alimento', quantity: 100, description: 'Frijoles rojos selección, saco de 100 libras. Calidad premium.' },
      { title: 'Maíz Blanco 100lb', price: 1680, category: 'Alimentos', tags: 'maiz,blanco,mayoreo,alimento', quantity: 200, description: 'Maíz blanco de primera, saco de 100 libras. Para nixtamal y tortillas.' },
      { title: 'Sal Industrial 50kg', price: 380, category: 'Alimentos', tags: 'sal,industrial,mayoreo,alimento', quantity: 150, description: 'Sal industrial yodada, bolsa de 50kg. Para uso en procesamiento de alimentos.' },
    ],
  },
  {
    email: 'ventas@mueblesnica.com.ni',
    name: 'Muebles Nica',
    businessName: 'Muebles Nica',
    description: 'Fabricantes de muebles de madera de calidad en Masaya. Muebles de pino, cedro y laurel artesanales.',
    category: 'Muebles',
    phone: '2266-7766',
    website: 'mueblesnica.com.ni',
    address: 'Mercado de Artesanías, Masaya',
    department: 'Masaya',
    latitude: 11.9744,
    longitude: -86.0938,
    hours: 'Lun-Sáb 8:00am-5:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'BILLETERA'],
    products: [
      { title: 'Mesa de Comedor 6 Puestos Cedro', price: 12500, category: 'Hogar', tags: 'mesa,comedor,cedro,muebles', quantity: 10, description: 'Mesa de comedor de cedro macizo para 6 personas. Acabado natural con barniz.' },
      { title: 'Ropero de Pino 2 Puertas', price: 8500, category: 'Hogar', tags: 'ropero,pino,muebles,dormitorio', quantity: 8, description: 'Ropero de pino con 2 puertas y cajón inferior. 1.80m de alto.' },
      { title: 'Silla de Madera Rústica', price: 1650, category: 'Hogar', tags: 'silla,madera,rustica,muebles', quantity: 30, description: 'Silla de madera de laurel estilo rústico. Resistente y duradera.' },
    ],
  },
  {
    email: 'ventas@textilesdenicaragua.com',
    name: 'Textiles de Nicaragua',
    businessName: 'Textiles de Nicaragua',
    description: 'Fabricación y distribución de telas, hilos y materiales textiles. Servicio a la industria de la confección.',
    category: 'Textiles',
    phone: '2252-8899',
    website: 'textilesdenicaragua.com',
    address: 'Zona Franca Industrial, Managua',
    department: 'Managua',
    latitude: 12.1485,
    longitude: -86.2895,
    hours: 'Lun-Vie 7:00am-4:30pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE'],
    products: [
      { title: 'Tela de Algodón 50m Rollo', price: 3200, category: 'Textiles', tags: 'tela,algodon,textil,confeccion', quantity: 40, description: 'Tela de algodón 100%, rollo de 50 metros. Ancho 1.50m, color crudo.' },
      { title: 'Hilo de Coser 5000m', price: 185, category: 'Textiles', tags: 'hilo,coser,textil,confeccion', quantity: 200, description: 'Hilo de coser poliéster 40/2, carrete de 5000 metros. Color surtido.' },
      { title: 'Máquina de Coser Industrial', price: 18500, category: 'Textiles', tags: 'maquina,coser,industrial,textil', quantity: 8, description: 'Máquina de coser industrial recta Juki. Motor directo, velocidad 5000rpm.' },
    ],
  },
  {
    email: 'ventas@herramientaspro.com.ni',
    name: 'Herramientas Pro',
    businessName: 'Herramientas Pro',
    description: 'Herramientas profesionales para construcción, mecánica y carpintería. Marcas Stanley, DeWalt, Bosch.',
    category: 'Herramientas',
    phone: '2268-1122',
    website: 'herramientaspro.com.ni',
    address: 'Colonia Centroamérica, Managua',
    department: 'Managua',
    latitude: 12.1215,
    longitude: -86.2512,
    hours: 'Lun-Sáb 8:00am-6:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Juego de Llaves Combinadas 12pc', price: 1450, category: 'Ferretería', tags: 'llaves,combinadas,herramienta,mecanica', quantity: 35, description: 'Juego de 12 llaves combinadas métricas (8-19mm). Acero al cromo-vanadio.' },
      { title: 'Esmeriladora Angular 7" 2400W', price: 3800, category: 'Ferretería', tags: 'esmeriladora,angular,herramienta,corte', quantity: 20, description: 'Esmeriladora angular Bosch 7 pulgadas, 2400W. Para corte y desbaste de metal.' },
      { title: 'Compresor de Aire 25 Galones', price: 9800, category: 'Industrial', tags: 'compresor,aire,neumatico,industrial', quantity: 10, description: 'Compresor de aire de 25 galones, 2HP. Para herramientas neumáticas y pintura.' },
    ],
  },
  {
    email: 'ventas@plasticosnicarao.com',
    name: 'Plásticos Nicarao',
    businessName: 'Plásticos Nicarao',
    description: 'Fabricantes de productos plásticos para el hogar, industria y agricultura. Tanques, tubería y empaques.',
    category: 'Plásticos',
    phone: '2255-7700',
    website: 'plasticosnicarao.com',
    address: 'Parque Industrial, Managua',
    department: 'Managua',
    latitude: 12.1125,
    longitude: -86.2475,
    hours: 'Lun-Vie 7:30am-4:30pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Tanque de Agua 500 Galones', price: 6500, category: 'Construcción', tags: 'tanque,agua,plastico,almacen', quantity: 20, description: 'Tanque de polietileno para agua potable, 500 galones. Color azul, con tapa y válvula.' },
      { title: 'Tubo PVC Conducción 3" x 6m', price: 245, category: 'Construcción', tags: 'tubo,pvc,conduccion,plomeria', quantity: 200, description: 'Tubo PVC para conducción de agua clase 15, 6 metros.' },
      { title: 'Contenedor Plástico 200L', price: 1200, category: 'Industrial', tags: 'contenedor,plastico,almacen,industrial', quantity: 30, description: 'Contenedor plástico de 200 litros con tapa. Para almacenamiento de líquidos.' },
    ],
  },
  {
    email: 'ventas@distribuidoraelsol.com.ni',
    name: 'Distribuidora El Sol',
    businessName: 'Distribuidora El Sol',
    description: 'Distribuidora de productos de consumo y artículos varios en Granada. Servicio a pulperías y mini supers.',
    category: 'Consumo/Varios',
    phone: '2266-9900',
    website: 'distribuidoraelsol.com.ni',
    address: 'Calle La Calzada, Granada',
    department: 'Granada',
    latitude: 11.9344,
    longitude: -85.9560,
    hours: 'Lun-Sáb 6:30am-5:30pm',
    paymentMethods: ['BANPRO', 'BAC', 'BILLETERA'],
    products: [
      { title: 'Café Tostado Molido 500g', price: 125, category: 'Alimentos', tags: 'cafe,tostado,molido,nicaragua', quantity: 400, description: 'Café tostado y molido de las montañas de Matagalpa. 500g.' },
      { title: 'Confites Variados 1kg', price: 185, category: 'Alimentos', tags: 'confites,dulces,consumo,mayoreo', quantity: 300, description: 'Mezcla de confites variados, 1kg. Para pulperías y negocios.' },
      { title: 'Agua Purificada 20L', price: 52, category: 'Alimentos', tags: 'agua,purificada,garrafon,consumo', quantity: 500, description: 'Agua purificada en garrafón de 20 litros. Devolución de envase.' },
    ],
  },
  {
    email: 'ventas@agrojalapa.com.ni',
    name: 'Agropecuaria Jalapa',
    businessName: 'Agropecuaria Jalapa',
    description: 'Insumos agropecuarios en Nueva Segovia. Semillas, fertilizantes y herramientas para la zona norte.',
    category: 'Agropecuaria',
    phone: '2268-4466',
    website: 'agrojalapa.com.ni',
    address: 'Jalapa, Nueva Segovia',
    department: 'Nueva Segovia',
    latitude: 13.9620,
    longitude: -86.1160,
    hours: 'Lun-Sáb 7:00am-5:00pm',
    paymentMethods: ['BANPRO', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Semilla de Frijol Rojo de Seda 25kg', price: 1580, category: 'Agropecuaria', tags: 'semilla,frijol,rojo,seda,agricultura', quantity: 80, description: 'Semilla de frijol rojo de seda, variedad INTA. Alta productividad en zona norte.' },
      { title: 'Fertilizante Fórmula 18-46-0 50kg', price: 920, category: 'Agropecuaria', tags: 'fertilizante,dap,agricultura,fosforo', quantity: 120, description: 'Fertilizante DAP 18-46-0, 50kg. Alto contenido de fósforo para etapa de siembra.' },
      { title: 'Palín para Limpiar 30"', price: 285, category: 'Agropecuaria', tags: 'palin,machete,herramienta,campo', quantity: 100, description: 'Palín (machete) de 30 pulgadas, hoja de acero al carbono con mango de madera.' },
    ],
  },
  {
    email: 'ventas@ferreteriaesteli.com.ni',
    name: 'Ferretería Estelí',
    businessName: 'Ferretería Estelí',
    description: 'Ferretería completa en Estelí. Materiales de construcción, herramientas y plomería para la zona norte.',
    category: 'Ferretería',
    phone: '2272-1100',
    website: 'ferreteriaesteli.com.ni',
    address: 'Barrael, Estelí',
    department: 'Estelí',
    latitude: 13.0975,
    longitude: -86.3568,
    hours: 'Lun-Sáb 7:00am-6:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'BILLETERA'],
    products: [
      { title: 'Cemento Argos 42.5kg', price: 345, category: 'Ferretería', tags: 'cemento,argos,construccion,norte', quantity: 300, description: 'Cemento Portland Argos tipo I, 42.5kg. Disponible en Estelí y zona norte.' },
      { title: 'Pintura Esmalte 1 Galón', price: 420, category: 'Ferretería', tags: 'pintura,esmalte,hierro,madera', quantity: 100, description: 'Pintura esmalte al solvente para metal y madera. 1 galón, varios colores.' },
      { title: 'Cinta Métrica 25m', price: 345, category: 'Ferretería', tags: 'cinta,metrica,medir,herramienta', quantity: 60, description: 'Cinta métrica profesional de 25 metros, ancho 25mm. Blade de acero con recubrimiento.' },
    ],
  },
  {
    email: 'ventas@comercialmatagalpa.com.ni',
    name: 'Comercial Matagalpa',
    businessName: 'Comercial Matagalpa',
    description: 'Productos varios y de consumo en Matagalpa. Alimentos, herramientas y artículos para el hogar y el campo.',
    category: 'Varios',
    phone: '2272-3344',
    website: 'comercialmatagalpa.com.ni',
    address: 'Barrio Guanuca, Matagalpa',
    department: 'Matagalpa',
    latitude: 12.9256,
    longitude: -85.9175,
    hours: 'Lun-Sáb 7:00am-5:30pm',
    paymentMethods: ['BANPRO', 'BAC', 'BILLETERA'],
    products: [
      { title: 'Café Verde 60kg Saco', price: 4800, category: 'Alimentos', tags: 'cafe,verde,exportacion,matagalpa', quantity: 30, description: 'Café verde de altura de Matagalpa, saco de 60kg. Clasificación SHB.' },
      { title: 'Mochila Agrícola 20L', price: 1250, category: 'Agropecuaria', tags: 'mochila,aspercior,agricultura,fumigar', quantity: 25, description: 'Mochila aspersora de 20 litros para fumigación. Bomba de presión manual.' },
      { title: 'Cacao Fermentado 50kg', price: 3200, category: 'Alimentos', tags: 'cacao,fermentado,chocolate,matagalpa', quantity: 20, description: 'Cacao fermentado y seco de Matagalpa, 50kg. Calidad fina de aroma.' },
    ],
  },
  {
    email: 'ventas@districaribe.com.ni',
    name: 'Distribuidora Caribe',
    businessName: 'Distribuidora Caribe',
    description: 'Distribuidora de productos de consumo en la Región Autónoma de la Costa Caribe Sur.',
    category: 'Consumo',
    phone: '2268-6688',
    website: 'districaribe.com.ni',
    address: 'Bluefields, RAAS',
    department: 'RAAS',
    latitude: 12.0138,
    longitude: -83.7636,
    hours: 'Lun-Vie 7:00am-4:00pm, Sáb 7:00am-12:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'BILLETERA'],
    products: [
      { title: 'Arroz Costeño 100lb', price: 1350, category: 'Alimentos', tags: 'arroz,costeno,mayoreo,alimento', quantity: 100, description: 'Arroz grano largo para consumo en la Costa Caribe, 100 libras.' },
      { title: 'Aceite de Coco 5L', price: 680, category: 'Alimentos', tags: 'aceite,coco,natural,organico', quantity: 50, description: 'Aceite de coco prensado en frío, 5 litros. Producto natural de la Costa Caribe.' },
    ],
  },
  {
    email: 'ventas@industriasnic.com.ni',
    name: 'Industrias NIC',
    businessName: 'Industrias NIC',
    description: 'Equipos y maquinaria industrial. Soldadoras, compresores, generadores y más para la industria nicaragüense.',
    category: 'Industrial',
    phone: '2255-1155',
    website: 'industriasnic.com.ni',
    address: 'Parque Industrial Las Mercedes, Managua',
    department: 'Managua',
    latitude: 12.1535,
    longitude: -86.2985,
    hours: 'Lun-Vie 8:00am-5:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Soldadora MIG 250A', price: 15500, category: 'Industrial', tags: 'soldadora,mig,industrial,soldadura', quantity: 8, description: 'Soldadora MIG/MAG 250 amperios, entrada 220V. Incluye gun y regulador de flujo.' },
      { title: 'Generador Diesel 50kVA', price: 125000, category: 'Industrial', tags: 'generador,diesel,energia,industrial', quantity: 4, description: 'Generador diesel 50kVA, motor Perkins. Arranque eléctrico, tablero de control automático.' },
      { title: 'Compresor de Tornillo 10HP', price: 45000, category: 'Industrial', tags: 'compresor,tornillo,aire,industrial', quantity: 5, description: 'Compresor de tornillo 10HP, tanque 200L. Para uso industrial continuo.' },
      { title: 'Esmeril de Banco 8"', price: 4500, category: 'Industrial', tags: 'esmeril,banco,industrial,afilado', quantity: 10, description: 'Esmeril de banco de 8 pulgadas, 3/4 HP, doble piedra. Para afilar herramientas.' },
    ],
  },
  {
    email: 'ventas@pinturassur.com.ni',
    name: 'Pinturas Sur',
    businessName: 'Pinturas Sur',
    description: 'Fabricantes y distribuidores de pinturas, barnices y recubrimientos en Nicaragua. Pinturas Sur, calidad local.',
    category: 'Pinturas',
    phone: '2266-5577',
    website: 'pinturassur.com.ni',
    address: 'Carretera a Masaya Km 8, Managua',
    department: 'Managua',
    latitude: 12.0880,
    longitude: -86.2180,
    hours: 'Lun-Vie 8:00am-5:30pm, Sáb 8:00am-12:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA'],
    products: [
      { title: 'Pintura Sur Vinílica 5 Galones', price: 1250, category: 'Ferretería', tags: 'pintura,sur,vinilica,pared', quantity: 80, description: 'Pintura vinílica Sur, cubeta de 5 galones. Alta cobertura, acabado mate.' },
      { title: 'Barniz Marítimo 1 Galón', price: 680, category: 'Ferretería', tags: 'barniz,maritimo,madera,exterior', quantity: 40, description: 'Barniz marítimo para madera exterior, 1 galón. Resistente a la intemperie.' },
      { title: 'Esmalte Sintético 1 Galón', price: 520, category: 'Ferretería', tags: 'esmalte,sintetico,metal,madera', quantity: 60, description: 'Esmalte sintético de alta brillantez para metal y madera. 1 galón.' },
    ],
  },
  {
    email: 'ventas@energiasolarnica.com',
    name: 'Energía Solar Nicaragua',
    businessName: 'Energía Solar Nicaragua',
    description: 'Energía renovable para Nicaragua. Paneles solares, inversores, baterías y sistemas completos off-grid y on-grid.',
    category: 'Energía Solar',
    phone: '2268-2200',
    website: 'energiasolarnica.com',
    address: 'Colonia Los Robles, Managua',
    department: 'Managua',
    latitude: 12.1280,
    longitude: -86.2630,
    hours: 'Lun-Vie 8:00am-5:00pm, Sáb 9:00am-1:00pm',
    paymentMethods: ['BANPRO', 'BAC', 'LAFISE', 'BILLETERA', 'PAYPAL'],
    products: [
      { title: 'Panel Solar Monocristalino 550W', price: 8500, category: 'Energía', tags: 'panel,solar,monocristalino,energia', quantity: 30, description: 'Panel solar monocristalino 550W, celdas PERC. Eficiencia 21.3%. Garantía 25 años.' },
      { title: 'Inversor Híbrido 5kW', price: 22000, category: 'Energía', tags: 'inversor,híbrido,solar,energia', quantity: 12, description: 'Inversor híbrido 5kW MPPT. Para sistemas on-grid y off-grid con baterías.' },
      { title: 'Batería de Litio 48V 100Ah', price: 28000, category: 'Energía', tags: 'bateria,litio,solar,almacenamiento', quantity: 10, description: 'Batería de litio LiFePO4 48V 100Ah. 5000+ ciclos, BMS integrado.' },
      { title: 'Sistema Solar Completo 3kW', price: 65000, category: 'Energía', tags: 'sistema,solar,completo,energia', quantity: 5, description: 'Kit solar completo 3kW: 6 paneles, inversor, baterías, estructura y cableado.' },
      { title: 'Controlador de Carga MPPT 60A', price: 6500, category: 'Energía', tags: 'controlador,carga,mppt,solar', quantity: 15, description: 'Controlador de carga solar MPPT 60A, 48V. Eficiencia de conversión 99%.' },
    ],
  },
]

// ─── 10+ Nicaragüense Buyers ──────────────────────────────────────────────────
const buyers = [
  { email: 'maria.gonzalez@email.ni', name: 'María González', phone: '8855-1234', department: 'Managua', address: 'Colonia Centroamérica, Managua' },
  { email: 'jose.perez@email.ni', name: 'José Pérez', phone: '8766-5678', department: 'León', address: 'Barrio El Laborío, León' },
  { email: 'carlos.reyes@email.ni', name: 'Carlos Reyes', phone: '8644-9012', department: 'Granada', address: 'Calle La Calzada, Granada' },
  { email: 'ana.rivera@email.ni', name: 'Ana Rivera', phone: '8533-3456', department: 'Masaya', address: 'Mercado de Artesanías, Masaya' },
  { email: 'luis.castillo@email.ni', name: 'Luis Castillo', phone: '8422-7890', department: 'Matagalpa', address: 'Barrio Guanuca, Matagalpa' },
  { email: 'rosa.lopez@email.ni', name: 'Rosa López', phone: '8911-2345', department: 'Estelí', address: 'Barrio Ariel, Estelí' },
  { email: 'pedro.hernandez@email.ni', name: 'Pedro Hernández', phone: '8700-6789', department: 'Chinandega', address: 'Barrio El Viejo, Chinandega' },
  { email: 'carmen.torres@email.ni', name: 'Carmen Torres', phone: '8699-0123', department: 'Managua', address: 'Barrio Martha Quezada, Managua' },
  { email: 'roberto.ruiz@email.ni', name: 'Roberto Ruiz', phone: '8588-4567', department: 'Rivas', address: 'Centro, Rivas' },
  { email: 'lucia.mendoza@email.ni', name: 'Lucía Mendoza', phone: '8477-8901', department: 'Jinotega', address: 'Barrio Santa Fe, Jinotega' },
  { email: 'fernando.sequeira@email.ni', name: 'Fernando Sequeira', phone: '8366-2345', department: 'Boaco', address: 'Centro, Boaco' },
  { email: 'isabel.chamorro@email.ni', name: 'Isabel Chamorro', phone: '8255-6789', department: 'Managua', address: 'Las Colinas, Managua' },
]

// ─── 13 Nicaraguan Holidays (2026 CalendarEvent entries) ──────────────────────
const nicaraguanHolidays = [
  { title: 'Año Nuevo', description: 'Celebración del Año Nuevo 2026', eventType: 'other', eventDate: new Date('2026-01-01T00:00:00'), duration: 1440, notes: 'Feriado nacional - Todos los comercios cerrados' },
  { title: 'Jueves Santo', description: 'Semana Santa - Jueves Santo 2026', eventType: 'other', eventDate: new Date('2026-04-02T00:00:00'), duration: 1440, notes: 'Feriado nacional - Semana Santa' },
  { title: 'Viernes Santo', description: 'Semana Santa - Viernes Santo 2026', eventType: 'other', eventDate: new Date('2026-04-03T00:00:00'), duration: 1440, notes: 'Feriado nacional - Semana Santa' },
  { title: 'Día del Trabajo', description: 'Día Internacional del Trabajo', eventType: 'other', eventDate: new Date('2026-05-01T00:00:00'), duration: 1440, notes: 'Feriado nacional - Día del Trabajo' },
  { title: 'Revolución Popular Sandinista', description: 'Conmemoración del 19 de Julio, Día de la Revolución Popular Sandinista', eventType: 'other', eventDate: new Date('2026-07-19T00:00:00'), duration: 1440, notes: 'Feriado nacional - Celebración patria' },
  { title: 'Batalla de San Jacinto', description: 'Conmemoración de la Batalla de San Jacinto, 14 de septiembre de 1856', eventType: 'other', eventDate: new Date('2026-08-10T00:00:00'), duration: 1440, notes: 'Feriado nacional - Homenaje al héroe Andrés Castro' },
  { title: 'Gritería de la Independencia', description: 'Víspera de la Independencia de Centroamérica - La Gritería', eventType: 'other', eventDate: new Date('2026-09-14T18:00:00'), duration: 360, notes: 'Tradición nicaragüense - ¿Quién causa tanta alegría? ¡La Inmaculada Concepción de María!' },
  { title: 'Independencia de Centroamérica', description: 'Día de la Independencia de Centroamérica, 15 de septiembre de 1821', eventType: 'other', eventDate: new Date('2026-09-15T00:00:00'), duration: 1440, notes: 'Feriado nacional - Desfiles cívicos escolares' },
  { title: 'Día de los Difuntos', description: 'Día de los Fieles Difuntos - Conmemoración a los fallecidos', eventType: 'other', eventDate: new Date('2026-11-02T00:00:00'), duration: 1440, notes: 'Visita a cementerios y misas en memoria de los difuntos' },
  { title: 'Inmaculada Concepción de María', description: 'Día de la Inmaculada Concepción, Patrona de Nicaragua', eventType: 'other', eventDate: new Date('2026-12-08T00:00:00'), duration: 1440, notes: 'Feriado nacional - Patrona de Nicaragua. La Purísima' },
  { title: 'Navidad', description: 'Celebración de la Navidad - Nacimiento del Niño Dios', eventType: 'other', eventDate: new Date('2026-12-25T00:00:00'), duration: 1440, notes: 'Feriado nacional - Celebración familiar' },
  { title: 'Fin de Año', description: 'Nochevieja - Despedida del año 2026', eventType: 'other', eventDate: new Date('2026-12-31T18:00:00'), duration: 360, notes: 'Feriado nacional por la tarde - Cierre de comercios al mediodía' },
  { title: 'Carnaval de la Purísima', description: 'Carnaval en honor a la Purísima Concepción de María', eventType: 'other', eventDate: new Date('2026-08-28T00:00:00'), duration: 720, notes: 'Festividad religiosa y cultural - Carnavales en Managua' },
]

// ─── Main Seed Function ────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 ProveedorConecta Nicaragua - Comprehensive Seed Script')
  console.log('=' .repeat(60))

  // Step 1: Clean existing data
  console.log('\n🧹 Cleaning existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.chatRoom.deleteMany()
  await prisma.cotizacionResponse.deleteMany()
  await prisma.cotizacion.deleteMany()
  await prisma.savedProduct.deleteMany()
  await prisma.like.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.wallPost.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.reviewVote.deleteMany()
  await prisma.review.deleteMany()
  await prisma.pointHistory.deleteMany()
  await prisma.loyaltyPoint.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.quantityDiscount.deleteMany()
  await prisma.advertisement.deleteMany()
  await prisma.commissionLog.deleteMany()
  await prisma.product.deleteMany()
  await prisma.businessProfile.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.phoneVerification.deleteMany()
  await prisma.user.deleteMany()
  console.log('  ✅ All data cleaned')

  // Step 2: Create Admin User (upsert)
  console.log('\n👤 Creating Admin user...')
  const admin = await prisma.user.upsert({
    where: { email: 'rey7214935@gmail.com' },
    update: {},
    create: {
      email: 'rey7214935@gmail.com',
      name: 'Reynaldo Admin',
      password: passwordHash,
      role: 'ADMIN',
      phone: '8999-0000',
      address: 'Managua, Nicaragua',
      department: 'Managua',
      avatar: '',
      isVerified: true,
      emailVerified: true,
      helperRole: 'FULLSTACK',
      website: 'proveedorconecta.com',
      balance: 100000,
    },
  })

  await prisma.businessProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      businessName: 'ProveedorConecta Nicaragua - Admin',
      description: 'Administrador principal de la plataforma ProveedorConecta Nicaragua. Gestión y control del marketplace.',
      category: 'Tecnología y Plataforma',
      address: 'Managua, Nicaragua',
      latitude: 12.1364,
      longitude: -86.2514,
      phone: '8999-0000',
      hours: 'Lun-Vie 8:00am-5:00pm',
      paymentMethods: JSON.stringify(['PAYPAL', 'BANPRO', 'BAC', 'LAFISE', 'BILLETERA']),
      logo: '',
      coverImage: '',
    },
  })
  console.log(`  ✅ Admin: ${admin.email}`)

  // Step 3: Create 32 Seller Users with Business Profiles and Products
  console.log('\n🏢 Creating 32 Nicaraguan Suppliers...')
  let totalProducts = 0
  let supplierCount = 0

  for (const supplier of suppliers) {
    const sellerUser = await prisma.user.create({
      data: {
        email: supplier.email,
        name: supplier.name,
        password: passwordHash,
        role: 'SELLER',
        phone: supplier.phone,
        address: supplier.address,
        department: supplier.department,
        avatar: '',
        website: supplier.website,
        isVerified: true,
        emailVerified: true,
        balance: 25000,
      },
    })

    await prisma.businessProfile.create({
      data: {
        userId: sellerUser.id,
        businessName: supplier.businessName,
        description: supplier.description,
        category: supplier.category,
        address: supplier.address,
        latitude: supplier.latitude,
        longitude: supplier.longitude,
        phone: supplier.phone,
        hours: supplier.hours,
        paymentMethods: JSON.stringify(supplier.paymentMethods),
        logo: '',
        coverImage: '',
      },
    })

    let productCount = 0
    for (const product of supplier.products) {
      await prisma.product.create({
        data: {
          sellerId: sellerUser.id,
          title: product.title,
          description: product.description,
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
      productCount++
      totalProducts++
    }

    supplierCount++
    console.log(`  ✅ [${supplierCount}/32] ${supplier.businessName} (${productCount} productos) - ${supplier.department}`)
  }

  // Step 4: Create 12 Nicaragüense Buyer Users
  console.log('\n🛒 Creating 12 Nicaragüense Buyers...')
  let buyerCount = 0

  for (const buyer of buyers) {
    await prisma.user.create({
      data: {
        email: buyer.email,
        name: buyer.name,
        password: passwordHash,
        role: 'BUYER',
        phone: buyer.phone,
        address: buyer.address,
        department: buyer.department,
        avatar: '',
        isVerified: true,
        emailVerified: true,
        balance: 50000,
      },
    })
    buyerCount++
    console.log(`  ✅ [${buyerCount}/12] ${buyer.name} - ${buyer.department}`)
  }

  // Step 5: Create 13 Nicaraguan Holiday CalendarEvents for admin
  console.log('\n📅 Creating 13 Nicaraguan Holidays for 2026...')
  let holidayCount = 0

  for (const holiday of nicaraguanHolidays) {
    await prisma.calendarEvent.create({
      data: {
        userId: admin.id,
        title: holiday.title,
        description: holiday.description,
        eventType: holiday.eventType,
        eventDate: holiday.eventDate,
        duration: holiday.duration,
        notes: holiday.notes,
      },
    })
    holidayCount++
    console.log(`  ✅ [${holidayCount}/13] ${holiday.title}`)
  }

  // Step 6: Create some sample notifications
  console.log('\n🔔 Creating sample notifications...')
  const firstBuyer = await prisma.user.findFirst({ where: { role: 'BUYER' } })
  const firstSeller = await prisma.user.findFirst({ where: { role: 'SELLER' } })

  if (firstBuyer && firstSeller) {
    await prisma.notification.createMany({
      data: [
        { userId: firstBuyer.id, type: 'WELCOME', title: '¡Bienvenido a ProveedorConecta Nicaragua!', message: 'Explora miles de productos de proveedores nicaragüenses. Conecta con los mejores suppliers del país.' },
        { userId: firstSeller.id, type: 'WELCOME', title: '¡Tu tienda está lista!', message: 'Comienza a publicar productos y llega a más clientes en toda Nicaragua.' },
        { userId: admin.id, type: 'WELCOME', title: 'Panel de Administración', message: 'Gestiona la plataforma ProveedorConecta Nicaragua desde el panel de administración.' },
      ],
    })
    console.log('  ✅ 3 sample notifications created')
  }

  // Step 7: Create some sample follows
  console.log('\n👥 Creating sample follows...')
  const allBuyers = await prisma.user.findMany({ where: { role: 'BUYER' }, take: 5 })
  const allSellers = await prisma.user.findMany({ where: { role: 'SELLER' }, take: 5 })

  let followCount = 0
  for (const buyerUser of allBuyers) {
    for (const sellerUser of allSellers) {
      if (Math.random() > 0.5) {
        try {
          await prisma.follow.create({
            data: {
              followerId: buyerUser.id,
              followingId: sellerUser.id,
            },
          })
          followCount++
        } catch {
          // Skip duplicates
        }
      }
    }
  }
  console.log(`  ✅ ${followCount} sample follows created`)

  // Final Summary
  const totalUsers = await prisma.user.count()
  const totalSellers = await prisma.user.count({ where: { role: 'SELLER' } })
  const totalBuyers = await prisma.user.count({ where: { role: 'BUYER' } })
  const totalProductsCount = await prisma.product.count()
  const totalHolidays = await prisma.calendarEvent.count()
  const totalBusinessProfiles = await prisma.businessProfile.count()

  console.log('\n' + '=' .repeat(60))
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!')
  console.log('=' .repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`  👤 Total Users: ${totalUsers}`)
  console.log(`    🏢 Sellers:  ${totalSellers}`)
  console.log(`    🛒 Buyers:   ${totalBuyers}`)
  console.log(`    ⚙️  Admin:    1`)
  console.log(`  📦 Products:        ${totalProductsCount}`)
  console.log(`  🏪 Business Profiles: ${totalBusinessProfiles}`)
  console.log(`  📅 Calendar Events: ${totalHolidays}`)
  console.log(`\n📧 Login Credentials:`)
  console.log(`  Admin:  rey7214935@gmail.com / admin123`)
  console.log(`  Sellers: {supplier email} / admin123`)
  console.log(`  Buyers:  {buyer email} / admin123`)
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
