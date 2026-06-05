import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { sendMessageSchema } from "@/lib/schemas"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const body = await req.json()
  const parsed = sendMessageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "محتوى الرسالة مطلوب" }, { status: 400 })
  const { content, orderId } = parsed.data

  const message = await prisma.message.create({
    data: { content, senderId: session.userId, orderId: orderId || undefined },
    include: { sender: { select: { name: true, role: true } } },
  })

  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { consumerId: true, merchant: { select: { userId: true } } } })
    const recipientId = order?.consumerId === session.userId ? order?.merchant.userId : order?.consumerId
    if (recipientId) {
      await prisma.notification.create({
        data: { userId: recipientId, title: "رسالة جديدة", body: content.slice(0, 50), type: "message" },
      }).catch(() => {})
    }
  }

  return NextResponse.json(message)
}

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get("orderId")

  const userOrders = !orderId ? await prisma.order.findMany({
    where: { OR: [{ consumerId: session.userId }, { merchant: { userId: session.userId } }] },
    select: { id: true },
  }) : []

  const messages = await prisma.message.findMany({
    where: {
      ...(orderId ? { orderId } : { orderId: { in: userOrders.map(o => o.id) } }),
    },
    include: { sender: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(messages.reverse())
}
