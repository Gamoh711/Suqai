import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, hashPassword } from "@/lib/auth"
import { adminCreateMerchantSchema } from "@/lib/schemas"
import { slugify } from "@/lib/utils"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = adminCreateMerchantSchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      if (issue.path.includes("password")) {
        return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 })
      }
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
    }
    const { name, email, password, phone, cityId, sectorId } = parsed.data

    const phoneExists = await prisma.user.findUnique({ where: { phone } })
    if (phoneExists) return NextResponse.json({ error: "رقم الجوال مسجل مسبقاً" }, { status: 400 })
    if (email) {
      const emailExists = await prisma.user.findUnique({ where: { email } })
      if (emailExists) return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 400 })
    }

    const hashed = await hashPassword(password)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone, cityId, role: "MERCHANT" },
    })

    const slug = slugify(name) + "-" + Date.now().toString(36)
    await prisma.merchant.create({
      data: {
        nameAr: name,
        slug,
        contactEmail: email,
        contactPhone: phone,
        cityId,
        sectorId,
        userId: user.id,
        status: "active",
        isVerified: true,
        workingHours: JSON.stringify([
          { day: "السبت", open: "09:00", close: "21:00" },
          { day: "الأحد", open: "09:00", close: "21:00" },
          { day: "الاثنين", open: "09:00", close: "21:00" },
          { day: "الثلاثاء", open: "09:00", close: "21:00" },
          { day: "الأربعاء", open: "09:00", close: "21:00" },
          { day: "الخميس", open: "09:00", close: "18:00" },
        ]),
      },
    })

    logger.info("Admin created merchant", { module: "api", context: { userId: user.id, merchantName: name, adminId: session.userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Admin create merchant error", { module: "api", context: { error: String(error) } })
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
