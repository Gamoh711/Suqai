import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import MerchantSettingsForm from "./MerchantSettingsForm"

export default async function MerchantSettingsPage() {
  const session = await getSession()
  if (!session || (session.role !== "MERCHANT" && session.role !== "ADMIN")) redirect("/auth/login")

  const merchant = await prisma.merchant.findUnique({
    where: { userId: session.userId },
    include: { city: { select: { nameAr: true, id: true } }, sector: { select: { nameAr: true, id: true } } },
  })
  if (!merchant) redirect("/dashboard/merchant/create")

  const sectors = await prisma.sector.findMany({
    where: { cityId: merchant.cityId, isActive: true },
    select: { id: true, nameAr: true },
    orderBy: { nameAr: "asc" },
  })
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    select: { id: true, nameAr: true },
    orderBy: { nameAr: "asc" },
  })

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">إعدادات المتجر</h1>
      <div className="max-w-2xl bg-white rounded-xl border border-gray-100 p-6">
        <MerchantSettingsForm merchant={merchant} cities={cities} sectors={sectors} />
      </div>
    </div>
  )
}
