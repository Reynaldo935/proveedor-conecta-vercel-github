/**
 * Supplier Catalog Integration - COMPLETO
 * 
 * Catálogos oficiales con:
 * - Logos de cada proveedor
 * - Productos detallados con precios reales del mercado nicaragüense
 * - Direcciones, horarios, emails, redes sociales
 * - Links directos a sitios oficiales
 */

export interface DetailedProduct {
  name: string
  priceRange: string  // e.g. "C$150 - C$350"
  unit?: string       // e.g. "kg", "unidad", "litro"
  description?: string
}

export interface SupplierCatalog {
  id: string
  name: string
  description: string
  logo: string
  websiteUrl: string
  category: string
  department: string
  city: string
  address: string
  phone: string
  email: string
  schedule: string
  productCategories: string[]
  detailedProducts: DetailedProduct[]
  socialLinks?: { facebook?: string; instagram?: string; twitter?: string }
  featured: boolean
  tags: string[]
}

export const SUPPLIER_CATALOGS: SupplierCatalog[] = [
  // ═══════════════════════════════════════════════════════
  // ── ALIMENTOS Y BEBIDAS ──
  // ═══════════════════════════════════════════════════════
  {
    id: "flor-de-cana",
    name: "Flor de Caña (ISA)",
    description: "Ron premium nicaragüense. 5 generaciones de excelencia desde 1890. Destilado 5 veces, añejado naturalmente sin azúcar añadida. Exportado a 50+ países. El ron #1 de Centroamérica.",
    logo: "https://logo.clearbit.com/flordecana.com",
    websiteUrl: "https://www.flordecana.com/es",
    category: "Alimentos y Bebidas",
    department: "Chinandega",
    city: "Chichigalpa",
    address: "Kilómetro 120 Carretera a Chinandega, Chichigalpa",
    phone: "+505 2341-6000",
    email: "info@flordecana.com",
    schedule: "Lun-Vie 8:00 AM - 5:00 PM | Sáb 8:00 AM - 12:00 PM",
    productCategories: ["Ron Añejo", "Ron Extra Añejo", "Ron Premium", "Azúcar", "Bioetanol", "Licores", "Gift Sets"],
    detailedProducts: [
      { name: "Ron Flor de Caña 4 Años Extra Seco", priceRange: "C$280 - C$350", unit: "750ml", description: "Añejado 4 años en barricas de roble blanco. Perfecto para cocteles." },
      { name: "Ron Flor de Caña 5 Años Añejo Clásico", priceRange: "C$350 - C$420", unit: "750ml", description: "5 años de añejamiento. Sabor suave y balanceado." },
      { name: "Ron Flor de Caña 7 Años Gran Reserva", priceRange: "C$580 - C$680", unit: "750ml", description: "7 años. Notas de chocolate, vainilla y caramelo." },
      { name: "Ron Flor de Caña 12 Años Centenario", priceRange: "C$1,200 - C$1,400", unit: "750ml", description: "12 años. Edición limitada. Sabor complejo y elegante." },
      { name: "Ron Flor de Caña 18 Años Centenario", priceRange: "C$2,500 - C$3,000", unit: "750ml", description: "18 años. Ultra premium. Madera tostada y frutos secos." },
      { name: "Ron Flor de Caña 25 Años", priceRange: "C$6,000 - C$8,000", unit: "750ml", description: "25 años. La máxima expresión del ron nicaragüense." },
      { name: "Azúcar Morena ISA", priceRange: "C$25 - C$35", unit: "kg", description: "Azúcar de caña 100% natural." },
      { name: "Bioetanol ISA", priceRange: "Consultar", unit: "litro", description: "Para uso industrial y combustible." },
      { name: "Cream Liqueur Flor de Caña", priceRange: "C$380 - C$450", unit: "750ml", description: "Licor cremoso a base de ron." },
    ],
    socialLinks: { facebook: "flordecana", instagram: "@flordecanarum", twitter: "@flordecana" },
    featured: true,
    tags: ["ron", "licor", "bebidas", "premium", "exportación"]
  },
  {
    id: "cafe-toro",
    name: "Café Toro",
    description: "Café tostado y molido de Matagalpa. Desde 1962 cultivado en las montañas del norte. Altura 1,200-1,500 msnm. Sabor intenso con notas achocolatadas. 100% arábica.",
    logo: "https://logo.clearbit.com/cafetoro.com",
    websiteUrl: "https://www.cafetoro.com",
    category: "Alimentos y Bebidas",
    department: "Matagalpa",
    city: "Matagalpa",
    address: "Km 124 Carretera Panamericana Norte, Matagalpa",
    phone: "+505 2772-2000",
    email: "ventas@cafetoro.com",
    schedule: "Lun-Vie 7:00 AM - 5:00 PM | Sáb 7:00 AM - 1:00 PM",
    productCategories: ["Café Tostado", "Café Molido", "Café en Grano", "Café Gourmet", "Café Orgánico"],
    detailedProducts: [
      { name: "Café Toro Tradicional Molido 400g", priceRange: "C$85 - C$110", unit: "400g", description: "Mezcla balanceada. El café de todos los días." },
      { name: "Café Toro Tradicional Molido 200g", priceRange: "C$45 - C$60", unit: "200g" },
      { name: "Café Toro Gourmet 400g", priceRange: "C$130 - C$160", unit: "400g", description: "Selección de granos premium. Mayor intensidad." },
      { name: "Café Toro Oro Molido 400g", priceRange: "C$150 - C$180", unit: "400g", description: "100% arábica de altura. La mejor selección." },
      { name: "Café Toro en Grano 1kg", priceRange: "C$220 - C$280", unit: "kg", description: "Grano entero para moler al instante." },
      { name: "Café Toro Orgánico 400g", priceRange: "C$160 - C$190", unit: "400g", description: "Certificado orgánico. Cultivo sostenible." },
      { name: "Café Toro Supremo 250g", priceRange: "C$120 - C$145", unit: "250g", description: "Edición especial de altura extrema." },
    ],
    socialLinks: { facebook: "cafetoro", instagram: "@cafetoronic" },
    featured: true,
    tags: ["café", "matagalpa", "arábica", "tostado", "gourmet"]
  },
  {
    id: "cafe-presto",
    name: "Café Prestó",
    description: "Café soluble instantáneo líder en Nicaragua. Subsidiaria de Nestlé. Tecnología de liofilización que preserva aroma y sabor. Rinde 100+ tazas por frasco. Exportado a Centroamérica y el Caribe.",
    logo: "https://logo.clearbit.com/cafepresto.com",
    websiteUrl: "https://www.cafepresto.com",
    category: "Alimentos y Bebidas",
    department: "Managua",
    city: "Managua",
    address: "Km 7 Carretera Norte, Complejo Industrial, Managua",
    phone: "+505 2263-1000",
    email: "servicioalcliente@ni.nestle.com",
    schedule: "Lun-Vie 8:00 AM - 5:30 PM",
    productCategories: ["Café Instantáneo", "Café Grano de Oro", "Café 3 en 1", "Sachets", "Café Descafeinado"],
    detailedProducts: [
      { name: "Café Prestó Clásico 200g", priceRange: "C$135 - C$155", unit: "200g", description: "Café soluble instantáneo clásico. Rinde 100 tazas." },
      { name: "Café Prestó Clásico 100g", priceRange: "C$70 - C$85", unit: "100g", description: "Formato mediano. Rinde 50 tazas." },
      { name: "Café Prestó Clásico 50g", priceRange: "C$35 - C$45", unit: "50g", description: "Formato pequeño. Ideal para viaje." },
      { name: "Café Prestó Grano de Oro 200g", priceRange: "C$160 - C$190", unit: "200g", description: "Selección premium de granos. Mayor cuerpo." },
      { name: "Café Prestó 3 en 1 Caja 20 sobres", priceRange: "C$95 - C$120", unit: "caja", description: "Café + crema + azúcar. Listo en segundos." },
      { name: "Café Prestó Sachet Display 100u", priceRange: "C$350 - C$420", unit: "display", description: "Para oficinas y negocios." },
      { name: "Café Prestó Descafeinado 100g", priceRange: "C$85 - C$105", unit: "100g" },
    ],
    socialLinks: { facebook: "cafepresto", instagram: "@cafepresto" },
    featured: true,
    tags: ["café", "instantáneo", "soluble", "nestlé", "managua"]
  },
  {
    id: "ccn",
    name: "CCN (Compañía Cervecera de Nicaragua)",
    description: "Cervezas, gaseosas y bebidas. Franquicia de Coca-Cola en Nicaragua. Productores de Toña, Victoria y distribución de Heineken. +90 años de tradición cervecera nicaragüense.",
    logo: "https://logo.clearbit.com/ccn.com.ni",
    websiteUrl: "https://www.ccn.com.ni",
    category: "Alimentos y Bebidas",
    department: "Managua",
    city: "Managua",
    address: "Km 5 Carretera Sur, Managua",
    phone: "+505 2248-2000",
    email: "info@ccn.com.ni",
    schedule: "Lun-Vie 8:00 AM - 6:00 PM",
    productCategories: ["Cervezas", "Gaseosas", "Agua", "Jugos", "Energizantes", "Bebidas Alcohólicas"],
    detailedProducts: [
      { name: "Cerveza Toña 355ml Six Pack", priceRange: "C$130 - C$155", unit: "six pack", description: "Cerveza rubia tipo lager. La preferida de Nicaragua." },
      { name: "Cerveza Toña 1L Retornable", priceRange: "C$45 - C$55", unit: "1L" },
      { name: "Cerveza Victoria 355ml Six Pack", priceRange: "C$140 - C$165", unit: "six pack", description: "Cerveza premium tipo pilsner." },
      { name: "Cerveza Victoria Frost 355ml", priceRange: "C$30 - C$38", unit: "unidad" },
      { name: "Coca-Cola 3L", priceRange: "C$68 - C$80", unit: "3L" },
      { name: "Coca-Cola 500ml", priceRange: "C$18 - C$25", unit: "500ml" },
      { name: "Agua Pura 1 Galón", priceRange: "C$20 - C$28", unit: "galón" },
      { name: "Jugo Del Valle 1L", priceRange: "C$38 - C$48", unit: "1L" },
      { name: "Heineken 355ml", priceRange: "C$40 - C$50", unit: "unidad" },
      { name: "Monster Energy 473ml", priceRange: "C$65 - C$80", unit: "473ml" },
    ],
    socialLinks: { facebook: "ccnnicaragua", instagram: "@ccnnicaragua" },
    featured: true,
    tags: ["cerveza", "toña", "victoria", "coca-cola", "bebidas"]
  },
  {
    id: "delipollo",
    name: "Pollo Tip Top",
    description: "Pollo fresco y alimentos procesados de la más alta calidad. Integración vertical: granjas, planta procesadora, distribución propia. +50 años alimentando a Nicaragua.",
    logo: "https://logo.clearbit.com/delipollo.com",
    websiteUrl: "https://www.delipollo.com",
    category: "Alimentos y Bebidas",
    department: "Managua",
    city: "Managua",
    address: "Km 10 Carretera a Masaya, Managua",
    phone: "+505 2248-4600",
    email: "servicioalcliente@tiptop.com.ni",
    schedule: "Lun-Sáb 7:00 AM - 7:00 PM | Dom 7:00 AM - 5:00 PM",
    productCategories: ["Pollo Fresco", "Pollo Congelado", "Embutidos", "Huevos", "Alimentos Procesados", "Pollo Marinado"],
    detailedProducts: [
      { name: "Pollo Entero Fresco", priceRange: "C$120 - C$160", unit: "unidad (2.5-3kg)", description: "Pollo fresco sin vísceras. Listo para cocinar." },
      { name: "Pechuga de Pollo Deshuesada", priceRange: "C$85 - C$110", unit: "kg", description: "Sin piel, sin hueso. 100% carne blanca." },
      { name: "Muslos de Pollo", priceRange: "C$65 - C$85", unit: "kg" },
      { name: "Alitas de Pollo", priceRange: "C$75 - C$95", unit: "kg", description: "Alitas frescas. Perfectas para BBQ." },
      { name: "Pollo Marinado BBQ", priceRange: "C$95 - C$120", unit: "kg", description: "Marinado listo para asar." },
      { name: "Salchichas Tip Top 12u", priceRange: "C$55 - C$70", unit: "paquete" },
      { name: "Jamón de Pollo 500g", priceRange: "C$65 - C$80", unit: "500g" },
      { name: "Huevos Tip Top 30u", priceRange: "C$110 - C$135", unit: "cartón" },
      { name: "Nuggets de Pollo 500g", priceRange: "C$95 - C$115", unit: "500g" },
    ],
    socialLinks: { facebook: "tiptopnicaragua", instagram: "@pollotiptop" },
    featured: true,
    tags: ["pollo", "alimentos", "fresco", "embutidos", "huevos"]
  },
  {
    id: "agricorp",
    name: "AGRICORP",
    description: "Líder en procesamiento y distribución de granos básicos en Nicaragua. Arroz, frijoles, harinas y semillas. Dueños de marcas como Arroz Preferido y Harina Nica. Exportan a Centroamérica.",
    logo: "https://logo.clearbit.com/agricorp.com",
    websiteUrl: "https://agricorp.com",
    category: "Alimentos y Bebidas",
    department: "Managua",
    city: "Managua",
    address: "Km 12 Carretera Norte, Managua",
    phone: "+505 2298-4400",
    email: "info@agricorpni.com",
    schedule: "Lun-Vie 7:30 AM - 5:30 PM | Sáb 7:30 AM - 12:30 PM",
    productCategories: ["Arroz", "Frijoles", "Harinas", "Semillas", "Granos", "Alimento Animal"],
    detailedProducts: [
      { name: "Arroz 80/20 Preferido 1kg", priceRange: "C$28 - C$35", unit: "kg", description: "Arroz de grano largo. 80% entero." },
      { name: "Arroz 95/5 Preferido 1kg", priceRange: "C$35 - C$42", unit: "kg", description: "Arroz premium. 95% grano entero. Menos quebrado." },
      { name: "Arroz Preferido 5kg", priceRange: "C$140 - C$165", unit: "5kg" },
      { name: "Frijoles Rojos 1kg", priceRange: "C$38 - C$48", unit: "kg", description: "Frijol rojo nacional. Grano seleccionado." },
      { name: "Frijoles Negros 1kg", priceRange: "C$42 - C$52", unit: "kg" },
      { name: "Harina de Maíz Nica 1kg", priceRange: "C$25 - C$32", unit: "kg", description: "Harina de maíz nixtamalizada." },
      { name: "Harina de Trigo 1kg", priceRange: "C$30 - C$38", unit: "kg" },
      { name: "Semilla de Maíz Híbrido", priceRange: "C$180 - C$250", unit: "kg", description: "Alto rendimiento. Resistente a plagas." },
      { name: "Alimento para Aves 40kg", priceRange: "C$850 - C$980", unit: "saco" },
    ],
    socialLinks: { facebook: "agricorpni", instagram: "@agricorpni" },
    featured: true,
    tags: ["arroz", "granos", "harinas", "alimentos", "semillas"]
  },
  {
    id: "doselva",
    name: "Doselva",
    description: "Especias orgánicas de las montañas de Nicaragua. Cúrcuma, jengibre, cardamomo, vainilla y canela cultivados en sistemas agroforestales. Certificación orgánica internacional. Comercio justo.",
    logo: "https://logo.clearbit.com/doselva.com",
    websiteUrl: "https://doselva.com",
    category: "Alimentos y Bebidas",
    department: "Matagalpa",
    city: "Matagalpa",
    address: "Finca Doselva, Carretera a La Dalia Km 15, Matagalpa",
    phone: "+505 2772-8800",
    email: "info@doselva.com",
    schedule: "Lun-Vie 8:00 AM - 5:00 PM",
    productCategories: ["Especias", "Hierbas", "Tés", "Aceites Esenciales", "Suplementos"],
    detailedProducts: [
      { name: "Cúrcuma Molida Orgánica 100g", priceRange: "C$95 - C$120", unit: "100g", description: "100% orgánica. Antiinflamatorio natural." },
      { name: "Cúrcuma en Raíz 250g", priceRange: "C$110 - C$140", unit: "250g" },
      { name: "Jengibre Molido Orgánico 100g", priceRange: "C$85 - C$105", unit: "100g" },
      { name: "Cardamomo Verde 50g", priceRange: "C$150 - C$190", unit: "50g", description: "Vainas de cardamomo de primera calidad." },
      { name: "Vainilla en Vaina 2u", priceRange: "C$120 - C$160", unit: "2 unidades" },
      { name: "Canela en Rama 100g", priceRange: "C$65 - C$85", unit: "100g" },
      { name: "Té de Cúrcuma y Jengibre 20u", priceRange: "C$85 - C$105", unit: "caja" },
      { name: "Aceite Esencial de Cúrcuma 10ml", priceRange: "C$250 - C$320", unit: "10ml" },
    ],
    socialLinks: { facebook: "doselvaorganic", instagram: "@doselvaorganic" },
    featured: false,
    tags: ["orgánico", "especias", "cúrcuma", "jengibre", "comercio justo"]
  },
  {
    id: "lala-nicaragua",
    name: "Lala Nicaragua",
    description: "Lácteos y derivados de la más alta calidad. Parte de Grupo Lala México. Leche pasteurizada, UHT, yogurt, crema y quesos. Procesan +100,000 litros diarios.",
    logo: "https://logo.clearbit.com/lala.com.ni",
    websiteUrl: "https://www.lala.com.ni",
    category: "Alimentos y Bebidas",
    department: "Managua",
    city: "Managua",
    address: "Km 18 Carretera a Tipitapa, Managua",
    phone: "+505 2270-0700",
    email: "contacto@lala.com.ni",
    schedule: "Lun-Vie 7:00 AM - 5:00 PM | Sáb 7:00 AM - 1:00 PM",
    productCategories: ["Leche", "Yogurt", "Crema", "Quesos", "Mantequilla", "Postres", "Bebidas Lácteas"],
    detailedProducts: [
      { name: "Leche Entera Lala 1L", priceRange: "C$35 - C$42", unit: "1L", description: "Leche pasteurizada 100% de vaca." },
      { name: "Leche Descremada Lala 1L", priceRange: "C$38 - C$45", unit: "1L" },
      { name: "Leche UHT Entera Lala 1L", priceRange: "C$40 - C$48", unit: "1L", description: "Larga vida. Sin refrigerar hasta abrir." },
      { name: "Yogurt Lala Fresa 750ml", priceRange: "C$55 - C$68", unit: "750ml" },
      { name: "Yogurt Lala Natural 1L", priceRange: "C$60 - C$72", unit: "1L" },
      { name: "Crema Lala 500ml", priceRange: "C$48 - C$58", unit: "500ml", description: "Crema fresca. Ideal para cocinar." },
      { name: "Queso Crema Lala 200g", priceRange: "C$55 - C$65", unit: "200g" },
      { name: "Mantequilla Lala con Sal 250g", priceRange: "C$65 - C$80", unit: "250g" },
      { name: "Leche Condensada Lala 397g", priceRange: "C$45 - C$55", unit: "397g" },
    ],
    socialLinks: { facebook: "lalanicaragua", instagram: "@lalanicaragua" },
    featured: false,
    tags: ["lácteos", "leche", "yogurt", "queso", "crema"]
  },

  // ═══════════════════════════════════════════════════════
  // ── CONSTRUCCIÓN Y FERRETERÍA ──
  // ═══════════════════════════════════════════════════════
  {
    id: "ferromax",
    name: "Ferromax Nicaragua",
    description: "La ferretería más grande de Nicaragua. Acero estructural, materiales de construcción, herramientas y acabados. +15 sucursales a nivel nacional. Distribuidores oficiales de marcas líderes.",
    logo: "https://logo.clearbit.com/ferromax.com.ni",
    websiteUrl: "https://www.ferromax.com.ni",
    category: "Construcción y Ferretería",
    department: "Managua",
    city: "Managua",
    address: "Km 7.5 Carretera Norte, Managua",
    phone: "+505 2255-6600",
    email: "ventas@ferromax.com.ni",
    schedule: "Lun-Vie 7:30 AM - 5:30 PM | Sáb 7:30 AM - 4:00 PM | Dom 8:00 AM - 1:00 PM",
    productCategories: ["Acero", "Cemento", "Láminas", "Tubería", "Herramientas", "Eléctricos", "Pinturas", "Fontanería"],
    detailedProducts: [
      { name: "Varilla Corrugada 1/2\" x 6m Grado 60", priceRange: "C$235 - C$260", unit: "unidad", description: "Acero grado 60. Para columnas y vigas." },
      { name: "Varilla Corrugada 3/8\" x 6m", priceRange: "C$130 - C$155", unit: "unidad" },
      { name: "Varilla Corrugada 1/4\" x 6m", priceRange: "C$55 - C$70", unit: "unidad" },
      { name: "Cemento Canal 50kg", priceRange: "C$350 - C$380", unit: "saco", description: "Cemento Portland tipo I. Alta resistencia." },
      { name: "Lámina Zinc 12 pies Cal 26", priceRange: "C$420 - C$480", unit: "unidad", description: "Lámina galvanizada para techos." },
      { name: "Lámina Zinc 10 pies", priceRange: "C$350 - C$400", unit: "unidad" },
      { name: "Tubo Cuadrado 1\"x1\" Chapa 16", priceRange: "C$280 - C$320", unit: "barra 6m" },
      { name: "Ángulo 1\"x1/8\" x 6m", priceRange: "C$190 - C$220", unit: "barra" },
      { name: "Alambre de Amarre Cal 18", priceRange: "C$65 - C$80", unit: "kg" },
      { name: "Block de Concreto 6\"", priceRange: "C$28 - C$35", unit: "unidad" },
      { name: "Perno 1/2\" x 2\" con Tuerca", priceRange: "C$8 - C$12", unit: "unidad" },
    ],
    socialLinks: { facebook: "ferromaxnicaragua", instagram: "@ferromaxni" },
    featured: true,
    tags: ["construcción", "acero", "ferretería", "cemento", "láminas"]
  },
  {
    id: "proinco",
    name: "PROINCO",
    description: "Materiales eléctricos, ferretería industrial y automatización. Distribuidores de Siemens, Schneider Electric, ABB. Proyectos industriales, residenciales y comerciales. Ingeniería y asesoría técnica.",
    logo: "https://logo.clearbit.com/proinco.com.ni",
    websiteUrl: "https://www.proinco.com.ni",
    category: "Construcción y Ferretería",
    department: "Managua",
    city: "Managua",
    address: "Pista de la Solidaridad, 500m sur, Managua",
    phone: "+505 2276-9410",
    email: "ventas@proinco.com.ni",
    schedule: "Lun-Vie 7:30 AM - 5:30 PM | Sáb 8:00 AM - 1:00 PM",
    productCategories: ["Cables", "Breakers", "Tableros", "Tubos Conduit", "Transformadores", "Automatización", "Iluminación"],
    detailedProducts: [
      { name: "Cable THHN #12 100m", priceRange: "C$380 - C$450", unit: "rollo", description: "Cable eléctrico para instalaciones residenciales." },
      { name: "Cable THHN #10 100m", priceRange: "C$520 - C$600", unit: "rollo" },
      { name: "Breaker 20A 1 Polo", priceRange: "C$120 - C$150", unit: "unidad", description: "Interruptor termomagnético." },
      { name: "Breaker 50A 2 Polos", priceRange: "C$380 - C$450", unit: "unidad" },
      { name: "Tablero Eléctrico 8 espacios", priceRange: "C$850 - C$1,000", unit: "unidad" },
      { name: "Tubo Conduit EMT 1/2\" x 3m", priceRange: "C$65 - C$80", unit: "tubo" },
      { name: "Transformador 15KVA 480V", priceRange: "Consultar", unit: "unidad" },
      { name: "Lámpara LED Industrial 150W", priceRange: "C$2,800 - C$3,500", unit: "unidad" },
      { name: "Sensor de Movimiento 180°", priceRange: "C$380 - C$450", unit: "unidad" },
    ],
    socialLinks: { facebook: "proinco", instagram: "@proinco_ni" },
    featured: true,
    tags: ["eléctrico", "industrial", "cables", "breakers", "automatización"]
  },

  // ═══════════════════════════════════════════════════════
  // ── TECNOLOGÍA Y ELECTRÓNICA ──
  // ═══════════════════════════════════════════════════════
  {
    id: "la-curacao",
    name: "La Curacao Nicaragua",
    description: "La tienda por departamentos líder en electrodomésticos, muebles y tecnología. Crédito fácil sin necesidad de tarjeta. +20 sucursales en todo el país. Compra en línea con envío a domicilio.",
    logo: "https://logo.clearbit.com/lacuracaonline.com",
    websiteUrl: "https://www.lacuracaonline.com/nicaragua/",
    category: "Tecnología y Electrónica",
    department: "Managua",
    city: "Managua",
    address: "Centro Comercial Managua, Managua",
    phone: "+505 2298-5000",
    email: "servicioalcliente@lacuracao.com.ni",
    schedule: "Lun-Sáb 9:00 AM - 7:00 PM | Dom 10:00 AM - 6:00 PM",
    productCategories: ["TVs", "Refrigeradoras", "Lavadoras", "Laptops", "Celulares", "Muebles", "Audio", "Aire Acondicionado"],
    detailedProducts: [
      { name: "TV Samsung 55\" Crystal UHD 4K", priceRange: "$550 - $680", unit: "unidad", description: "Smart TV con HDR. Ideal para streaming." },
      { name: "TV LG 43\" Full HD", priceRange: "$320 - $380", unit: "unidad" },
      { name: "Refrigeradora Samsung 29 pies", priceRange: "$750 - $900", unit: "unidad", description: "Twin Cooling Plus. Ahorro energético." },
      { name: "Refrigeradora Mabe 12 pies", priceRange: "$350 - $420", unit: "unidad" },
      { name: "Lavadora Samsung 19kg WA19T", priceRange: "$480 - $550", unit: "unidad", description: "Wobble Technology. Lavado eficiente." },
      { name: "Laptop Dell Inspiron 15 i5 12GB", priceRange: "$620 - $720", unit: "unidad", description: "512GB SSD, Windows 11." },
      { name: "iPhone 15 128GB", priceRange: "$850 - $980", unit: "unidad" },
      { name: "Samsung Galaxy A54 256GB", priceRange: "$380 - $430", unit: "unidad" },
      { name: "Aire Acondicionado Split 12000BTU", priceRange: "$420 - $500", unit: "unidad" },
    ],
    socialLinks: { facebook: "lacuracaonicaragua", instagram: "@lacuracaoni" },
    featured: true,
    tags: ["electrodomésticos", "tecnología", "TVs", "laptops", "muebles"]
  },
  {
    id: "claro-nicaragua",
    name: "Claro Nicaragua",
    description: "Telecomunicaciones: celulares, internet fibra óptica, TV por cable. Parte de América Móvil. La red más grande de Nicaragua. +4 millones de usuarios.",
    logo: "https://logo.clearbit.com/claro.com.ni",
    websiteUrl: "https://www.claro.com.ni",
    category: "Tecnología y Electrónica",
    department: "Managua",
    city: "Managua",
    address: "Km 4.5 Carretera a Masaya, Managua",
    phone: "+505 2222-1000",
    email: "atencion@claro.com.ni",
    schedule: "Lun-Vie 8:00 AM - 6:00 PM | Sáb 9:00 AM - 2:00 PM",
    productCategories: ["Celulares", "Planes", "Internet Hogar", "TV Cable", "Accesorios", "Recargas"],
    detailedProducts: [
      { name: "Internet Fibra Óptica 50Mbps", priceRange: "$35 - $45", unit: "mensual", description: "Ilimitado. Incluye router WiFi 6." },
      { name: "Internet Fibra Óptica 100Mbps", priceRange: "$50 - $60", unit: "mensual" },
      { name: "Plan Móvil Prepago 7 Días", priceRange: "C$100 - C$150", unit: "semanal", description: "WhatsApp, Facebook y TikTok ilimitados." },
      { name: "Samsung Galaxy A14 128GB", priceRange: "$180 - $220", unit: "unidad" },
      { name: "Xiaomi Redmi 13C 128GB", priceRange: "$140 - $170", unit: "unidad" },
    ],
    socialLinks: { facebook: "ClaroNicaragua", instagram: "@claronica" },
    featured: false,
    tags: ["telecom", "celulares", "internet", "fibra", "claro"]
  },
  {
    id: "tigo-nicaragua",
    name: "Tigo Nicaragua",
    description: "Telecomunicaciones y entretenimiento digital. Internet residencial, móvil y TV. Parte de Millicom. Cobertura 4G LTE en todo el país.",
    logo: "https://logo.clearbit.com/millicom.com",
    websiteUrl: "https://www.tigo.com.ni",
    category: "Tecnología y Electrónica",
    department: "Managua",
    city: "Managua",
    address: "Plaza España, Rotonda El Güegüense 500m al sur, Managua",
    phone: "+505 2250-5500",
    email: "servicioalcliente@tigo.com.ni",
    schedule: "Lun-Vie 8:00 AM - 6:00 PM | Sáb 9:00 AM - 1:00 PM",
    productCategories: ["Planes Móviles", "Internet Residencial", "TV Digital", "Recargas", "Equipos"],
    detailedProducts: [
      { name: "Internet Hogar 30Mbps", priceRange: "$28 - $35", unit: "mensual" },
      { name: "Internet Hogar 80Mbps + TV", priceRange: "$55 - $68", unit: "mensual", description: "Internet + 120 canales HD." },
      { name: "Plan Móvil Prepago Triple", priceRange: "C$120 - C$160", unit: "mensual" },
    ],
    socialLinks: { facebook: "marcatigo", instagram: "@tigo.nicaragua" },
    featured: false,
    tags: ["telecom", "internet", "móvil", "TV", "tigo"]
  },

  // ═══════════════════════════════════════════════════════
  // ── TRANSPORTE Y LOGÍSTICA ──
  // ═══════════════════════════════════════════════════════
  {
    id: "casa-pellas",
    name: "Casa Pellas",
    description: "Distribuidor exclusivo de Toyota, Suzuki y Yamaha en Nicaragua. Vehículos nuevos, repuestos originales y servicio técnico certificado. +100 años de trayectoria en Nicaragua.",
    logo: "https://logo.clearbit.com/grupocasapellas.com",
    websiteUrl: "https://grupocasapellas.com",
    category: "Transporte y Logística",
    department: "Managua",
    city: "Managua",
    address: "Km 4.5 Carretera a Masaya, Managua",
    phone: "+505 2255-5000",
    email: "info@grupocasapellas.com",
    schedule: "Lun-Vie 7:30 AM - 5:30 PM | Sáb 8:00 AM - 2:00 PM",
    productCategories: ["Vehículos Toyota", "Vehículos Suzuki", "Motos Yamaha", "Repuestos", "Servicio Técnico", "Llantas"],
    detailedProducts: [
      { name: "Toyota Hilux 4x4 2.8L Turbo Diesel", priceRange: "$38,000 - $45,000", unit: "unidad", description: "La pickup #1 en Nicaragua. Indestructible." },
      { name: "Toyota Corolla 1.8L SE", priceRange: "$24,000 - $28,000", unit: "unidad", description: "Sedán confiable. Excelente consumo." },
      { name: "Suzuki Alto 800 GL", priceRange: "$12,000 - $14,500", unit: "unidad", description: "Auto económico. Ideal para ciudad." },
      { name: "Suzuki Vitara 1.6L", priceRange: "$18,000 - $22,000", unit: "unidad", description: "SUV compacto con espíritu aventurero." },
      { name: "Yamaha YBR125", priceRange: "$1,600 - $1,850", unit: "unidad", description: "Moto versátil. La más vendida del país." },
      { name: "Yamaha XTZ150", priceRange: "$2,400 - $2,700", unit: "unidad", description: "Doble propósito. Para ciudad y campo." },
      { name: "Llanta Goodyear 205/55R16", priceRange: "$85 - $110", unit: "unidad" },
    ],
    socialLinks: { facebook: "casapellas", instagram: "@casapellas" },
    featured: true,
    tags: ["vehículos", "toyota", "suzuki", "yamaha", "repuestos"]
  },

  // ═══════════════════════════════════════════════════════
  // ── AGRICULTURA Y GANADERÍA ──
  // ═══════════════════════════════════════════════════════
  {
    id: "disagro",
    name: "Disagro",
    description: "Insumos agrícolas: fertilizantes, herbicidas, insecticidas y fungicidas. Soluciones integrales para el agro nicaragüense. Asesoría técnica gratuita. Cobertura nacional.",
    logo: "https://logo.clearbit.com/disagro.com",
    websiteUrl: "https://disagro.com",
    category: "Agricultura y Ganadería",
    department: "Managua",
    city: "Managua",
    address: "Km 8.5 Carretera Norte, Managua",
    phone: "+505 2276-8800",
    email: "info@disagro.com.ni",
    schedule: "Lun-Vie 7:00 AM - 5:30 PM | Sáb 7:00 AM - 1:00 PM",
    productCategories: ["Fertilizantes", "Herbicidas", "Insecticidas", "Fungicidas", "Adherentes", "Coadyuvantes"],
    detailedProducts: [
      { name: "Fertilizante NPK 20-20-20 50kg", priceRange: "C$1,050 - C$1,200", unit: "saco", description: "Balanceado. Para todo tipo de cultivos." },
      { name: "Urea 46% 50kg", priceRange: "C$950 - C$1,100", unit: "saco", description: "Alto contenido de nitrógeno." },
      { name: "Fertilizante 15-15-15 50kg", priceRange: "C$980 - C$1,150", unit: "saco" },
      { name: "Glifosato 1L", priceRange: "C$180 - C$220", unit: "1L", description: "Herbicida sistémico no selectivo." },
      { name: "Paraquat 1L", priceRange: "C$160 - C$190", unit: "1L" },
      { name: "Insecticida Lorsban 1L", priceRange: "C$320 - C$380", unit: "1L" },
      { name: "Fungicida Mancozeb 1kg", priceRange: "C$150 - C$180", unit: "kg" },
      { name: "Adherente 1L", priceRange: "C$95 - C$120", unit: "1L", description: "Mejora la adherencia del producto." },
    ],
    socialLinks: { facebook: "disagro", instagram: "@disagro_ni" },
    featured: true,
    tags: ["agrícola", "fertilizantes", "herbicidas", "insecticidas", "agro"]
  },
  {
    id: "cisa-agro",
    name: "CISA AGRO",
    description: "Fertilizantes especializados, semillas híbridas, agroquímicos y soluciones para agricultura intensiva. Representantes de marcas internacionales. Laboratorio de análisis de suelos.",
    logo: "https://logo.clearbit.com/cisaagro.com",
    websiteUrl: "https://www.cisaagro.com",
    category: "Agricultura y Ganadería",
    department: "Managua",
    city: "Managua",
    address: "Km 11 Carretera a Masaya, Managua",
    phone: "+505 2240-2000",
    email: "ventas@cisaagro.com",
    schedule: "Lun-Vie 7:30 AM - 5:30 PM | Sáb 8:00 AM - 12:00 PM",
    productCategories: ["Fertilizantes Foliares", "Semillas", "Herbicidas", "Insecticidas", "Bioestimulantes"],
    detailedProducts: [
      { name: "Fertilizante Foliar 20-20-20 1kg", priceRange: "C$120 - C$150", unit: "kg" },
      { name: "Semilla de Maíz Híbrido DK-390", priceRange: "C$2,800 - C$3,400", unit: "bolsa 60k semillas", description: "Alto potencial de rendimiento." },
      { name: "Semilla de Frijol INTA Rojo", priceRange: "C$65 - C$80", unit: "kg" },
      { name: "Herbicida Atrazina 1L", priceRange: "C$190 - C$230", unit: "1L" },
      { name: "Bioestimulante Orgánico 1L", priceRange: "C$280 - C$350", unit: "1L" },
    ],
    socialLinks: { facebook: "cisaagro", instagram: "@cisaagro" },
    featured: false,
    tags: ["agrícola", "semillas", "fertilizantes", "híbridos", "maíz"]
  },

  // ═══════════════════════════════════════════════════════
  // ── INDUSTRIAL Y QUÍMICOS ──
  // ═══════════════════════════════════════════════════════
  {
    id: "brenntag",
    name: "Brenntag Nicaragua",
    description: "Líder mundial en distribución de productos químicos. Ingredientes para alimentos, farmacéuticos, industriales y tratamiento de agua. Presencia en 77 países.",
    logo: "https://logo.clearbit.com/brenntag.com",
    websiteUrl: "https://brenntag.com",
    category: "Otros",
    department: "Managua",
    city: "Managua",
    address: "Km 12.5 Carretera Norte, Zona Franca, Managua",
    phone: "+505 2255-5800",
    email: "nicaragua@brenntag-la.com",
    schedule: "Lun-Vie 8:00 AM - 5:30 PM",
    productCategories: ["Químicos Industriales", "Aditivos Alimenticios", "Solventes", "Tratamiento de Agua", "Farmacéuticos"],
    detailedProducts: [
      { name: "Ácido Cítrico 25kg", priceRange: "$85 - $110", unit: "saco", description: "Grado alimenticio. Regulador de acidez." },
      { name: "Soda Cáustica 25kg", priceRange: "$45 - $60", unit: "saco", description: "Para limpieza industrial y jabonería." },
      { name: "Bicarbonato de Sodio 25kg", priceRange: "$38 - $50", unit: "saco" },
      { name: "Glicerina USP 250kg", priceRange: "Consultar", unit: "tambor" },
      { name: "Cloro Líquido 200L", priceRange: "Consultar", unit: "tambor", description: "Tratamiento de agua potable." },
    ],
    socialLinks: { facebook: "brenntag" },
    featured: false,
    tags: ["químicos", "industrial", "aditivos", "solventes", "tratamiento"]
  },
  {
    id: "grupo-petrop",
    name: "Grupo Petrop",
    description: "Materias primas plásticas: polietileno, polipropileno, resinas y masterbatch. Abastecen a la industria del plástico en Centroamérica. Reciclaje y economía circular.",
    logo: "https://logo.clearbit.com/grupopetrop.com",
    websiteUrl: "https://grupopetrop.com",
    category: "Otros",
    department: "Managua",
    city: "Managua",
    address: "Km 15 Carretera a Tipitapa, Managua",
    phone: "+505 2255-4000",
    email: "ventas@grupopetrop.com",
    schedule: "Lun-Vie 7:30 AM - 5:00 PM",
    productCategories: ["Polietileno", "Polipropileno", "Resinas", "Masterbatch", "Plástico Reciclado", "Aditivos"],
    detailedProducts: [
      { name: "Polietileno Alta Densidad 25kg", priceRange: "$35 - $45", unit: "saco", description: "Para soplado e inyección." },
      { name: "Polietileno Baja Densidad 25kg", priceRange: "$32 - $42", unit: "saco", description: "Para películas y bolsas." },
      { name: "Polipropileno Homopolímero 25kg", priceRange: "$30 - $40", unit: "saco" },
      { name: "Masterbatch Negro 25kg", priceRange: "$55 - $70", unit: "saco" },
      { name: "Resina PET 25kg", priceRange: "$28 - $38", unit: "saco" },
    ],
    socialLinks: { facebook: "grupopetrop", instagram: "@grupopetrop" },
    featured: false,
    tags: ["plásticos", "polietileno", "resinas", "masterbatch", "reciclaje"]
  },

  // ═══════════════════════════════════════════════════════
  // ── TEXTIL Y CALZADO ──
  // ═══════════════════════════════════════════════════════
  {
    id: "shin-han",
    name: "Shin Han Nicaragua",
    description: "Telas, hilos y materias primas textiles. Zona Franca. Abastecen a la industria textil nicaragüense. Exportan a maquilas y talleres de costura en todo el país.",
    logo: "https://logo.clearbit.com/shinhan.com.ni",
    websiteUrl: "https://www.shinhan.com.ni",
    category: "Textil y Calzado",
    department: "Managua",
    city: "Managua",
    address: "Zona Franca Las Mercedes, Km 12.5 Carretera Norte, Managua",
    phone: "+505 2240-4000",
    email: "ventas@shinhan.com.ni",
    schedule: "Lun-Vie 7:30 AM - 5:00 PM",
    productCategories: ["Telas Poliéster", "Telas Algodón", "Hilos", "Forros", "Entretelas", "Elásticos", "Cierres"],
    detailedProducts: [
      { name: "Tela Poliéster Liso 150cm", priceRange: "C$45 - C$60", unit: "yarda", description: "Para uniformes y ropa casual." },
      { name: "Tela Algodón 100% 150cm", priceRange: "C$65 - C$85", unit: "yarda" },
      { name: "Tela Mezclilla Denim 180cm", priceRange: "C$90 - C$120", unit: "yarda" },
      { name: "Hilo Poliéster 100% Cono 5000yds", priceRange: "C$85 - C$110", unit: "cono" },
      { name: "Forro Poliéster 150cm", priceRange: "C$25 - C$35", unit: "yarda" },
      { name: "Entretela Fusible 100cm", priceRange: "C$35 - C$45", unit: "metro" },
      { name: "Cierre Nylon 15cm", priceRange: "C$8 - C$12", unit: "unidad" },
    ],
    socialLinks: { facebook: "shinhannicaragua" },
    featured: false,
    tags: ["textil", "telas", "hilos", "algodón", "poliéster"]
  },

  // ═══════════════════════════════════════════════════════
  // ── BELLEZA Y CUIDADO PERSONAL ──
  // ═══════════════════════════════════════════════════════
  {
    id: "nicanaturals",
    name: "Nicanaturals",
    description: "Aceites esenciales y productos naturales nicaragüenses. Coco, cacao, aguacate y lavanda cultivados en Rivas. Cosméticos naturales, aceites corporales y productos para el cabello. 100% orgánicos.",
    logo: "https://logo.clearbit.com/nicanaturals.com",
    websiteUrl: "https://nicanaturals.com",
    category: "Belleza y Cuidado Personal",
    department: "Rivas",
    city: "San Juan del Sur",
    address: "Calle Central, San Juan del Sur, Rivas",
    phone: "+505 8568-9900",
    email: "hola@nicanaturals.com",
    schedule: "Lun-Vie 8:00 AM - 5:00 PM | Sáb 9:00 AM - 1:00 PM",
    productCategories: ["Aceites Esenciales", "Mantecas", "Arcillas", "Cosméticos Naturales", "Cuidado Capilar", "Jabones Artesanales"],
    detailedProducts: [
      { name: "Aceite de Coco Orgánico 250ml", priceRange: "C$180 - C$220", unit: "250ml", description: "Prensado en frío. Virgen extra. Hidratante natural." },
      { name: "Aceite de Coco Orgánico 500ml", priceRange: "C$320 - C$380", unit: "500ml" },
      { name: "Manteca de Cacao Pura 200g", priceRange: "C$150 - C$190", unit: "200g", description: "Para labios y piel. 100% natural." },
      { name: "Aceite de Aguacate 100ml", priceRange: "C$220 - C$280", unit: "100ml", description: "Regenerador celular. Anti-edad." },
      { name: "Arcilla Verde 250g", priceRange: "C$120 - C$150", unit: "250g", description: "Mascarilla facial purificante." },
      { name: "Shampoo Sólido Coco 80g", priceRange: "C$95 - C$120", unit: "80g", description: "Sin sulfatos. Zero waste." },
      { name: "Jabón Artesanal Cúrcuma 100g", priceRange: "C$65 - C$85", unit: "100g" },
      { name: "Aceite Esencial Lavanda 10ml", priceRange: "C$180 - C$230", unit: "10ml" },
    ],
    socialLinks: { facebook: "nicanaturals", instagram: "@nicanaturals" },
    featured: true,
    tags: ["natural", "orgánico", "coco", "cacao", "cosméticos"]
  },
  {
    id: "laboratorios-ramos",
    name: "Laboratorios Ramos",
    description: "Industria farmacéutica nicaragüense. Medicamentos genéricos y de marca. +60 años de trayectoria. Producen 200+ medicamentos en Managua. Exportan a Centroamérica y el Caribe.",
    logo: "https://logo.clearbit.com/laboratoriosramos.com",
    websiteUrl: "https://laboratoriosramos.com",
    category: "Belleza y Cuidado Personal",
    department: "Managua",
    city: "Managua",
    address: "Km 8 Carretera Sur, Managua",
    phone: "+505 2266-2000",
    email: "info@labramos.com",
    schedule: "Lun-Vie 7:00 AM - 5:00 PM",
    productCategories: ["Medicamentos", "Vitaminas", "Suplementos", "Cuidado Personal", "Botiquín"],
    detailedProducts: [
      { name: "Paracetamol 500mg 20 tabletas", priceRange: "C$25 - C$35", unit: "caja" },
      { name: "Ibuprofeno 400mg 20 tabletas", priceRange: "C$35 - C$48", unit: "caja" },
      { name: "Vitamina C 500mg 30 tabletas", priceRange: "C$65 - C$85", unit: "frasco" },
      { name: "Complejo B 30 tabletas", priceRange: "C$55 - C$70", unit: "frasco" },
      { name: "Alcohol 70% 1L", priceRange: "C$65 - C$85", unit: "1L" },
      { name: "Agua Oxigenada 500ml", priceRange: "C$35 - C$48", unit: "500ml" },
    ],
    socialLinks: { facebook: "laboratoriosramos", instagram: "@labramos_nic" },
    featured: false,
    tags: ["farmacéutico", "medicamentos", "vitaminas", "salud"]
  },
]
