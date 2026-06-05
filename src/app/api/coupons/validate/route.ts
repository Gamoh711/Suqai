import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateCouponSchema } from "@/lib/schemas"

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = validateCouponSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "كود الخصم مطلوب" }, { status: 400 })
  const { code, merchantId, orderTotal } = parsed.data

  const coupon = await prisma.coupon.findUnique({ where: { code } })
  if (!coupon) return NextResponse.json({ error: "كود الخصم غير صالح" }, { status: 404 })
  if (!coupon.isActive) return NextResponse.json({ error: "كود الخصم غير نشط" }, { status: 400 })
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return NextResponse.json({ error: "تم استنفاذ عدد استخدامات الكود" }, { status: 400 })
  if (coupon.expiresAt && new Date() > coupon.expiresAt) return NextResponse.json({ error: "انتهت صلاحية الكود" }, { status: 400 })
  if (merchantId && coupon.merchantId && coupon.merchantId !== merchantId) return NextResponse.json({ error: "الكود غير صالح لهذا التاجر" }, { status: 400 })
  if (orderTotal < coupon.minOrder) return NextResponse.json({ error: `الطلب يجب أن يكون ${coupon.minOrder} ريال على الأقل` }, { status: 400 })

  const discount = coupon.discountAmount > 0
    ? coupon.discountAmount
    : (orderTotal * coupon.discountPercent) / 100

  return NextResponse.json({ discount, coupon: { code: coupon.code, discountPercent: coupon.discountPercent, discountAmount: coupon.discountAmount } })
}
