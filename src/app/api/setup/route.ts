import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import crypto from 'crypto'

// ── Native Turso HTTP API ──────────────────────────────────────────────
const TURSO_HOST = (process.env.TURSO_DATABASE_URL || '')
  .replace(/^libsql:\/\//, '')
  .split('?')[0]
  .replace(/\/$/, '')
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || ''

function tursoExecute(sql: string, args?: unknown[]): Promise<{ columns: string[]; rows: unknown[][] }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ requests: [{ type: 'execute', stmt: { sql, args: args || [] } }] })
    const req = https.request({
      hostname: TURSO_HOST, path: '/v2/pipeline', method: 'POST',
      headers: { 'Authorization': `Bearer ${TURSO_TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 30000,
    }, (res) => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try {
          const j = JSON.parse(d); const r = j.results?.[0]
          if (r?.type === 'error') reject(new Error(r.error?.message || 'Turso error'))
          else resolve({ columns: r?.columns || [], rows: r?.rows || [] })
        } catch { reject(new Error(`HTTP ${res.statusCode}`)) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(body); req.end()
  })
}

function cuid(): string {
  const t = Date.now().toString(36)
  const r = crypto.randomBytes(4).toString('hex')
  return `c${t}${r}`
}

const now = () => new Date().toISOString()

// ── GET handler ──────────────────────────────────────────────────────
export async function GET() {
  try {
    const { rows } = await tursoExecute('SELECT count(*) as c FROM "User"')
    const userCount = rows[0]?.[0] ?? 0
    const p = await tursoExecute('SELECT count(*) as c FROM "Product"')
    const productCount = Number(p.rows[0]?.[0] ?? 0)
    return NextResponse.json({ success: true, data: { userCount, productCount, needsSeed: productCount === 0 } })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 200 })
  }
}

// ── POST: seed database ──────────────────────────────────────────────
export async function POST() {
  try {
    const p = await tursoExecute('SELECT count(*) as c FROM "Product"')
    const productCount = Number(p.rows[0]?.[0] ?? 0)
    if (productCount > 0) {
      return NextResponse.json({ success: true, message: `Ya hay ${productCount} productos` })
    }

    const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`
    const passHash = '$2a$12$LJ3m4ys3Gql.ZhkBARVOceOKVsS9DXoGAqLUKnApMXCm5kFmFR4We' // admin123

    // Create demo buyer
    const buyerId = cuid()
    await tursoExecute(
      `INSERT INTO "User" ("id","email","name","password","role","isVerified","emailVerified","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?)`,
      [buyerId, 'comprador@demo.ni', 'Comprador Demo', passHash, 'BUYER', 1, 1, now(), now()]
    )

    // Create 3 sellers
    const sellers = [
      { email: 'ferreteria@demo.ni', name: 'Ferretería Americana', biz: 'Ferretería Americana' },
      { email: 'agroserv@demo.ni', name: 'Agroserv', biz: 'Agroserv Nicaragua' },
      { email: 'tech@demo.ni', name: 'Tech Nicaragua', biz: 'Tech Nicaragua' },
    ]
    const sids: string[] = []
    for (const s of sellers) {
      const sid = cuid()
      sids.push(sid)
      await tursoExecute(
        `INSERT INTO "User" ("id","email","name","password","role","isVerified","emailVerified","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?)`,
        [sid, s.email, s.name, passHash, 'SELLER', 1, 1, now(), now()]
      )
      await tursoExecute(
        `INSERT INTO "BusinessProfile" ("id","userId","businessName","createdAt","updatedAt") VALUES (?,?,?,?,?)`,
        [cuid(), sid, s.biz, now(), now()]
      )
    }

    // Create 12 products with images
    const products = [
      { t:'Cemento Portland 42.5kg Argos',p:335,cat:'Ferretería',d:'Cemento Portland tipo I, bolsa de 42.5kg.',tg:'cemento,construccion',q:500,img:'cemento42',s:0 },
      { t:'Varilla Corrugada 1/2" x 6m',p:148,cat:'Ferretería',d:'Varilla corrugada de acero grado 60.',tg:'varilla,acero',q:1000,img:'varilla12',s:0 },
      { t:'Tubo PVC Hidráulico 4" x 3m',p:168,cat:'Ferretería',d:'Tubo PVC SDR-26 clase 10.',tg:'tubo,pvc',q:300,img:'tubopvc4',s:0 },
      { t:'Pintura Vinílica 1 Galón',p:295,cat:'Ferretería',d:'Pintura vinílica lavable, mate.',tg:'pintura',q:200,img:'pintura01',s:0 },
      { t:'Taladro DeWalt 20V',p:4250,cat:'Ferretería',d:'Taladro inalámbrico 20V, 2 baterías.',tg:'taladro,dewalt',q:30,img:'dewalt20v',s:0 },
      { t:'Fertilizante NPK 15-15-15 50kg',p:695,cat:'Agropecuaria',d:'Fertilizante granulado NPK.',tg:'fertilizante',q:300,img:'fertilizante',s:1 },
      { t:'Semilla de Frijol Rojo INTA 25kg',p:1450,cat:'Agropecuaria',d:'Semilla certificada frijol INTA Rojo.',tg:'semilla,frijol',q:100,img:'frijolrojo',s:1 },
      { t:'Pesticida Cipermetrina 1L',p:385,cat:'Agropecuaria',d:'Insecticida piretroide amplio espectro.',tg:'pesticida',q:200,img:'pesticida01',s:1 },
      { t:'Laptop Dell Inspiron 15',p:18500,cat:'Tecnología',d:'Dell Inspiron 15, Ryzen 5, 12GB, 512GB SSD.',tg:'laptop,dell',q:15,img:'dell-inspiron',s:2 },
      { t:'Monitor LG 27" 4K UHD',p:8900,cat:'Tecnología',d:'LG 27UP600 4K UHD, IPS, HDR10.',tg:'monitor,lg,4k',q:10,img:'monitor-4k',s:2 },
      { t:'Impresora HP LaserJet Pro',p:12500,cat:'Tecnología',d:'HP LaserJet Pro M404dn, dúplex, 40ppm.',tg:'impresora,hp',q:8,img:'hp-laserjet',s:2 },
      { t:'Teclado Mecánico Logitech G Pro',p:3200,cat:'Tecnología',d:'Logitech G Pro, switches GX Blue, RGB.',tg:'teclado,gaming',q:25,img:'logitech-gpro',s:2 },
    ]

    let c = 0
    for (const prod of products) {
      const pid = cuid()
      await tursoExecute(
        `INSERT INTO "Product" ("id","sellerId","title","description","price","category","tags","images","quantity","status","publishedAt","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [pid, sids[prod.s], prod.t, prod.d, prod.p, prod.cat, prod.tg, JSON.stringify([img(prod.img)]), prod.q, 'ACTIVE', now(), now(), now()]
      )
      c++
    }

    return NextResponse.json({ success: true, message: `¡${c} productos creados con imágenes!`, productCount: c })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 200 })
  }
}
