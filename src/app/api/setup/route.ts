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

    // ── Ensure demo buyer ──────────────────────────────────────────
    let buyer = await db.user.findUnique({ where: { email: 'comprador@demo.ni' } })
    if (!buyer) {
      buyer = await db.user.create({
        data: { email: 'comprador@demo.ni', name: 'Comprador Demo', password: pass, role: 'BUYER', isVerified: true, emailVerified: true }
      })
    }

    const ensureSeller = async (email: string, name: string, bizName: string) => {
      let u = await db.user.findUnique({ where: { email } })
      if (!u) {
        u = await db.user.create({ data: { email, name, password: pass, role: 'SELLER', isVerified: true, emailVerified: true } })
        await db.businessProfile.create({ data: { userId: u.id, businessName: bizName } })
      }
      return u.id
    }

    const sid1 = await ensureSeller('ferreteria@demo.ni', 'Ferretería Americana', 'Ferretería Americana')
    const sid2 = await ensureSeller('agroserv@demo.ni', 'Agroserv', 'Agroserv Nicaragua')
    const sid3 = await ensureSeller('tech@demo.ni', 'Tech Nicaragua', 'Tech Nicaragua')

    // ── Images: picsum.photos with unique seeds per product ──────────
    const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`

    const products = [
      { title:'Cemento Portland 42.5kg Argos',price:335,category:'Ferretería',desc:'Cemento Portland tipo I, bolsa de 42.5kg. Ideal para todo tipo de construcción.',tags:'cemento,construccion',qty:500,sid:sid1,img:img('cemento42')},
      { title:'Varilla Corrugada 1/2" x 6m',price:148,category:'Ferretería',desc:'Varilla corrugada de acero grado 60. Cumple normas ASTM A615.',tags:'varilla,acero',qty:1000,sid:sid1,img:img('varilla12')},
      { title:'Tubo PVC Hidráulico 4" x 3m',price:168,category:'Ferretería',desc:'Tubo PVC hidráulico SDR-26 clase 10, unión cementar.',tags:'tubo,pvc,hidraulico',qty:300,sid:sid1,img:img('tubopvc4')},
      { title:'Pintura Vinílica 1 Galón',price:295,category:'Ferretería',desc:'Pintura vinílica lavable alta cobertura, acabado mate. Colores variados.',tags:'pintura,vinilica',qty:200,sid:sid1,img:img('pintura01')},
      { title:'Taladro DeWalt 20V',price:4250,category:'Ferretería',desc:'Taladro inalámbrico DeWalt 20V Max, 2 baterías, 15 embragues, incluye maletín.',tags:'taladro,dewalt,herramienta',qty:30,sid:sid1,img:img('dewalt20v')},
      { title:'Fertilizante NPK 15-15-15 50kg',price:695,category:'Agropecuaria',desc:'Fertilizante granulado NPK triple 15. Ideal para maíz, frijol y hortalizas.',tags:'fertilizante,npk,agro',qty:300,sid:sid2,img:img('fertilizante')},
      { title:'Semilla de Frijol Rojo INTA 25kg',price:1450,category:'Agropecuaria',desc:'Semilla certificada de frijol rojo variedad INTA-Rojo, alto rendimiento.',tags:'semilla,frijol,inta',qty:100,sid:sid2,img:img('frijolrojo')},
      { title:'Pesticida Cipermetrina 1L',price:385,category:'Agropecuaria',desc:'Insecticida piretroide de amplio espectro para hortalizas y granos básicos.',tags:'pesticida,insecticida',qty:200,sid:sid2,img:img('pesticida01')},
      { title:'Laptop Dell Inspiron 15 i5',price:18500,category:'Tecnología',desc:'Dell Inspiron 15 3525, AMD Ryzen 5, 12GB RAM, 512GB SSD, Windows 11.',tags:'laptop,dell,computadora',qty:15,sid:sid3,img:img('dell-inspiron')},
      { title:'Monitor LG 27" 4K UHD',price:8900,category:'Tecnología',desc:'Monitor LG 27UP600 27" 4K UHD, panel IPS, HDR10, HDMI+DisplayPort.',tags:'monitor,lg,4k,uhd',qty:10,sid:sid3,img:img('monitor-4k')},
      { title:'Impresora HP LaserJet Pro',price:12500,category:'Tecnología',desc:'HP LaserJet Pro M404dn, impresión dúplex automática, Ethernet, 40ppm.',tags:'impresora,hp,laser',qty:8,sid:sid3,img:img('hp-laserjet')},
      { title:'Teclado Mecánico Logitech G Pro',price:3200,category:'Tecnología',desc:'Logitech G Pro Mechanical Gaming Keyboard, switches GX Blue Clicky, RGB.',tags:'teclado,gaming,logitech',qty:25,sid:sid3,img:img('logitech-gpro')},
    ]

    let c = 0
    for (const p of products) {
      await db.product.create({
        data: {
          sellerId: p.sid,
          title: p.title,
          description: p.desc,
          price: p.price,
          category: p.category,
          tags: p.tags,
          quantity: p.qty,
          status: 'ACTIVE',
          images: JSON.stringify([p.img]),
        }
      })
      c++
    }

    return NextResponse.json({ success:true, message:`¡${c} productos creados con imágenes!`, productCount:c })
  } catch(err) {
    return NextResponse.json({ success:false, error:(err as Error).message }, { status:200 })
  }
}
