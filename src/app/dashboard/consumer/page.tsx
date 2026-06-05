import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import RecentlyViewed from "@/components/RecentlyViewed"

export default async function ConsumerDashboard() {
  const session = await getSession()
  if (!session || session.role !== "CONSUMER") redirect("/auth/login")

  const [orders, reviews, favorites] = await Promise.all([
    prisma.order.findMany({ where: { consumerId: session.userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.review.count({ where: { consumerId: session.userId } }),
    prisma.favorite.count({ where: { userId: session.userId } }),
  ])

  const pendingOrders = orders.filter((o) => o.status === "PENDING").length

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">لوحة المستهلك</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
          <div className="text-3xl font-bold text-emerald-600">{orders.length}</div>
          <div className="text-sm text-gray-500 mt-1">إجمالي الطلبات</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
          <div className="text-3xl font-bold text-amber-500">{pendingOrders}</div>
          <div className="text-sm text-gray-500 mt-1">قيد الانتظار</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
          <div className="text-3xl font-bold text-blue-500">{reviews}</div>
          <div className="text-sm text-gray-500 mt-1">تقييماتك</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
          <div className="text-3xl font-bold text-red-400">{favorites}</div>
          <div className="text-sm text-gray-500 mt-1">المفضلة</div>
        </div>
      </div>

      <RecentlyViewed />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/orders" className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          </div>
          <h3 className="font-bold text-gray-800">طلباتي</h3>
          <p className="text-sm text-gray-500 mt-1">متابعة حالة طلباتك</p>
        </Link>
        <Link href="/dashboard/favorites" className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <h3 className="font-bold text-gray-800">المفضلة</h3>
          <p className="text-sm text-gray-500 mt-1">المنتجات التي حفظتها</p>
        </Link>
        <Link href="/dashboard/reviews" className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
          <div className="text-3xl mb-2">⭐</div>
          <h3 className="font-bold text-gray-800">تقييماتي</h3>
          <p className="text-sm text-gray-500 mt-1">تقييماتك للتجار</p>
        </Link>
      </div>

      {orders.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3">آخر الطلبات</h2>
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">{o.message || "طلب"}</span>
                  <span className="text-xs text-gray-400 mr-3">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  o.status === "PENDING" ? "bg-amber-50 text-amber-600" :
                  o.status === "ACCEPTED" ? "bg-green-50 text-green-600" :
                  o.status === "COMPLETED" ? "bg-blue-50 text-blue-600" :
                  "bg-gray-50 text-gray-600"
                }`}>
                  {o.status === "PENDING" ? "قيد الانتظار" :
                   o.status === "ACCEPTED" ? "تم القبول" :
                   o.status === "REJECTED" ? "مرفوض" :
                   o.status === "COMPLETED" ? "مكتمل" : "ملغي"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
