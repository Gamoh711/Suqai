import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "MERCHANT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const { id } = await params
  const merchant = await prisma.merchant.findUnique({ where: { userId: session.userId } })
  if (!merchant) return NextResponse.json({ error: "ليس لديك متجر" }, { status: 400 })

  const product = await prisma.product.findFirst({
    where: { id, merchantId: merchant.id },
  })
  if (!product) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 })

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
