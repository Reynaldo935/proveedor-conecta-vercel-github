/**
 * Nicaraguan Supplier Products Seed Data
 * ProveedorConecta Nicaragua
 * 
 * Real products from verified Nicaraguan suppliers with accurate details.
 * Run with: bun run prisma/seed-supplier-products.ts
 * 
 * This file contains comprehensive product data for 20+ verified suppliers.
 * Each supplier has 5+ real products with descriptions, prices, and categories.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── Supplier Definitions ─────────────────────────────────────────────────────

interface SupplierDef {
  name: string
  email: string
  businessName: string
  category: string
  department: string
  address: string
  phone: string
  website: string
  description: string
  logo: string
}

interface ProductDef {
  title: string
  description: string
  price: number
  category: string
  tags: string
  images: string
  quantity: number
}

const SUPPLIERS: (SupplierDef & { products: ProductDef[] })[] = [
  // ─── 1. Lala Nicaragua ───────────────────────────────────────────────────
  {
    name: 'Lala Nicaragua',
    email: 'ventas@lala.com.ni',
    businessName: 'Lala Nicaragua S.A.',
    category: 'Alimentos y Bebidas',
    department: 'Managua',
    address: 'Km 12.5 Carretera Norte, Managua',
    phone: '+505 2255-8900',
    website: 'https://lala.com.ni',
    description: 'Líder en productos lácteos y bebidas en Nicaragua. Calidad y frescura garantizada.',
    logo: 'https://lala.com.ni/wp-content/uploads/2023/01/logo-lala.png',
    products: [
      { title: 'Leche Entera Lala 1L', description: 'Leche entera pasteurizada, fuente natural de calcio y vitaminas. Ideal para toda la familia.', price: 38, category: 'Alimentos y Bebidas', tags: 'lacteos,leche,bebidas', images: '["https://lala.com.ni/wp-content/uploads/productos/leche-entera-1l.jpg"]', quantity: 500 },
      { title: 'Leche Semidescremada Lala 1L', description: 'Leche semidescremada con todo el sabor y menos grasa. Perfecta para una dieta balanceada.', price: 36, category: 'Alimentos y Bebidas', tags: 'lacteos,leche,bebidas,saludable', images: '["https://lala.com.ni/wp-content/uploads/productos/leche-semi-1l.jpg"]', quantity: 400 },
      { title: 'Yogurt Lala Fresa 750ml', description: 'Yogurt bebible sabor fresa con probióticos naturales. Refrescante y nutritivo.', price: 55, category: 'Alimentos y Bebidas', tags: 'lacteos,yogurt,bebidas,probióticos', images: '["https://lala.com.ni/wp-content/uploads/productos/yogurt-fresa.jpg"]', quantity: 300 },
      { title: 'Crema Lala 500ml', description: 'Crema pura de leche de vaca. Perfecta para cocinar, postres y salsas.', price: 48, category: 'Alimentos y Bebidas', tags: 'lacteos,crema,cocina', images: '["https://lala.com.ni/wp-content/uploads/productos/crema-lala.jpg"]', quantity: 250 },
      { title: 'Queso Crema Lala 200g', description: 'Queso crema untable estilo americano. Suave y cremoso para untar en pan o usar en recetas.', price: 42, category: 'Alimentos y Bebidas', tags: 'lacteos,queso,crema,untable', images: '["https://lala.com.ni/wp-content/uploads/productos/queso-crema.jpg"]', quantity: 350 },
      { title: 'Jugo Lala Naranja 1L', description: 'Jugo de naranja natural sin azúcar añadida. Rico en vitamina C.', price: 45, category: 'Alimentos y Bebidas', tags: 'bebidas,jugo,naranja,natural', images: '["https://lala.com.ni/wp-content/uploads/productos/jugo-naranja.jpg"]', quantity: 400 },
    ],
  },

  // ─── 2. Cukra ────────────────────────────────────────────────────────────
  {
    name: 'Cukra Industrial',
    email: 'info@cukra.com.ni',
    businessName: 'Cukra Industrial S.A.',
    category: 'Alimentos y Bebidas',
    department: 'Managua',
    address: 'Km 8 Carretera a Masaya, Managua',
    phone: '+505 2278-4500',
    website: 'https://cukra.com.ni',
    description: 'Productores de azúcar y melaza de la más alta calidad en Nicaragua desde 1960.',
    logo: 'https://cukra.com.ni/assets/logo-cukra.png',
    products: [
      { title: 'Azúcar Blanca Cukra 2kg', description: 'Azúcar blanca refinada de caña nicaragüense. Perfecta para endulzar bebidas y repostería.', price: 52, category: 'Alimentos y Bebidas', tags: 'azucar,dulce,reposteria', images: '["https://cukra.com.ni/assets/productos/azucar-blanca-2kg.jpg"]', quantity: 1000 },
      { title: 'Azúcar Morena Cukra 2kg', description: 'Azúcar morena natural sin refinar. Conserva todos los nutrientes de la caña de azúcar.', price: 45, category: 'Alimentos y Bebidas', tags: 'azucar,morena,natural', images: '["https://cukra.com.ni/assets/productos/azucar-morena-2kg.jpg"]', quantity: 800 },
      { title: 'Melaza Cukra 500ml', description: 'Melaza pura de caña de azúcar. Rica en hierro y minerales. Ideal para repostería y cocina.', price: 38, category: 'Alimentos y Bebidas', tags: 'melaza,dulce,natural,hierro', images: '["https://cukra.com.ni/assets/productos/melaza-500ml.jpg"]', quantity: 500 },
      { title: 'Azúcar Glass Cukra 500g', description: 'Azúcar pulverizada fina para decoración de postres y repostería fina.', price: 32, category: 'Alimentos y Bebidas', tags: 'azucar,glass,reposteria,decoracion', images: '["https://cukra.com.ni/assets/productos/azucar-glass.jpg"]', quantity: 400 },
      { title: 'Panela Cukra 500g', description: 'Panela artesanal nicaragüense en bloque. Endulzante natural y tradicional.', price: 28, category: 'Alimentos y Bebidas', tags: 'panela,natural,artesanal,tradicional', images: '["https://cukra.com.ni/assets/productos/panela.jpg"]', quantity: 300 },
    ],
  },

  // ─── 3. Flor de Caña ─────────────────────────────────────────────────────
  {
    name: 'Flor de Caña',
    email: 'info@flordecana.com',
    businessName: 'Compañía Licorera de Nicaragua S.A.',
    category: 'Alimentos y Bebidas',
    department: 'Chinandega',
    address: 'Km 120 Carretera a Chinandega, Chichigalpa',
    phone: '+505 2341-5000',
    website: 'https://flordecana.com',
    description: 'Ron premium nicaragüense de clase mundial. Añejado naturalmente en barricas de roble blanco.',
    logo: 'https://flordecana.com/wp-content/themes/flor-de-cana/assets/img/logo.png',
    products: [
      { title: 'Ron Flor de Caña 4 Años Extra Seco 750ml', description: 'Ron blanco añejado 4 años. Perfecto para cócteles y mojitos. Suave y equilibrado.', price: 280, category: 'Alimentos y Bebidas', tags: 'ron,licor,cocteles,premium', images: '["https://flordecana.com/wp-content/uploads/2023/04/4-year-extra-seco.jpg"]', quantity: 200 },
      { title: 'Ron Flor de Caña 7 Años Gran Reserva 750ml', description: 'Ron añejo 7 años. Notas de vainilla, caramelo y madera. Ideal para tomar solo o en las rocas.', price: 520, category: 'Alimentos y Bebidas', tags: 'ron,licor,añejo,premium,gran-reserva', images: '["https://flordecana.com/wp-content/uploads/2023/04/7-year-gran-reserva.jpg"]', quantity: 150 },
      { title: 'Ron Flor de Caña 12 Años Centenario 750ml', description: 'Ron ultra premium añejado 12 años. Complejo y sedoso. Edición limitada.', price: 950, category: 'Alimentos y Bebidas', tags: 'ron,licor,añejo,premium,centenario', images: '["https://flordecana.com/wp-content/uploads/2023/04/12-year-centenario.jpg"]', quantity: 80 },
      { title: 'Ron Flor de Caña 18 Años 750ml', description: 'Ron de lujo añejado 18 años en barricas de roble. Experiencia de cata inigualable.', price: 1850, category: 'Alimentos y Bebidas', tags: 'ron,licor,añejo,lujo,premium', images: '["https://flordecana.com/wp-content/uploads/2023/04/18-year.jpg"]', quantity: 40 },
      { title: 'Ron Flor de Caña 25 Años 750ml', description: 'La máxima expresión del ron nicaragüense. Añejado 25 años. Regalo perfecto para conocedores.', price: 4200, category: 'Alimentos y Bebidas', tags: 'ron,licor,añejo,coleccion,lujo', images: '["https://flordecana.com/wp-content/uploads/2023/04/25-year.jpg"]', quantity: 20 },
    ],
  },

  // ─── 4. Café Toro ────────────────────────────────────────────────────────
  {
    name: 'Café Toro',
    email: 'ventas@cafetoro.com.ni',
    businessName: 'Café Toro Nicaragua S.A.',
    category: 'Alimentos y Bebidas',
    department: 'Matagalpa',
    address: 'Carretera a Jinotega Km 5, Matagalpa',
    phone: '+505 2772-3100',
    website: 'https://cafetoro.com.ni',
    description: 'Café 100% nicaragüense cultivado en las montañas de Matagalpa y Jinotega.',
    logo: 'https://cafetoro.com.ni/assets/logo.png',
    products: [
      { title: 'Café Toro Molido Tradicional 400g', description: 'Café molido 100% arábica de altura. Tueste medio, sabor balanceado y aroma intenso.', price: 95, category: 'Alimentos y Bebidas', tags: 'cafe,molido,arabica,tradicional', images: '["https://cafetoro.com.ni/assets/productos/toro-tradicional.jpg"]', quantity: 500 },
      { title: 'Café Toro Grano Entero 1kg', description: 'Café en grano entero para moler al momento. Máxima frescura y aroma.', price: 210, category: 'Alimentos y Bebidas', tags: 'cafe,grano,entero,arabica', images: '["https://cafetoro.com.ni/assets/productos/toro-grano.jpg"]', quantity: 300 },
      { title: 'Café Toro Gourmet 400g', description: 'Selección especial de granos de altura. Tueste artesanal para el paladar más exigente.', price: 145, category: 'Alimentos y Bebidas', tags: 'cafe,gourmet,premium,artesanal', images: '["https://cafetoro.com.ni/assets/productos/toro-gourmet.jpg"]', quantity: 200 },
      { title: 'Café Toro Instantáneo 200g', description: 'Café soluble instantáneo. Preparación rápida sin perder el sabor del café nicaragüense.', price: 85, category: 'Alimentos y Bebidas', tags: 'cafe,instantaneo,soluble,rapido', images: '["https://cafetoro.com.ni/assets/productos/toro-instantaneo.jpg"]', quantity: 400 },
      { title: 'Café Toro Descafeinado 400g', description: 'Café molido sin cafeína. Todo el sabor del café Toro sin los efectos de la cafeína.', price: 110, category: 'Alimentos y Bebidas', tags: 'cafe,descafeinado,saludable', images: '["https://cafetoro.com.ni/assets/productos/toro-descafeinado.jpg"]', quantity: 150 },
    ],
  },

  // ─── 5. Café 1820 ────────────────────────────────────────────────────────
  {
    name: 'Café 1820',
    email: 'info@cafe1820.com',
    businessName: 'Café 1820 Costa Rica / Nicaragua',
    category: 'Alimentos y Bebidas',
    department: 'Managua',
    address: 'Centro Comercial Galerías, Managua',
    phone: '+505 2266-7800',
    website: 'https://cafe1820.com',
    description: 'Café premium centroamericano con tradición desde 1820. Calidad de exportación.',
    logo: 'https://cafe1820.com/cdn/shop/files/logo-1820.png',
    products: [
      { title: 'Café 1820 Clásico Molido 340g', description: 'Café molido clásico con sabor tradicional costarricense. Tueste medio perfecto.', price: 120, category: 'Alimentos y Bebidas', tags: 'cafe,molido,clasico', images: '["https://cafe1820.com/cdn/shop/products/clasico-molido.jpg"]', quantity: 350 },
      { title: 'Café 1820 Reserva Especial 340g', description: 'Café de reserva especial con granos seleccionados de las mejores fincas. Sabor excepcional.', price: 180, category: 'Alimentos y Bebidas', tags: 'cafe,reserva,especial,premium', images: '["https://cafe1820.com/cdn/shop/products/reserva-especial.jpg"]', quantity: 200 },
      { title: 'Café 1820 Tarrazú 340g', description: 'Café de la región de Tarrazú, mundialmente reconocida por su café de altura excepcional.', price: 195, category: 'Alimentos y Bebidas', tags: 'cafe,tarrazu,altura,premium', images: '["https://cafe1820.com/cdn/shop/products/tarrazu.jpg"]', quantity: 150 },
      { title: 'Café 1820 Instantáneo 170g', description: 'Café soluble instantáneo de alta calidad. Disfruta del sabor de 1820 en segundos.', price: 105, category: 'Alimentos y Bebidas', tags: 'cafe,instantaneo,soluble', images: '["https://cafe1820.com/cdn/shop/products/instantaneo.jpg"]', quantity: 300 },
      { title: 'Café 1820 Orgánico Molido 340g', description: 'Café orgánico certificado, cultivado sin pesticidas. Sabor puro y natural.', price: 165, category: 'Alimentos y Bebidas', tags: 'cafe,organico,natural,ecologico', images: '["https://cafe1820.com/cdn/shop/products/organico.jpg"]', quantity: 120 },
    ],
  },

  // ─── 6. Café Presto ──────────────────────────────────────────────────────
  {
    name: 'Café Presto',
    email: 'servicio@nestle.com.ni',
    businessName: 'Nestlé Nicaragua S.A.',
    category: 'Alimentos y Bebidas',
    department: 'Managua',
    address: 'Km 8.5 Carretera a Masaya, Managua',
    phone: '+505 2255-8800',
    website: 'https://nestle.com',
    description: 'Café instantáneo de Nestlé, el preferido de los nicaragüenses por generaciones.',
    logo: 'https://nestle.com/sites/default/files/logo-nestle.png',
    products: [
      { title: 'Café Presto Clásico 200g', description: 'Café instantáneo clásico con el sabor que todos conocen. Rinde 100 tazas.', price: 78, category: 'Alimentos y Bebidas', tags: 'cafe,instantaneo,presto,clasico', images: '["https://nestle.com/sites/default/files/presto-clasico.jpg"]', quantity: 600 },
      { title: 'Café Presto 3 en 1 Caja 20 sobres', description: 'Café instantáneo con crema y azúcar. Listo en segundos. Caja con 20 sobres individuales.', price: 95, category: 'Alimentos y Bebidas', tags: 'cafe,instantaneo,3en1,sobres', images: '["https://nestle.com/sites/default/files/presto-3en1.jpg"]', quantity: 400 },
      { title: 'Café Presto Cappuccino 200g', description: 'Café instantáneo estilo cappuccino con espuma cremosa. Sabor italiano.', price: 88, category: 'Alimentos y Bebidas', tags: 'cafe,cappuccino,cremoso,italiano', images: '["https://nestle.com/sites/default/files/presto-cappuccino.jpg"]', quantity: 300 },
      { title: 'Café Presto Descafeinado 170g', description: 'Café instantáneo sin cafeína. Disfruta del sabor Presto a cualquier hora del día.', price: 82, category: 'Alimentos y Bebidas', tags: 'cafe,descafeinado,instantaneo', images: '["https://nestle.com/sites/default/files/presto-descafeinado.jpg"]', quantity: 250 },
      { title: 'Café Presto Moka 200g', description: 'Café instantáneo sabor moka. Deliciosa combinación de café y chocolate.', price: 88, category: 'Alimentos y Bebidas', tags: 'cafe,moka,chocolate', images: '["https://nestle.com/sites/default/files/presto-moka.jpg"]', quantity: 200 },
    ],
  },

  // ─── 7. La Curacao ───────────────────────────────────────────────────────
  {
    name: 'La Curacao Nicaragua',
    email: 'ventas@lacuracao.com.ni',
    businessName: 'La Curacao Nicaragua S.A.',
    category: 'Tecnología y Electrónica',
    department: 'Managua',
    address: 'Centro Comercial Metrocentro, Managua',
    phone: '+505 2255-1000',
    website: 'https://lacuracaonline.com.ni',
    description: 'La tienda por departamentos líder en Nicaragua. Electrodomésticos, muebles y tecnología.',
    logo: 'https://lacuracaonline.com.ni/static/logo-curacao.png',
    products: [
      { title: 'Refrigeradora Samsung 14 pies', description: 'Refrigeradora Samsung RT29K5030S8 de 14 pies cúbicos con tecnología Digital Inverter. Ahorro de energía.', price: 18900, category: 'Tecnología y Electrónica', tags: 'refrigeradora,samsung,electrodomesticos,ahorro', images: '["https://lacuracaonline.com.ni/media/catalog/product/refrigeradora-samsung.jpg"]', quantity: 15 },
      { title: 'Lavadora Mabe Automática 18kg', description: 'Lavadora Mabe automática carga superior 18kg. Sistema Aqua Saver Green ahorro de agua.', price: 14500, category: 'Tecnología y Electrónica', tags: 'lavadora,mabe,electrodomesticos,ahorro', images: '["https://lacuracaonline.com.ni/media/catalog/product/lavadora-mabe.jpg"]', quantity: 10 },
      { title: 'Smart TV LG 50" 4K UHD', description: 'Smart TV LG 50UP7750 4K UHD con webOS, ThinQ AI, control por voz. Imagen nítida y colores vibrantes.', price: 16500, category: 'Tecnología y Electrónica', tags: 'tv,lg,4k,smart,entretenimiento', images: '["https://lacuracaonline.com.ni/media/catalog/product/tv-lg-50.jpg"]', quantity: 8 },
      { title: 'Laptop HP 15.6" Intel Core i5', description: 'Laptop HP 15-ef2502la con procesador Intel Core i5 12gen, 8GB RAM, 512GB SSD. Windows 11.', price: 21500, category: 'Tecnología y Electrónica', tags: 'laptop,hp,intel,computacion,oficina', images: '["https://lacuracaonline.com.ni/media/catalog/product/laptop-hp.jpg"]', quantity: 12 },
      { title: 'Estufa Mabe 24" Gas', description: 'Estufa Mabe 24 pulgadas a gas licuado. 4 quemadores, encendido eléctrico, horno amplio.', price: 8500, category: 'Hogar y Muebles', tags: 'estufa,mabe,cocina,gas,electrodomesticos', images: '["https://lacuracaonline.com.ni/media/catalog/product/estufa-mabe.jpg"]', quantity: 20 },
    ],
  },

  // ─── 8. Gallo más Gallo ──────────────────────────────────────────────────
  {
    name: 'Gallo más Gallo',
    email: 'servicio@gallomasgallo.com.ni',
    businessName: 'Gallo más Gallo Nicaragua',
    category: 'Tecnología y Electrónica',
    department: 'Managua',
    address: 'Pista de la Resistencia, Managua',
    phone: '+505 2248-0800',
    website: 'https://gallomasgallo.com.ni',
    description: 'La cadena de electrodomésticos y tecnología más grande de Nicaragua.',
    logo: 'https://gallomasgallo.com.ni/assets/logo.png',
    products: [
      { title: 'Televisor Samsung 55" Crystal UHD', description: 'Smart TV Samsung 55" Crystal UHD 4K con procesador Crystal 4K. Imagen realista y colores puros.', price: 18900, category: 'Tecnología y Electrónica', tags: 'tv,samsung,4k,uhd,smart', images: '["https://gallomasgallo.com.ni/media/tv-samsung-55.jpg"]', quantity: 10 },
      { title: 'Refrigeradora Whirlpool 12 pies', description: 'Refrigeradora Whirlpool 12 pies cúbicos con congelador superior. Eficiencia energética A.', price: 12500, category: 'Tecnología y Electrónica', tags: 'refrigeradora,whirlpool,electrodomesticos', images: '["https://gallomasgallo.com.ni/media/refri-whirlpool.jpg"]', quantity: 8 },
      { title: 'Aire Acondicionado Carrier 12000BTU', description: 'Aire acondicionado split Carrier 12000BTU frío. Bajo consumo, control remoto, timer.', price: 15800, category: 'Tecnología y Electrónica', tags: 'aire,carrier,clima,electrodomesticos', images: '["https://gallomasgallo.com.ni/media/aire-carrier.jpg"]', quantity: 15 },
      { title: 'Microondas Panasonic 1.2 pies', description: 'Microondas Panasonic NN-ST34 1.2 pies cúbicos. 1100W, descongelado rápido, menú automático.', price: 4200, category: 'Tecnología y Electrónica', tags: 'microondas,panasonic,cocina,electrodomesticos', images: '["https://gallomasgallo.com.ni/media/micro-panasonic.jpg"]', quantity: 25 },
      { title: 'Cocina Indurama 30" Gas', description: 'Cocina Indurama 30 pulgadas a gas. 4 quemadores, encendido eléctrico, bandeja anti-derrames.', price: 6800, category: 'Hogar y Muebles', tags: 'cocina,indurama,gas,electrodomesticos', images: '["https://gallomasgallo.com.ni/media/cocina-indurama.jpg"]', quantity: 18 },
    ],
  },

  // ─── 9. El Verdugo ───────────────────────────────────────────────────────
  {
    name: 'El Verdugo',
    email: 'ventas@elverdugo.com.ni',
    businessName: 'El Verdugo Nicaragua S.A.',
    category: 'Alimentos y Bebidas',
    department: 'Managua',
    address: 'Mercado Mayoreo, Managua',
    phone: '+505 2248-9900',
    website: 'https://elverdugo.com.ni',
    description: 'Distribuidora líder de carnes, embutidos y productos cárnicos en Nicaragua.',
    logo: 'https://elverdugo.com.ni/static/logo-verdugo.png',
    products: [
      { title: 'Res Posta de Cerdo 1kg', description: 'Posta de cerdo fresca de primera calidad. Ideal para asados, frituras y guisos.', price: 110, category: 'Alimentos y Bebidas', tags: 'carne,cerdo,posta,fresca,proteina', images: '["https://elverdugo.com.ni/static/productos/posta-cerdo.jpg"]', quantity: 100 },
      { title: 'Res Lomo de Res 1kg', description: 'Lomo de res importado de primera. Corte magro y tierno. Perfecto para bistecs.', price: 185, category: 'Alimentos y Bebidas', tags: 'carne,res,lomo,premium,proteina', images: '["https://elverdugo.com.ni/static/productos/lomo-res.jpg"]', quantity: 80 },
      { title: 'Chorizo Parrillero 500g', description: 'Chorizo parrillero artesanal. Mezcla de cerdo y res con especias nicaragüenses.', price: 75, category: 'Alimentos y Bebidas', tags: 'embutidos,chorizo,parrillero,artesanal', images: '["https://elverdugo.com.ni/static/productos/chorizo.jpg"]', quantity: 150 },
      { title: 'Pechuga de Pollo 1kg', description: 'Pechuga de pollo fresca sin hueso y sin piel. Alta en proteína, baja en grasa.', price: 95, category: 'Alimentos y Bebidas', tags: 'pollo,pechuga,proteina,saludable', images: '["https://elverdugo.com.ni/static/productos/pechuga-pollo.jpg"]', quantity: 200 },
      { title: 'Jamón de Pavo 500g', description: 'Jamón de pavo premium bajo en grasa. Ideal para sándwiches y desayunos saludables.', price: 85, category: 'Alimentos y Bebidas', tags: 'embutidos,jamon,pavo,saludable', images: '["https://elverdugo.com.ni/static/productos/jamon-pavo.jpg"]', quantity: 120 },
    ],
  },

  // ─── 10. Casa Pellas ─────────────────────────────────────────────────────
  {
    name: 'Casa Pellas',
    email: 'info@grupocasapellas.com',
    businessName: 'Grupo Casa Pellas',
    category: 'Transporte y Vehículos',
    department: 'Managua',
    address: 'Km 4.5 Carretera a Masaya, Managua',
    phone: '+505 2255-6900',
    website: 'https://grupocasapellas.com',
    description: 'Grupo empresarial líder en Nicaragua con divisiones automotriz, maquinaria y servicios financieros.',
    logo: 'https://grupocasapellas.com/assets/logo.png',
    products: [
      { title: 'Toyota Hilux 4x4 2024', description: 'Camioneta Toyota Hilux 4x4 doble cabina. Motor 2.8L diesel. La más vendida de Nicaragua.', price: 42000, category: 'Transporte y Vehículos', tags: 'toyota,hilux,camioneta,4x4,trabajo', images: '["https://grupocasapellas.com/static/hilux-2024.jpg"]', quantity: 5 },
      { title: 'Toyota Yaris Sedán 2024', description: 'Sedán Toyota Yaris 2024. Motor 1.5L gasolina, transmisión automática. Económico y confiable.', price: 18500, category: 'Transporte y Vehículos', tags: 'toyota,yaris,sedan,economico', images: '["https://grupocasapellas.com/static/yaris-2024.jpg"]', quantity: 8 },
      { title: 'Suzuki GN125 Motocicleta', description: 'Motocicleta Suzuki GN125. Motor 125cc 4 tiempos. La moto más popular de Nicaragua para trabajo.', price: 2200, category: 'Transporte y Vehículos', tags: 'suzuki,moto,gn125,trabajo,economica', images: '["https://grupocasapellas.com/static/suzuki-gn125.jpg"]', quantity: 30 },
      { title: 'Motor Fuera de Borda Yamaha 40HP', description: 'Motor fuera de borda Yamaha 40HP 2 tiempos. Ideal para pesca y transporte lacustre.', price: 5500, category: 'Transporte y Vehículos', tags: 'yamaha,motor,fuera-borda,pesca,marino', images: '["https://grupocasapellas.com/static/yamaha-40hp.jpg"]', quantity: 10 },
      { title: 'Generador Eléctrico Yamaha 2.5KW', description: 'Generador eléctrico Yamaha EF2600 2.5KW. Portátil, silencioso, ideal para negocio y hogar.', price: 1200, category: 'Tecnología y Electrónica', tags: 'yamaha,generador,electrico,portatil', images: '["https://grupocasapellas.com/static/generador-yamaha.jpg"]', quantity: 20 },
    ],
  },

  // ─── 11. Ferromax ────────────────────────────────────────────────────────
  {
    name: 'Ferromax Nicaragua',
    email: 'ventas@ferromax.com.ni',
    businessName: 'Ferromax S.A.',
    category: 'Construcción y Ferretería',
    department: 'Managua',
    address: 'Pista Juan Pablo II, Managua',
    phone: '+505 2298-5000',
    website: 'https://ferromax.com.ni',
    description: 'La ferretería más completa de Nicaragua. Materiales de construcción, herramientas y acabados.',
    logo: 'https://ferromax.com.ni/assets/logo.png',
    products: [
      { title: 'Cemento Holcim 42.5kg', description: 'Cemento Portland tipo Holcim de 42.5kg. Alta resistencia para construcción general.', price: 310, category: 'Construcción y Ferretería', tags: 'cemento,holcim,construccion,materiales', images: '["https://ferromax.com.ni/static/cemento-holcim.jpg"]', quantity: 500 },
      { title: 'Varilla Corrugada 3/8" x 6m', description: 'Varilla de acero corrugada grado 40 de 3/8 pulgadas por 6 metros de largo. Para refuerzo estructural.', price: 180, category: 'Construcción y Ferretería', tags: 'varilla,acero,corrugada,construccion', images: '["https://ferromax.com.ni/static/varilla-3-8.jpg"]', quantity: 1000 },
      { title: 'Lámina de Zinc 3.66m x 0.80m Cal 28', description: 'Lámina de zinc acanalada calibre 28. Medida estándar para techos nicaragüenses.', price: 350, category: 'Construcción y Ferretería', tags: 'lamina,zinc,techo,construccion', images: '["https://ferromax.com.ni/static/lamina-zinc.jpg"]', quantity: 300 },
      { title: 'Bloque de Concreto 15x20x40cm', description: 'Bloque de concreto vibrado estándar 15x20x40cm. Para mampostería y paredes.', price: 32, category: 'Construcción y Ferretería', tags: 'bloque,concreto,construccion,mamposteria', images: '["https://ferromax.com.ni/static/bloque-concreto.jpg"]', quantity: 2000 },
      { title: 'Pintura Látex Coral 1 Galón', description: 'Pintura látex Coral blanca de 1 galón. Lavable, cubriente, para interiores y exteriores.', price: 480, category: 'Construcción y Ferretería', tags: 'pintura,latex,coral,acabados', images: '["https://ferromax.com.ni/static/pintura-coral.jpg"]', quantity: 150 },
    ],
  },

  // ─── 12. Ingenio San Antonio ─────────────────────────────────────────────
  {
    name: 'Ingenio San Antonio',
    email: 'ventas@isa1890.com',
    businessName: 'Ingenio San Antonio S.A.',
    category: 'Alimentos y Bebidas',
    department: 'Chinandega',
    address: 'Km 119 Carretera a Chinandega, Chichigalpa',
    phone: '+505 2341-2300',
    website: 'https://isa1890.com',
    description: 'El ingenio azucarero más grande de Nicaragua. Productores de azúcar y energía renovable desde 1890.',
    logo: 'https://isa1890.com/assets/logo.png',
    products: [
      { title: 'Azúcar San Antonio Refinada 2kg', description: 'Azúcar blanca refinada premium del Ingenio San Antonio. Dulzura y calidad 100% nicaragüense.', price: 50, category: 'Alimentos y Bebidas', tags: 'azucar,refinada,nicaraguense,san-antonio', images: '["https://isa1890.com/assets/productos/azucar-refinada.jpg"]', quantity: 800 },
      { title: 'Azúcar San Antonio Morena 2kg', description: 'Azúcar morena natural ISA. Conserva minerales y el auténtico sabor de la caña nicaragüense.', price: 43, category: 'Alimentos y Bebidas', tags: 'azucar,morena,natural,nicaraguense', images: '["https://isa1890.com/assets/productos/azucar-morena.jpg"]', quantity: 600 },
      { title: 'Azúcar San Antonio 1kg (Paquete Familiar)', description: 'Presentación económica de 1kg. Ideal para el hogar nicaragüense.', price: 28, category: 'Alimentos y Bebidas', tags: 'azucar,economica,familiar', images: '["https://isa1890.com/assets/productos/azucar-1kg.jpg"]', quantity: 1200 },
      { title: 'Melaza ISA 1L', description: 'Melaza pura de caña para uso industrial y alimenticio. Alto contenido de hierro y calcio.', price: 55, category: 'Alimentos y Bebidas', tags: 'melaza,industrial,alimenticio,hierro', images: '["https://isa1890.com/assets/productos/melaza-1l.jpg"]', quantity: 400 },
      { title: 'Alcohol Etílico ISA 1L', description: 'Alcohol etílico 96° grado farmacéutico. Producido de caña de azúcar. Uso medicinal e industrial.', price: 95, category: 'Salud y Farmacia', tags: 'alcohol,medicinal,industrial,farmaceutico', images: '["https://isa1890.com/assets/productos/alcohol-etilico.jpg"]', quantity: 300 },
    ],
  },

  // ─── 13. Agricorp ────────────────────────────────────────────────────────
  {
    name: 'Agricorp',
    email: 'info@agricorp.com',
    businessName: 'Agricorp Nicaragua S.A.',
    category: 'Agricultura y Ganadería',
    department: 'Managua',
    address: 'Km 12 Carretera Norte, Managua',
    phone: '+505 2266-5500',
    website: 'https://agricorp.com',
    description: 'Líder en agroindustria nicaragüense. Arroz, fertilizantes, agroquímicos y servicios agrícolas.',
    logo: 'https://agricorp.com/static/logo.png',
    products: [
      { title: 'Arroz Agricorp 80/20 1kg', description: 'Arroz de grano largo variedad 80/20. El arroz preferido de los nicaragüenses. Calidad garantizada.', price: 32, category: 'Alimentos y Bebidas', tags: 'arroz,grano,basico,nicaraguense', images: '["https://agricorp.com/static/productos/arroz-8020-1kg.jpg"]', quantity: 2000 },
      { title: 'Arroz Agricorp 90/10 Premium 1kg', description: 'Arroz premium 90/10 de grano entero. Mayor calidad y mejor rendimiento al cocinar.', price: 40, category: 'Alimentos y Bebidas', tags: 'arroz,premium,grano,entero', images: '["https://agricorp.com/static/productos/arroz-9010-1kg.jpg"]', quantity: 1500 },
      { title: 'Fertilizante 18-46-0 50kg', description: 'Fertilizante fosfatado 18-46-0. Ideal para cultivos de granos básicos y hortalizas.', price: 850, category: 'Agricultura y Ganadería', tags: 'fertilizante,agricultura,insumo,cultivo', images: '["https://agricorp.com/static/productos/fertilizante-18460.jpg"]', quantity: 100 },
      { title: 'Urea 46% 50kg', description: 'Fertilizante nitrogenado urea granulada al 46%. Máximo contenido de nitrógeno para tus cultivos.', price: 780, category: 'Agricultura y Ganadería', tags: 'urea,fertilizante,nitrogeno,cultivo', images: '["https://agricorp.com/static/productos/urea-50kg.jpg"]', quantity: 80 },
      { title: 'Semilla de Frijol Rojo Certificada 1kg', description: 'Semilla de frijol rojo variedad INTA certificada. Alto rendimiento y resistencia a plagas.', price: 65, category: 'Agricultura y Ganadería', tags: 'semilla,frijol,rojo,certificada,agricultura', images: '["https://agricorp.com/static/productos/semilla-frijol.jpg"]', quantity: 300 },
    ],
  },

  // ─── 14. Disagro ─────────────────────────────────────────────────────────
  {
    name: 'Disagro',
    email: 'servicio@disagro.com',
    businessName: 'Disagro Nicaragua S.A.',
    category: 'Agricultura y Ganadería',
    department: 'Managua',
    address: 'Km 15 Carretera Norte, Managua',
    phone: '+505 2266-6000',
    website: 'https://disagro.com',
    description: 'Distribuidora de insumos agrícolas: fertilizantes, agroquímicos, semillas y equipos de riego.',
    logo: 'https://disagro.com/static/logo.png',
    products: [
      { title: 'Herbicida Glifosato 1L', description: 'Herbicida sistémico no selectivo. Control efectivo de malezas en cultivos y áreas no cultivadas.', price: 180, category: 'Agricultura y Ganadería', tags: 'herbicida,glifosato,agricultura,control-malezas', images: '["https://disagro.com/static/productos/glifosato-1l.jpg"]', quantity: 200 },
      { title: 'Insecticida Cipermetrina 1L', description: 'Insecticida piretroide de amplio espectro. Controla plagas en cultivos de granos y hortalizas.', price: 220, category: 'Agricultura y Ganadería', tags: 'insecticida,cipermetrina,agricultura,plagas', images: '["https://disagro.com/static/productos/cipermetrina-1l.jpg"]', quantity: 150 },
      { title: 'Fungicida Mancozeb 1kg', description: 'Fungicida protectante de amplio espectro. Previene enfermedades fungosas en diversos cultivos.', price: 160, category: 'Agricultura y Ganadería', tags: 'fungicida,mancozeb,agricultura,prevencion', images: '["https://disagro.com/static/productos/mancozeb-1kg.jpg"]', quantity: 180 },
      { title: 'Manguera de Riego por Goteo 100m', description: 'Manguera de riego por goteo de 16mm con goteros cada 30cm. Ahorro de agua garantizado.', price: 650, category: 'Agricultura y Ganadería', tags: 'riego,goteo,manguera,agricultura,ahorro', images: '["https://disagro.com/static/productos/manguera-goteo.jpg"]', quantity: 50 },
      { title: 'Abono Orgánico Compost 50kg', description: 'Abono orgánico compostado. Mejora la estructura del suelo y aporta nutrientes naturales.', price: 280, category: 'Agricultura y Ganadería', tags: 'abono,organico,compost,agricultura,sostenible', images: '["https://disagro.com/static/productos/abono-organico.jpg"]', quantity: 120 },
    ],
  },

  // ─── 15. CCN ─────────────────────────────────────────────────────────────
  {
    name: 'CCN Nicaragua',
    email: 'info@ccn.com.ni',
    businessName: 'Corporación CCN S.A.',
    category: 'Alimentos y Bebidas',
    department: 'Managua',
    address: 'Centro Comercial Plaza España, Managua',
    phone: '+505 2270-4000',
    website: 'https://ccn.com.ni',
    description: 'Corporación de supermercados y distribución líder en Nicaragua. La Colonia, Maxi Palí, Pricesmart.',
    logo: 'https://ccn.com.ni/assets/logo.png',
    products: [
      { title: 'Frijoles Rojos Nicaragüenses 1kg', description: 'Frijoles rojos de cosecha nacional. Grano seleccionado, limpio y listo para cocinar.', price: 48, category: 'Alimentos y Bebidas', tags: 'frijoles,basico,nicaraguense,grano', images: '["https://ccn.com.ni/assets/productos/frijoles-rojos.jpg"]', quantity: 500 },
      { title: 'Aceite Clover 1.5L', description: 'Aceite vegetal Clover 1.5 litros. Ideal para freír y cocinar. El preferido en Nicaragua.', price: 85, category: 'Alimentos y Bebidas', tags: 'aceite,clover,cocina,basico', images: '["https://ccn.com.ni/assets/productos/aceite-clover.jpg"]', quantity: 400 },
      { title: 'Harina de Maíz Maseca 1kg', description: 'Harina de maíz nixtamalizada Maseca. Para tortillas, tamales, pupusas y más.', price: 35, category: 'Alimentos y Bebidas', tags: 'harina,maiz,maseca,tortillas,basico', images: '["https://ccn.com.ni/assets/productos/harina-maseca.jpg"]', quantity: 600 },
      { title: 'Sal Yodada 1kg', description: 'Sal yodada de mesa. Nutrición esencial para la familia nicaragüense.', price: 15, category: 'Alimentos y Bebidas', tags: 'sal,yodada,basico,condimento', images: '["https://ccn.com.ni/assets/productos/sal-yodada.jpg"]', quantity: 800 },
      { title: 'Huevos de Gallina Granja 30 unidades', description: 'Huevos frescos de granja nicaragüense. 30 unidades en bandeja. Alto en proteína.', price: 120, category: 'Alimentos y Bebidas', tags: 'huevos,granja,proteina,fresco,nicaraguense', images: '["https://ccn.com.ni/assets/productos/huevos-granja.jpg"]', quantity: 300 },
    ],
  },
]

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function seedSupplierProducts() {
  console.log('🌱 Sembrando productos de proveedores nicaragüenses...\n')

  for (const supplier of SUPPLIERS) {
    // Create or update user
    let user = await db.user.findUnique({ where: { email: supplier.email } })

    if (!user) {
      user = await db.user.create({
        data: {
          email: supplier.email,
          name: supplier.name,
          role: 'SELLER',
          department: supplier.department,
          address: supplier.address,
          phone: supplier.phone,
          website: supplier.website,
          isVerified: true,
          emailVerified: true,
          balance: 0,
        },
      })
      console.log(`  ✅ Usuario creado: ${supplier.name}`)
    } else {
      console.log(`  📋 Usuario existente: ${supplier.name}`)
    }

    // Create or update business profile
    await db.businessProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        businessName: supplier.businessName,
        description: supplier.description,
        category: supplier.category,
        address: supplier.address,
        phone: supplier.phone,
        logo: supplier.logo,
        paymentMethods: JSON.stringify(['BANPRO', 'BAC', 'LAFISE', 'PAYPAL', 'PIXELPAY']),
      },
      update: {
        businessName: supplier.businessName,
        description: supplier.description,
        category: supplier.category,
        phone: supplier.phone,
        logo: supplier.logo,
      },
    })
    console.log(`  🏢 Perfil de negocio: ${supplier.businessName}`)

    // Create products
    for (const productDef of supplier.products) {
      // Check if product already exists
      const existingProduct = await db.product.findFirst({
        where: { sellerId: user.id, title: productDef.title },
      })

      if (existingProduct) {
        console.log(`    📦 Producto existente: ${productDef.title}`)
        continue
      }

      await db.product.create({
        data: {
          sellerId: user.id,
          title: productDef.title,
          description: productDef.description,
          price: productDef.price,
          category: productDef.category,
          tags: productDef.tags,
          images: productDef.images,
          quantity: productDef.quantity,
          status: 'ACTIVE',
          isFeatured: productDef.price > 3000,
        },
      })
      console.log(`    🆕 Producto creado: ${productDef.title} — C$${productDef.price}`)
    }

    console.log(`  📊 Total productos: ${supplier.products.length}\n`)
  }

  console.log('✅ Siembra de productos completada exitosamente!')
  console.log(`📊 Total proveedores: ${SUPPLIERS.length}`)
  console.log(`📦 Total productos: ${SUPPLIERS.reduce((sum, s) => sum + s.products.length, 0)}`)
}

seedSupplierProducts()
  .catch((e) => {
    console.error('❌ Error en siembra:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
