import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import DeleteUserButton from "./DeleteUserButton"

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/")

  const users = await prisma.user.findMany({
    include: { _count: { select: { orders: true, reviews: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div className="container-custom py-8">
      <Link href="/dashboard/admin" className="text-sm text-emerald-600 hover:underline mb-4 inline-block">
        ← العودة للوحة الإدارة
      </Link>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">إدارة المستخدمين</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-3 text-sm font-medium text-gray-600">الاسم</th>
              <th className="p-3 text-sm font-medium text-gray-600">البريد</th>
              <th className="p-3 text-sm font-medium text-gray-600">الدور</th>
              <th className="p-3 text-sm font-medium text-gray-600">الطلبات</th>
              <th className="p-3 text-sm font-medium text-gray-600">التقييمات</th>
              <th className="p-3 text-sm font-medium text-gray-600">الحالة</th>
              <th className="p-3 text-sm font-medium text-gray-600">التسجيل</th>
              <th className="p-3 text-sm font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-sm text-gray-500">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.role === "ADMIN" ? "bg-purple-50 text-purple-600" :
                    u.role === "MERCHANT" ? "bg-blue-50 text-blue-600" :
                    "bg-gray-50 text-gray-600"
                  }`}>{u.role === "ADMIN" ? "مدير" : u.role === "MERCHANT" ? "تاجر" : "مستهلك"}</span>
                </td>
                <td className="p-3 text-sm text-gray-500">{u._count.orders}</td>
                <td className="p-3 text-sm text-gray-500">{u._count.reviews}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${u.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                    {u.isActive ? "نشط" : "موقوف"}
                  </span>
                </td>
                <td className="p-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString("ar-SA")}</td>
                <td className="p-3">{u.role !== "ADMIN" ? <DeleteUserButton userId={u.id} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
