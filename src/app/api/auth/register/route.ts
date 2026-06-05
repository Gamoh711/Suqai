import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { register, hashPassword, createSession } from "@/lib/auth"
import { registerSchema } from "@/lib/schemas"
import { slugify } from "@/lib/utils"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
    }
    const { name, email, password, phone, accountType, storeName, cityId, sectorId } = parsed.data

    if (accountType === "merchant") {
      if (!storeName || !phone || !cityId || !sectorId) {
        return NextResponse.json({ error: "اسم المتجر ورقم الجوال والمدينة والقطاع مطلوبون" }, { status: 400 })
      }
      const phoneExists = await prisma.user.findUnique({ where: { phone } })
      if (phoneExists) return NextResponse.json({ error: "رقم الجوال مسجل مسبقاً" }, { status: 400 })
      if (email) {
        const emailExists = await prisma.user.findUnique({ where: { email } })
        if (emailExists) return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 400 })
      }

      const [city, sector] = await Promise.all([
        prisma.city.findUnique({ where: { id: cityId } }),
        prisma.sector.findUnique({ where: { id: sectorId } }),
      ])
      if (!city) return NextResponse.json({ error: "المدينة غير موجودة" }, { status: 400 })
      if (!sector) return NextResponse.json({ error: "القطاع غير موجود" }, { status: 400 })

      const hashed = await hashPassword(password)
      const user = await prisma.user.create({
        data: {
          name: storeName,
          email: email || null,
          password: hashed,
          phone,
          cityId,
          role: "MERCHANT",
        },
      })

      const slug = slugify(storeName) + "-" + Date.now().toString(36)
      await prisma.merchant.create({
        data: {
          nameAr: storeName,
          slug,
          contactEmail: email || null,
          contactPhone: phone,
          cityId,
          sectorId,
          userId: user.id,
          status: "pending",
          isVerified: false,
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

      await createSession(user.id, user.role, user.name)
      logger.info("Merchant registered (pending)", { module: "api", context: { userId: user.id, storeName } })
      return NextResponse.json({ user: { userId: user.id, role: user.role, name: user.name, email: user.email } })
    }

    const result = await register({ name, email, password, phone })
    if (typeof result === "string") {
      return NextResponse.json({ error: result }, { status: 400 })
    }
    return NextResponse.json({ user: result })
  } catch (error) {
    logger.error("Register error", { module: "api", context: { error: String(error) } })
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
