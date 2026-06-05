import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { updateCitySchema } from "@/lib/schemas"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const parsed = updateCitySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
  const city = await prisma.city.update({ where: { id }, data: parsed.data })
  return NextResponse.json(city)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }
  const { id } = await params
  await prisma.city.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
