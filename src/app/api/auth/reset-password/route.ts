import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStore } from "@/lib/redis"
import { logger } from "@/lib/logger"
import { resetPasswordSchema } from "@/lib/schemas"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const SALT_ROUNDS = 12

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    if (issue.path.includes("password")) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 })
    }
    return NextResponse.json({ error: "الرمز وكلمة المرور مطلوبان" }, { status: 400 })
  }
  const { token, password } = parsed.data

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
    const store = await getStore()

    const userId = await store.get(`reset_token:${tokenHash}`)
    if (!userId) {
      logger.warn("Password reset token expired or invalid", { module: "auth", context: { tokenHash: tokenHash.slice(0, 8) } })
      return NextResponse.json({ error: "الرابط غير صالح أو منتهي الصلاحية" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS)
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

    await store.del(`reset_token:${tokenHash}`)

    logger.info("Password reset completed", { module: "auth", context: { userId } })
    return NextResponse.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" })
  } catch (error) {
    logger.error("Password reset error", { module: "auth", context: { error: String(error) } })
    return NextResponse.json({ error: "الرابط غير صالح" }, { status: 400 })
  }
}
