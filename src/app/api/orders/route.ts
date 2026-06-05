import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { orderSchema, updateOrderStatusSchema } from "@/lib/schemas"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const merchantId = searchParams.get("merchantId")

  let merchantIdsToFilter = merchantId
  if (session.role === "MERCHANT") {
    const merchant = await prisma.merchant.findUnique({ where: { userId: session.userId } })
    if (merchant) merchantIdsToFilter = merchant.id
  }
  const orders = await prisma.order.findMany({
    where: {
      ...(session.role === "CONSUMER" ? { consumerId: session.userId } : {}),
      ...(merchantIdsToFilter ? { merchantId: merchantIdsToFilter } : {}),
    },
    include: {
      consumer: { select: { name: true, phone: true, email: true } },
      merchant: { select: { nameAr: true } },
      items: { include: { product: { select: { nameAr: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(orders)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const body = await req.json()
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
  }
  const { merchantId, message, productIds, phone } = parsed.data

  if (phone) {
    await prisma.user.update({ where: { id: session.userId }, data: { phone } })
  }

  const products = productIds ? await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true },
  }) : []

  const order = await prisma.order.create({
    data: {
      consumerId: session.userId,
      merchantId,
      message,
      items: productIds ? {
        create: productIds.map((pid: string) => ({
          productId: pid,
          unitPrice: products.find(p => p.id === pid)?.price || 0,
        })),
      } : undefined,
    },
    include: {
      consumer: { select: { name: true } },
      items: { include: { product: { select: { nameAr: true } } } },
    },
  })

  await prisma.notification.create({
    data: {
      userId: (await prisma.merchant.findUnique({ where: { id: merchantId }, select: { userId: true } }))?.userId || "",
      title: "طلب جديد",
      body: `لديك طلب جديد من ${session.name}`,
      type: "order",
    },
  }).catch(() => {})

  return NextResponse.json(order)
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "MERCHANT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  const body = await req.json()
  const parsed = updateOrderStatusSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
  const { orderId, status } = parsed.data
  const merchant = await prisma.merchant.findUnique({ where: { userId: session.userId } })
  const order = await prisma.order.findFirst({
    where: { id: orderId, merchantId: merchant?.id },
  })
  if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 })
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: { merchant: { select: { nameAr: true } } },
  })

  const statusLabels: Record<string, string> = { ACCEPTED: "مقبول", REJECTED: "مرفوض", COMPLETED: "مكتمل", CANCELLED: "ملغي" }
  await prisma.notification.create({
    data: {
      userId: order.consumerId,
      title: "تحديث حالة الطلب",
      body: `تم تحديث طلبك من ${updated.merchant.nameAr} إلى "${statusLabels[status] || status}"`,
      type: "order",
    },
  }).catch(() => {})

  return NextResponse.json(updated)
}
