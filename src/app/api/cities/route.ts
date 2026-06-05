import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { createCitySchema } from "@/lib/schemas"
import { slugify } from "@/lib/utils"

export async function GET() {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    orderBy: { nameAr: "asc" },
  })
  return NextResponse.json(cities)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  try {
    const body = await req.json()
    const parsed = createCitySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "اسم المدينة مطلوب" }, { status: 400 })
    const { nameAr, slug: customSlug, lat, lng, image } = parsed.data
    const slug = customSlug || slugify(nameAr)
    const city = await prisma.city.create({ data: { nameAr, slug, lat, lng, image } })
    return NextResponse.json(city)
  } catch {
    return NextResponse.json({ error: "فشل إنشاء المدينة" }, { status: 500 })
  }
}
