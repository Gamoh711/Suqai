import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStore } from "@/lib/redis"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, string> = {}
  let healthy = true

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = "ok"
  } catch (e) {
    checks.database = "error"
    healthy = false
    logger.error("Health check DB failed", { module: "health", context: { error: String(e) } })
  }

  try {
    const store = await getStore()
    await store.get("health:ping")
    checks.redis = "ok"
  } catch (e) {
    checks.redis = "error"
    healthy = false
    logger.error("Health check Redis failed", { module: "health", context: { error: String(e) } })
  }

  const status = healthy ? "ok" : "degraded"

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    },
    { status: healthy ? 200 : 503 },
  )
}
