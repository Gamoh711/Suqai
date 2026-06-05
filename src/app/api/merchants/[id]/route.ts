import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  const { id } = await params
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: { products: { select: { id: true } }, user: { select: { id: true } } },
    })
    if (!merchant) return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 })
    const productIds = merchant.products.map(p => p.id)
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: { in: productIds } } }),
      prisma.orderItem.deleteMany({ where: { productId: { in: productIds } } }),
      prisma.favorite.deleteMany({ where: { productId: { in: productIds } } }),
      prisma.order.deleteMany({ where: { merchantId: id } }),
      prisma.review.deleteMany({ where: { merchantId: id } }),
      prisma.coupon.deleteMany({ where: { merchantId: id } }),
      prisma.product.deleteMany({ where: { merchantId: id } }),
      prisma.notification.deleteMany({ where: { userId: merchant.userId! } }),
      prisma.merchant.delete({ where: { id } }),
    ])
    if (merchant.user) {
      await prisma.user.update({ where: { id: merchant.user.id }, data: { role: "CONSUMER" } })
    }
    logger.info("Merchant deleted", { module: "api", context: { merchantId: id, adminId: session.userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Merchant delete error", { module: "api", context: { error: String(error) } })
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
