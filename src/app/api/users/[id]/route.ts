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
  if (id === session.userId) {
    return NextResponse.json({ error: "لا يمكنك حذف حسابك" }, { status: 400 })
  }
  try {
    const user = await prisma.user.findUnique({ where: { id }, include: { merchant: { select: { id: true } } } })
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "لا يمكن حذف مدير النظام" }, { status: 400 })
    }
    if (user.merchant) {
      const productIds = (await prisma.product.findMany({ where: { merchantId: user.merchant.id }, select: { id: true } })).map(p => p.id)
      await prisma.$transaction([
        prisma.cartItem.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.orderItem.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.favorite.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.order.deleteMany({ where: { merchantId: user.merchant.id } }),
        prisma.review.deleteMany({ where: { merchantId: user.merchant.id } }),
        prisma.coupon.deleteMany({ where: { merchantId: user.merchant.id } }),
        prisma.product.deleteMany({ where: { merchantId: user.merchant.id } }),
        prisma.merchant.delete({ where: { id: user.merchant.id } }),
      ])
    }
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { userId: id } }),
      prisma.favorite.deleteMany({ where: { userId: id } }),
      prisma.message.deleteMany({ where: { senderId: id } }),
      prisma.ticket.deleteMany({ where: { senderId: id } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ])
    logger.info("User deleted", { module: "api", context: { userId: id, adminId: session.userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("User delete error", { module: "api", context: { error: String(error) } })
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
