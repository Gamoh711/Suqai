import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { createMerchantSchema } from "@/lib/schemas"
import { slugify } from "@/lib/utils"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sectorId = searchParams.get("sectorId")
  const cityId = searchParams.get("cityId")
  const all = searchParams.get("all") === "true"
  const where = { ...(all ? {} : { status: "active" }), ...(sectorId ? { sectorId } : {}), ...(cityId ? { cityId } : {}) }
  const merchants = await prisma.merchant.findMany({
    where,
    include: {
      city: all ? { select: { nameAr: true } } : false,
      sector: all ? { select: { nameAr: true } } : false,
      _count: { select: { products: true, reviews: true } },
      reviews: { select: { rating: true } },
    },
  })
  const enriched = merchants.map((m) => {
    const avgRating = m.reviews.length > 0
      ? m.reviews.reduce((a: number, r: { rating: number }) => a + r.rating, 0) / m.reviews.length
      : null
    const { city, sector, ...rest } = m
    return all ? { ...rest, city, sector, avgRating } : { ...rest, avgRating }
  })
  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const body = await req.json()
  const parsed = createMerchantSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "الاسم والمدينة والقطاع مطلوبون" }, { status: 400 })
  const data = parsed.data

  const existing = await prisma.merchant.findUnique({ where: { userId: session.userId } })
  if (existing) {
    return NextResponse.json({ error: "لديك متجر بالفعل" }, { status: 400 })
  }

  const slug = slugify(data.nameAr) + "-" + Date.now().toString(36)
  const merchant = await prisma.merchant.create({
    data: {
      nameAr: data.nameAr,
      slug,
      description: data.description,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      address: data.address,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      workingHours: data.workingHours,
      cityId: data.cityId,
      sectorId: data.sectorId,
      userId: session.userId,
    },
  })
  await prisma.user.update({ where: { id: session.userId }, data: { role: "MERCHANT" } })
  return NextResponse.json(merchant)
}
