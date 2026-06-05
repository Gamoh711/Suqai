import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { checkoutSchema } from "@/lib/schemas"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "CONSUMER") return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const body = await req.json()
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
  const { shippingAddress, phone, couponCode } = parsed.data

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: { select: { id: true, price: true, merchantId: true, merchant: { select: { nameAr: true, userId: true } } } } },
  })

  if (cartItems.length === 0) return NextResponse.json({ error: "السلة فارغة" }, { status: 400 })

  const merchantIds = [...new Set(cartItems.map(i => i.product.merchantId))]
  if (merchantIds.length > 1) return NextResponse.json({ error: "يجب أن تكون المنتجات من تاجر واحد" }, { status: 400 })

  const merchantId = merchantIds[0]
  const subtotal = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  let discount = 0
  let couponId: string | undefined
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } })
    if (!coupon || !coupon.isActive) return NextResponse.json({ error: "كود الخصم غير صالح" }, { status: 400 })
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return NextResponse.json({ error: "تم استنفاذ عدد الاستخدامات" }, { status: 400 })
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return NextResponse.json({ error: "انتهت صلاحية الكود" }, { status: 400 })
    if (subtotal < coupon.minOrder) return NextResponse.json({ error: `الحد الأدنى للطلب ${coupon.minOrder} ريال` }, { status: 400 })
    discount = coupon.discountAmount > 0 ? coupon.discountAmount : (subtotal * coupon.discountPercent) / 100
    couponId = coupon.id

    await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } })
  }

  const totalAmount = Math.max(0, subtotal - discount)

  const order = await prisma.order.create({
    data: {
      consumerId: session.userId,
      merchantId,
      shippingAddress: shippingAddress || undefined,
      phone: phone || undefined,
      totalAmount,
      couponId: couponId || undefined,
      items: {
        create: cartItems.map(i => ({
          productId: i.product.id,
          unitPrice: i.product.price,
          quantity: i.quantity,
        })),
      },
    },
  })

  await prisma.cartItem.deleteMany({ where: { userId: session.userId } })

  await prisma.notification.create({
    data: {
      userId: cartItems[0].product.merchant.userId || "",
      title: "طلب جديد",
      body: `طلب جديد بقيمة ${totalAmount.toLocaleString("ar-SA")} SAR`,
      type: "order",
    },
  }).catch(() => {})

  return NextResponse.json({ orderId: order.id })
}
