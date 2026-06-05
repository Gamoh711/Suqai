import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminCitiesPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/")
  const cities = await prisma.city.findMany({ orderBy: { nameAr: "asc" } })

  return (
    <div className="container-custom py-8">
      <Link href="/dashboard/admin" className="text-sm text-emerald-600 hover:underline mb-4 inline-block">
        ← العودة للوحة الإدارة
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">إدارة المدن</h1>
        <Link href="/dashboard/admin/cities/create" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
          إضافة مدينة
        </Link>
      </div>
      <table className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="p-3 text-right text-sm font-medium text-gray-600">الصورة</th>
            <th className="p-3 text-right text-sm font-medium text-gray-600">الاسم</th>
            <th className="p-3 text-right text-sm font-medium text-gray-600">Slug</th>
            <th className="p-3 text-right text-sm font-medium text-gray-600">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city) => (
            <tr key={city.id} className="border-b border-gray-50">
              <td className="p-3">
                {// eslint-disable-next-line @next/next/no-img-element
                city.image ? <img src={city.image} alt={city.nameAr} className="w-12 h-9 object-cover rounded" /> : <span className="text-gray-300 text-xs">—</span>}
              </td>
              <td className="p-3">{city.nameAr}</td>
              <td className="p-3 text-gray-500 text-sm">{city.slug}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-full text-xs ${city.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                  {city.isActive ? "نشط" : "غير نشط"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
