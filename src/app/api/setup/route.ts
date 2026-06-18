import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(_request: NextRequest) {
  try {
    const userCount = await db.user.count()
    const productCount = await db.product.count()
    return NextResponse.json({
      success: true,
      data: { connected: true, userCount, productCount, needsSeed: productCount === 0 },
    })
  } catch (err) {
    return NextResponse.json({
      success: false, error: (err as Error).message,
    }, { status: 200 })
  }
}

export async function POST(_request: NextRequest) {
  try {
    const productCount = await db.product.count()
    if (productCount > 0) {
      return NextResponse.json({ success: true, message: `Ya hay ${productCount} productos`, productCount })
    }

    const pass = await bcrypt.hash('admin123', 12)

    const ensureSeller = async (email: string, name: string, role: string, bizName?: string) => {
      let u = await db.user.findUnique({ where: { email } })
      if (!u) {
        u = await db.user.create({ data: { email, name, password: pass, role, isVerified: true, emailVerified: true } })
        if (bizName) await db.businessProfile.create({ data: { userId: u.id, businessName: bizName } })
      }
      return u.id
    }

    const sid1 = await ensureSeller('ferreteria@demo.ni', 'Ferretería Americana', 'SELLER', 'Ferretería Americana')
    const sid2 = await ensureSeller('agroserv@demo.ni', 'Agroserv', 'SELLER', 'Agroserv')
    const sid3 = await ensureSeller('tech@demo.ni', 'Tech Nicaragua', 'SELLER', 'Tech Nicaragua')

    const products = [
      { title:'Cemento Portland 42.5kg Argos',price:335,category:'Ferretería',desc:'Cemento Portland tipo I, bolsa de 42.5kg.',tags:'cemento,construccion',qty:500,sid:sid1},
      { title:'Varilla Corrugada 1/2" x 6m',price:148,category:'Ferretería',desc:'Varilla corrugada de acero grado 60.',tags:'varilla,acero',qty:1000,sid:sid1},
      { title:'Tubo PVC Hidráulico 4" x 3m',price:168,category:'Ferretería',desc:'Tubo PVC hidráulico clase 10.',tags:'tubo,pvc',qty:300,sid:sid1},
      { title:'Pintura Vinílica 1 Galón',price:295,category:'Ferretería',desc:'Pintura vinílica alta cobertura, mate.',tags:'pintura',qty:200,sid:sid1},
      { title:'Taladro DeWalt 20V',price:4250,category:'Ferretería',desc:'Taladro inalámbrico 20V, 2 baterías.',tags:'taladro,dewalt',qty:30,sid:sid1},
      { title:'Fertilizante NPK 15-15-15 50kg',price:695,category:'Agropecuaria',desc:'Fertilizante granulado NPK.',tags:'fertilizante',qty:300,sid:sid2},
      { title:'Semilla de Frijol Rojo 25kg',price:1450,category:'Agropecuaria',desc:'Semilla frijol INTA Rojo.',tags:'semilla,frijol',qty:100,sid:sid2},
      { title:'Pesticida Cipermetrina 1L',price:385,category:'Agropecuaria',desc:'Insecticida para hortalizas.',tags:'pesticida',qty:200,sid:sid2},
      { title:'Laptop Dell Inspiron 15 i5',price:18500,category:'Tecnología',desc:'Dell Inspiron 15, i5 12va, 12GB RAM, 512GB SSD.',tags:'laptop,dell',qty:15,sid:sid3},
      { title:'Monitor LG 27" 4K UHD',price:8900,category:'Tecnología',desc:'Monitor LG 27" 4K, IPS, HDMI+DP.',tags:'monitor,lg,4k',qty:10,sid:sid3},
      { title:'Impresora HP LaserJet Pro',price:12500,category:'Tecnología',desc:'HP LaserJet Pro M404dn, dúplex, red.',tags:'impresora,hp',qty:8,sid:sid3},
      { title:'Teclado Mecánico Logitech G Pro',price:3200,category:'Tecnología',desc:'Logitech G Pro, switches GX Blue.',tags:'teclado,gaming',qty:25,sid:sid3},
    ]

    let c = 0
    for (const p of products) {
      await db.product.create({ data: { sellerId:p.sid, title:p.title, description:p.desc, price:p.price, category:p.category, tags:p.tags, quantity:p.qty, status:'ACTIVE', images:'[]' } })
      c++
    }

    return NextResponse.json({ success:true, message:`¡${c} productos creados!`, productCount:c })
  } catch(err) {
    return NextResponse.json({ success:false, error:(err as Error).message }, { status:200 })
  }
}
