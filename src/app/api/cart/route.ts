import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { addCartItemSchema, updateCartItemSchema } from "@/lib/schemas"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "CONSUMER") return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const items = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: { select: { id: true, nameAr: true, price: true, images: true, merchantId: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "CONSUMER") return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const body = await req.json()
  const parsed = addCartItemSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "المنتج مطلوب" }, { status: 400 })
  const { productId, quantity } = parsed.data

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: session.userId, productId } },
  })

  if (existing) {
    const item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + (quantity || 1) },
      include: { product: { select: { nameAr: true } } },
    })
    return NextResponse.json(item)
  }

  const item = await prisma.cartItem.create({
    data: { userId: session.userId, productId, quantity: quantity || 1 },
    include: { product: { select: { nameAr: true } } },
  })
  return NextResponse.json(item)
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "CONSUMER") return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get("itemId")
  if (!itemId) return NextResponse.json({ error: "معرف العنصر مطلوب" }, { status: 400 })

  await prisma.cartItem.delete({ where: { id: itemId, userId: session.userId } })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "CONSUMER") return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const body = await req.json()
  const parsed = updateCartItemSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "المعرف والكمية مطلوبان" }, { status: 400 })
  const { itemId, quantity } = parsed.data

  const item = await prisma.cartItem.update({
    where: { id: itemId, userId: session.userId },
    data: { quantity },
  })
  return NextResponse.json(item)
}
