import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { contactSchema } from "@/lib/schemas"

export async function POST(req: Request) {
  const session = await getSession()

  const body = await req.json()
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
  }
  const { name, email, subject, message } = parsed.data

  await prisma.ticket.create({
    data: {
      subject,
      description: `المرسل: ${name} (${email})\n\n${message}`,
      status: "open",
      priority: "medium",
      senderId: session?.userId || (await prisma.user.findFirst({ where: { role: "ADMIN" } }))?.id || "",
    },
  })

  return NextResponse.json({ success: true })
}
