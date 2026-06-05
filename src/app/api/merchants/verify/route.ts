import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { verifyMerchantSchema } from "@/lib/schemas"
import { logger } from "@/lib/logger"

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = verifyMerchantSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
    const { merchantId, action } = parsed.data

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } })
    if (!merchant) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 })
    }

    if (action === "approve") {
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { status: "active", isVerified: true },
      })
      await prisma.notification.create({
        data: {
          userId: merchant.userId!,
          title: "تم الموافقة على متجرك",
          body: "تهانينا! تم الموافقة على طلب تسجيل متجرك. يمكنك الآن إضافة المنتجات وإدارة متجرك.",
          type: "merchant",
        },
      })
      logger.info("Merchant approved", { module: "api", context: { merchantId, adminId: session.userId } })
    } else {
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { status: "rejected" },
      })
      await prisma.notification.create({
        data: {
          userId: merchant.userId!,
          title: "لم تتم الموافقة على متجرك",
          body: "نأسف، لم يتم الموافقة على طلب تسجيل متجرك. يمكنك التواصل مع الدعم لمزيد من المعلومات.",
          type: "merchant",
        },
      })
      logger.info("Merchant rejected", { module: "api", context: { merchantId, adminId: session.userId } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Merchant verify error", { module: "api", context: { error: String(error) } })
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
