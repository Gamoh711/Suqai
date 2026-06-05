import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { toggleFavoriteSchema } from "@/lib/schemas"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  const favorites = await prisma.favorite.findMany({
    where: { userId: session.userId },
    include: { product: { include: { merchant: { select: { nameAr: true, slug: true } } } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(favorites)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  const body = await req.json()
  const parsed = toggleFavoriteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "المنتج مطلوب" }, { status: 400 })
  const { productId } = parsed.data
  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: session.userId, productId } },
  })
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ favorited: false })
  }
  await prisma.favorite.create({ data: { userId: session.userId, productId } })
  return NextResponse.json({ favorited: true })
}
