import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { aiChatSchema } from "@/lib/schemas"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-assistant:8000"

async function indexData() {
  try {
    const [sectors, merchants, products] = await Promise.all([
      prisma.sector.findMany({ where: { isActive: true }, include: { city: { select: { id: true } } } }),
      prisma.merchant.findMany({ where: { status: "active" }, include: { city: { select: { id: true } }, sector: { select: { nameAr: true } } } }),
      prisma.product.findMany({ where: { isActive: true }, include: { merchant: { select: { nameAr: true, sector: { select: { nameAr: true } }, cityId: true } } }, take: 200 }),
    ])

    const documents = [
      ...sectors.map(s => ({ id: `sector_${s.id}`, text: `${s.nameAr} - ${s.description || ""}`, sector: s.nameAr, merchant: "", city_id: s.city.id })),
      ...merchants.map(m => ({ id: `merchant_${m.id}`, text: `${m.nameAr} - ${m.description || ""}`, sector: m.sector?.nameAr || "", merchant: m.nameAr, city_id: m.cityId })),
      ...products.map(p => ({ id: `product_${p.id}`, text: `${p.nameAr} - ${p.description || ""} - ${p.merchant.nameAr}`, sector: p.merchant.sector?.nameAr || "", merchant: p.merchant.nameAr, city_id: p.merchant.cityId })),
    ]

    await fetch(`${AI_SERVICE_URL}/index`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documents }),
    })
    return true
  } catch {
    return false
  }
}

let indexingAttempted = false

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = aiChatSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "الرسالة مطلوبة" }, { status: 400 })
    const { message, cityId } = parsed.data

    const text = message.trim()

    const greetings = ["مرحبا", "السلام", "hi", "hello", "اهلا"]
    if (greetings.some(g => text.includes(g))) {
      const cities = await prisma.city.findMany({ where: { isActive: true }, select: { nameAr: true, slug: true } })
      return NextResponse.json({
        response: `مرحباً بك في سوقي!\nيمكنني مساعدتك في إيجاد التجار والمنتجات.\nالمدن المتاحة: ${cities.map(c => c.nameAr).join("، ")}\nاختر مدينك ثم أخبرني ما الذي تبحث عنه.`,
        cities: cities.slice(0, 5),
      })
    }

    if (!indexingAttempted) {
      indexingAttempted = true
      indexData().catch(() => {})
    }

    let aiResult = null
    try {
      const aiRes = await fetch(`${AI_SERVICE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, city_id: cityId || null }),
        signal: AbortSignal.timeout(5000),
      })
      if (aiRes.ok) aiResult = await aiRes.json()
    } catch {}

    if (aiResult && aiResult.intent !== "not_found" && aiResult.intent !== "general") {
      return NextResponse.json({ response: aiResult.response, suggestions: aiResult.suggestions || [] })
    }

    const sectors = await prisma.sector.findMany({
      where: { isActive: true, ...(cityId ? { cityId } : {}) },
      include: { _count: { select: { merchants: true } } },
    })

    const matchedSector = sectors.find(s => text.includes(s.nameAr) || text.includes(s.slug))
    if (matchedSector) {
      const merchants = await prisma.merchant.findMany({
        where: { sectorId: matchedSector.id, status: "active" },
        include: { _count: { select: { reviews: true } }, reviews: { select: { rating: true } } },
        take: 5,
      })
      merchants.sort((a, b) => {
        const aAvg = a.reviews.length ? a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length : 0
        const bAvg = b.reviews.length ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length : 0
        return bAvg - aAvg
      })
      return NextResponse.json({
        response: merchants.length > 0
          ? `وجدت ${merchants.length} تاجر في ${matchedSector.nameAr}:\n${merchants.map((m, i) => `${i + 1}. ${m.nameAr} (${m._count.reviews} تقييم)`).join("\n")}`
          : `لا يوجد تجار متاحون في ${matchedSector.nameAr} حالياً`,
        merchants: merchants.slice(0, 3),
      })
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { nameAr: { contains: text, mode: "insensitive" } },
          { description: { contains: text, mode: "insensitive" } },
          { tags: { has: text } },
        ],
      },
      include: { merchant: { select: { nameAr: true, slug: true, city: { select: { slug: true } }, sector: { select: { slug: true } } } } },
      take: 3,
    })

    if (products.length > 0) {
      return NextResponse.json({
        response: `وجدت ${products.length} منتج:\n${products.map((p, i) => `${i + 1}. ${p.nameAr} - ${p.price} SAR (${p.merchant.nameAr})`).join("\n")}`,
        products: products.slice(0, 3),
      })
    }

    return NextResponse.json({
      response: "عذراً، لم أتمكن من العثور على نتائج. جرب بكلمات مختلفة.",
    })
  } catch (error) {
    logger.error("AI chat error", { module: "ai", context: { error: String(error) } })
    return NextResponse.json({ response: "عذراً، حدث خطأ. حاول مرة أخرى." })
  }
}
