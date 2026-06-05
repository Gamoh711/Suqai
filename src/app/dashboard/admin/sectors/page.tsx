import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import DeleteSectorButton from "./DeleteSectorButton"

export default async function AdminSectorsPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/")
  const sectors = await prisma.sector.findMany({
    include: { city: { select: { nameAr: true } }, parent: { select: { nameAr: true } }, _count: { select: { merchants: true, children: true } } },
    orderBy: [{ cityId: "asc" }, { sortOrder: "asc" }],
  })

  return (
    <div className="container-custom py-8">
      <Link href="/dashboard/admin" className="text-sm text-emerald-600 hover:underline mb-4 inline-block">
        ← العودة للوحة الإدارة
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">إدارة القطاعات</h1>
        <Link href="/dashboard/admin/sectors/create" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
          إضافة قطاع
        </Link>
      </div>
      <table className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="p-3 text-right text-sm font-medium text-gray-600">القطاع</th>
            <th className="p-3 text-right text-sm font-medium text-gray-600">الصورة</th>
            <th className="p-3 text-right text-sm font-medium text-gray-600">القطاع الأب</th>
            <th className="p-3 text-right text-sm font-medium text-gray-600">المدينة</th>
            <th className="p-3 text-right text-sm font-medium text-gray-600">التجار</th>
            <th className="p-3 text-right text-sm font-medium text-gray-600">الحالة</th>
            <th className="p-3 text-right text-sm font-medium text-gray-600"></th>
          </tr>
        </thead>
        <tbody>
          {sectors.map((s) => (
            <tr key={s.id} className="border-b border-gray-50">
              <td className="p-3">{s.icon} {s.nameAr}</td>
              <td className="p-3">
                {s.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                ) : (
                  <span className="text-gray-300 text-sm">—</span>
                )}
              </td>
              <td className="p-3 text-gray-500 text-sm">{s.parent ? s.parent.nameAr : <span className="text-gray-300">—</span>}</td>
              <td className="p-3 text-gray-500 text-sm">{s.city.nameAr}</td>
              <td className="p-3 text-sm">{s._count.merchants}{s._count.children > 0 ? ` / ${s._count.children} أقسام` : ""}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-full text-xs ${s.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                  {s.isActive ? "نشط" : "غير نشط"}
                </span>
              </td>
              <td className="p-3">
                <DeleteSectorButton sectorId={s.id} hasMerchants={s._count.merchants > 0} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
