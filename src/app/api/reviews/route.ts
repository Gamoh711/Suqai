import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { reviewSchema } from "@/lib/schemas"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const merchantParam = searchParams.get("merchant")
  const mine = searchParams.get("mine")

  if (mine === "true" && session.role === "CONSUMER") {
    const reviews = await prisma.review.findMany({
      where: { consumerId: session.userId },
      include: { merchant: { select: { nameAr: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(reviews)
  }

  if (merchantParam === "own" && session.role === "MERCHANT") {
    const merchant = await prisma.merchant.findUnique({ where: { userId: session.userId } })
    if (!merchant) return NextResponse.json([])
    const reviews = await prisma.review.findMany({
      where: { merchantId: merchant.id },
      include: { consumer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(reviews)
  }

  return NextResponse.json([])
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const body = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
  }
  const { rating, comment, merchantId } = parsed.data

  const existing = await prisma.review.findUnique({
    where: { consumerId_merchantId: { consumerId: session.userId, merchantId } },
  })
  if (existing) {
    return NextResponse.json({ error: "قمت بتقييم هذا التاجر مسبقاً" }, { status: 400 })
  }

  const review = await prisma.review.create({
    data: { rating, comment, consumerId: session.userId, merchantId },
    include: { consumer: { select: { name: true } } },
  })
  return NextResponse.json(review)
}
