import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { updateMerchantSchema } from "@/lib/schemas"

export async function PUT(req: Request) {
  const session = await getSession()
  if (!session || (session.role !== "MERCHANT" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const merchant = await prisma.merchant.findUnique({ where: { userId: session.userId } })
  if (!merchant) return NextResponse.json({ error: "ليس لديك متجر" }, { status: 400 })

  const body = await req.json()
  const parsed = updateMerchantSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 })
  const data = parsed.data

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      nameAr: data.nameAr,
      description: data.description,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      address: data.address,
      cityId: data.cityId,
      sectorId: data.sectorId,
      logo: data.logo,
      workingHours: data.workingHours,
    },
  })
  return NextResponse.json(updated)
}
