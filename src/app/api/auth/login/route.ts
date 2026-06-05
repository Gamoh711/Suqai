import { NextResponse } from "next/server"
import { login } from "@/lib/auth"
import { loginSchema } from "@/lib/schemas"
import { logger } from "@/lib/logger"
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/rate-limit"

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" }, { status: 400 })
    }
    const { email, password } = parsed.data
    const ip = getClientIp(req)
    if (!(await checkLoginRateLimit(email, ip))) {
      return NextResponse.json({ error: "محاولات دخول كثيرة. حاول بعد 15 دقيقة." }, { status: 429 })
    }
    const result = await login(email, password)
    if (typeof result === "string") {
      logger.warn("Login failed", { module: "auth", context: { email, ip, reason: result } })
      return NextResponse.json({ error: result }, { status: 401 })
    }
    await resetLoginRateLimit(email, ip)
    logger.info("Login success", { module: "auth", context: { email, userId: result.userId, role: result.role } })
    return NextResponse.json({ user: result })
  } catch (error) {
    logger.error("Login error", { module: "api", context: { error: String(error) } })
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
