import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { createSectorSchema } from "@/lib/schemas"
import { slugify } from "@/lib/utils"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cityId = searchParams.get("cityId")
  const parentId = searchParams.get("parentId")
  const where: { isActive: boolean; cityId?: string; parentId?: string | null } = { isActive: true }
  if (cityId) where.cityId = cityId
  if (parentId === "null") where.parentId = null
  else if (parentId) where.parentId = parentId
  const sectors = await prisma.sector.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { merchants: true } } },
  })
  return NextResponse.json(sectors)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "MERCHANT")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  const body = await req.json()
  const parsed = createSectorSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "الاسم والمدينة مطلوبان" }, { status: 400 })
  const { nameAr, description, icon, image, cityId, parentId } = parsed.data
  const slug = slugify(nameAr)
  const sector = await prisma.sector.create({ data: { nameAr, slug, description, icon, image, cityId, parentId } })
  return NextResponse.json(sector)
}
