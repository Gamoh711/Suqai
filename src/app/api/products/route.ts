import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { productSchema } from "@/lib/schemas"

export async function GET(req: Request) {
  const session = await getSession()
  const { searchParams } = new URL(req.url)
  let merchantId = searchParams.get("merchantId")
  const sectorId = searchParams.get("sectorId")
  const q = searchParams.get("q")

  // If merchant user requests own products, auto-filter
  if (!merchantId && session?.role === "MERCHANT") {
    const merchant = await prisma.merchant.findUnique({ where: { userId: session.userId } })
    if (merchant) merchantId = merchant.id
  }

  const merchantIdsForSector = sectorId ? await prisma.merchant.findMany({ where: { sectorId }, select: { id: true } }) : null
  const products = await prisma.product.findMany({
    where: {
      ...(merchantId ? { merchantId } : { isActive: true }),
      ...(q ? { OR: [{ nameAr: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }, { tags: { has: q } }] } : {}),
      ...(merchantIdsForSector ? { merchantId: { in: merchantIdsForSector.map((m) => m.id) } } : {}),
    },
    include: { merchant: { select: { nameAr: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "MERCHANT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  const merchant = await prisma.merchant.findUnique({ where: { userId: session.userId } })
  if (!merchant) return NextResponse.json({ error: "ليس لديك متجر" }, { status: 400 })

  const body = await req.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
  }
  const { nameAr, description, price, currency, images, isService, category, tags } = parsed.data
  const product = await prisma.product.create({
    data: {
      nameAr, description, price, currency: currency || "SAR",
      images: images || [], isService: isService || false, category, tags: tags || [],
      merchantId: merchant.id,
    },
  })
  return NextResponse.json(product)
}
