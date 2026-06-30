/**
 * Supplier Catalog Integration
 * 
 * Shows official supplier catalogs with real product data
 * Each supplier card links to their official website for live pricing & products
 */
export interface SupplierCatalog {
  id: string
  name: string
  description: string
  logo?: string
  websiteUrl: string
  category: string
  department: string
  phone: string
  productCategories: string[]
  featured: boolean
}

export const SUPPLIER_CATALOGS: SupplierCatalog[] = [
  // ── ALIMENTOS Y BEBIDAS ──
  {
    id: "flor-de-cana",
    name: "Flor de Caña (ISA)",
    description: "Ron premium nicaragüense. 5 generaciones de excelencia desde 1890. Catalogo completo de rones añejados.",
    websiteUrl: "https://www.flordecana.com/es",
    category: "Alimentos y Bebidas",
    department: "Chinandega",
    phone: "+505 2341-6000",
    productCategories: ["Ron 4 Años", "Ron 7 Años", "Ron 12 Años", "Ron 18 Años", "Ron 25 Años", "Azúcar", "Bioetanol"],
    featured: true
  },
  {
    id: "cafe-toro",
    name: "Café Toro",
    description: "Café tostado y molido de Matagalpa. Tradición nicaragüense.",
    websiteUrl: "https://www.cafetoro.com",
    category: "Alimentos y Bebidas",
    department: "Matagalpa",
    phone: "+505 2772-2000",
    productCategories: ["Café Tradicional", "Café Gourmet", "Café Molido", "Café en Grano"],
    featured: true
  },
  {
    id: "cafe-presto",
    name: "Café Prestó",
    description: "Café soluble instantáneo. Líder en Nicaragua.",
    websiteUrl: "https://www.cafepresto.com",
    category: "Alimentos y Bebidas",
    department: "Managua",
    phone: "+505 2263-1000",
    productCategories: ["Café Instantáneo", "Café Grano de Oro", "Café Sachet"],
    featured: true
  },
  {
    id: "ccn",
    name: "CCN (Compañía Cervecera)",
    description: "Cervezas, gaseosas y bebidas. Coca-Cola, Toña, Victoria.",
    websiteUrl: "https://www.ccn.com.ni",
    category: "Alimentos y Bebidas",
    department: "Managua",
    phone: "+505 2248-2000",
    productCategories: ["Cerveza Toña", "Cerveza Victoria", "Coca-Cola", "Agua", "Jugos"],
    featured: true
  },
  {
    id: "delipollo",
    name: "Pollo Tip Top",
    description: "Pollo fresco y alimentos procesados. Calidad garantizada.",
    websiteUrl: "https://www.delipollo.com",
    category: "Alimentos y Bebidas",
    department: "Managua",
    phone: "+505 2248-4600",
    productCategories: ["Pollo Entero", "Pechuga", "Alitas", "Embutidos"],
    featured: true
  },
  {
    id: "agricorp",
    name: "AGRICORP",
    description: "Arroz, granos y harinas. Líder en procesamiento de granos.",
    websiteUrl: "https://agricorp.com",
    category: "Alimentos y Bebidas",
    department: "Managua",
    phone: "+505 2298-4400",
    productCategories: ["Arroz 80/20", "Arroz 95/5", "Semillas", "Granos"],
    featured: true
  },
  {
    id: "doselva",
    name: "Doselva",
    description: "Especias orgánicas: cúrcuma, jengibre, cardamomo, vainilla.",
    websiteUrl: "https://doselva.com",
    category: "Alimentos y Bebidas",
    department: "Matagalpa",
    phone: "+505 2772-8800",
    productCategories: ["Cúrcuma", "Jengibre", "Cardamomo", "Vainilla"],
    featured: false
  },
  {
    id: "lala-nicaragua",
    name: "Lala Nicaragua",
    description: "Lácteos y derivados. Leche, yogurt, crema.",
    websiteUrl: "https://www.lala.com.ni",
    category: "Alimentos y Bebidas",
    department: "Managua",
    phone: "+505 2270-0700",
    productCategories: ["Leche Entera", "Leche Descremada", "Yogurt", "Crema"],
    featured: false
  },

  // ── CONSTRUCCIÓN Y FERRETERÍA ──
  {
    id: "ferromax",
    name: "Ferromax Nicaragua",
    description: "Acero y materiales de construcción. Varillas, láminas, tubos.",
    websiteUrl: "https://www.ferromax.com.ni",
    category: "Construcción y Ferretería",
    department: "Managua",
    phone: "+505 2255-6600",
    productCategories: ["Varillas", "Láminas Zinc", "Tubería", "Ángulos", "Alambre"],
    featured: true
  },
  {
    id: "proinco",
    name: "PROINCO",
    description: "Materiales eléctricos y ferretería industrial.",
    websiteUrl: "https://www.proinco.com.ni",
    category: "Construcción y Ferretería",
    department: "Managua",
    phone: "+505 2276-9410",
    productCategories: ["Cables", "Breakers", "Tubos Conduit", "Transformadores"],
    featured: true
  },

  // ── TECNOLOGÍA Y ELECTRÓNICA ──
  {
    id: "la-curacao",
    name: "La Curacao Nicaragua",
    description: "Electrodomésticos, muebles, tecnología. Compra en línea.",
    websiteUrl: "https://www.lacuracaonline.com/nicaragua/",
    category: "Tecnología y Electrónica",
    department: "Managua",
    phone: "+505 2298-5000",
    productCategories: ["TVs", "Refrigeradoras", "Lavadoras", "Laptops", "Celulares", "Muebles"],
    featured: true
  },

  // ── VEHÍCULOS Y TRANSPORTE ──
  {
    id: "casa-pellas",
    name: "Casa Pellas",
    description: "Toyota, Suzuki, Yamaha. Vehículos, repuestos y servicio.",
    websiteUrl: "https://grupocasapellas.com",
    category: "Transporte y Logística",
    department: "Managua",
    phone: "+505 2255-5000",
    productCategories: ["Toyota Hilux", "Toyota Corolla", "Suzuki Alto", "Yamaha YBR125", "Repuestos"],
    featured: true
  },

  // ── AGRICULTURA ──
  {
    id: "disagro",
    name: "Disagro",
    description: "Insumos agrícolas: fertilizantes, herbicidas, insecticidas.",
    websiteUrl: "https://disagro.com",
    category: "Agricultura y Ganadería",
    department: "Managua",
    phone: "+505 2276-8800",
    productCategories: ["Fertilizantes", "Herbicidas", "Insecticidas", "Fungicidas"],
    featured: true
  },
  {
    id: "cisa-agro",
    name: "CISA AGRO",
    description: "Fertilizantes, semillas híbridas, agroquímicos.",
    websiteUrl: "https://www.cisaagro.com",
    category: "Agricultura y Ganadería",
    department: "Managua",
    phone: "+505 2240-2000",
    productCategories: ["Fertilizantes Foliares", "Semillas de Maíz", "Herbicidas"],
    featured: false
  },

  // ── INDUSTRIAL Y QUÍMICOS ──
  {
    id: "brenntag",
    name: "Brenntag Nicaragua",
    description: "Productos químicos industriales y alimenticios.",
    websiteUrl: "https://brenntag.com",
    category: "Otros",
    department: "Managua",
    phone: "+505 2255-5800",
    productCategories: ["Ácido Cítrico", "Soda Cáustica", "Aditivos", "Solventes"],
    featured: false
  },
  {
    id: "grupo-petrop",
    name: "Grupo Petrop",
    description: "Materias primas plásticas. Polietileno, polipropileno.",
    websiteUrl: "https://grupopetrop.com",
    category: "Otros",
    department: "Managua",
    phone: "+505 2255-4000",
    productCategories: ["Polietileno", "Polipropileno", "Resinas", "Masterbatch"],
    featured: false
  },

  // ── TEXTIL ──
  {
    id: "shin-han",
    name: "Shin Han Nicaragua",
    description: "Telas, hilos y materias primas textiles.",
    websiteUrl: "https://www.shinhan.com.ni",
    category: "Textil y Calzado",
    department: "Managua",
    phone: "+505 2240-4000",
    productCategories: ["Telas Poliéster", "Hilos", "Forros", "Entretelas"],
    featured: false
  },

  // ── BELLEZA ──
  {
    id: "nicanaturals",
    name: "Nicanaturals",
    description: "Aceites esenciales y productos naturales. Coco, cacao, lavanda.",
    websiteUrl: "https://nicanaturals.com",
    category: "Belleza y Cuidado Personal",
    department: "Rivas",
    phone: "+505 8568-9900",
    productCategories: ["Aceite de Coco", "Manteca de Cacao", "Aceite de Aguacate", "Arcillas"],
    featured: true
  },
]
