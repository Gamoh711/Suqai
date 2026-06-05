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
    const count = await prisma.merchant.count({ where: { sectorId: id } })
    if (count > 0) {
      return NextResponse.json({ error: "لا يمكن حذف قطاع لديه تجار" }, { status: 400 })
    }
    await prisma.sector.updateMany({ where: { parentId: id }, data: { parentId: null } })
    await prisma.sector.delete({ where: { id } })
    logger.info("Sector deleted", { module: "api", context: { sectorId: id, adminId: session.userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Sector delete error", { module: "api", context: { error: String(error) } })
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
