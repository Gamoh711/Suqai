import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { markNotificationSchema } from "@/lib/schemas"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return NextResponse.json(notifications)
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const body = await req.json()
  const parsed = markNotificationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
  const { id } = parsed.data
  if (id) {
    const notif = await prisma.notification.findUnique({ where: { id }, select: { userId: true } })
    if (!notif || notif.userId !== session.userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }
    await prisma.notification.update({ where: { id }, data: { isRead: true } })
  } else {
    await prisma.notification.updateMany({ where: { userId: session.userId }, data: { isRead: true } })
  }
  return NextResponse.json({ success: true })
}
