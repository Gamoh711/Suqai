import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStore } from "@/lib/redis"
import { logger } from "@/lib/logger"
import { forgotPasswordSchema } from "@/lib/schemas"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"

const TOKEN_TTL_SECONDS = 30 * 60

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 })
  const { email } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: "إذا كان البريد مسجلاً، ستتلقى رابط إعادة تعيين" })

  const raw = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex")

  const store = await getStore()
  await store.setex(`reset_token:${tokenHash}`, TOKEN_TTL_SECONDS, user.id)

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password?token=${raw}`

  logger.info("Password reset token created", { module: "auth", context: { userId: user.id, email, ttl: TOKEN_TTL_SECONDS } })

  await sendPasswordResetEmail(email, resetUrl)

  return NextResponse.json({
    success: true,
    message: "إذا كان البريد مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور",
    devUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
  })
}
