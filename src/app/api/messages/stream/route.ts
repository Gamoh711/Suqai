import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 403 })

  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get("orderId")

  const enc = new TextEncoder()
  let lastId = ""

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(enc.encode(`data: {"type":"connected"}\n\n`))

      const interval = setInterval(async () => {
        try {
          const where: { orderId?: string | { in: string[] } } = {}
          if (orderId) where.orderId = orderId
          else {
            const userOrders = await prisma.order.findMany({
              where: { OR: [{ consumerId: session.userId }, { merchant: { userId: session.userId } }] },
              select: { id: true },
            })
            where.orderId = { in: userOrders.map(o => o.id) }
          }

          const message = await prisma.message.findFirst({
            where: { ...where, id: { gt: lastId } },
            include: { sender: { select: { name: true, role: true } } },
            orderBy: { createdAt: "desc" },
          })

          if (message) {
            lastId = message.id
            controller.enqueue(enc.encode(`data: ${JSON.stringify(message)}\n\n`))
          }
        } catch {}
      }, 2000)

      req.signal.addEventListener("abort", () => clearInterval(interval))
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
