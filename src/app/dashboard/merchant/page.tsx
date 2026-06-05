import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function MerchantDashboard() {
  const session = await getSession()
  if (!session) redirect("/auth/login")
  if (session.role === "ADMIN") redirect("/dashboard/admin")
  if (session.role !== "MERCHANT") redirect("/")

  const merchant = await prisma.merchant.findUnique({
    where: { userId: session.userId },
    include: {
      _count: { select: { products: true, orders: true, reviews: true } },
      reviews: { select: { rating: true } },
      products: {
        where: { isActive: true },
        include: { _count: { select: { favorites: true, orderItems: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  if (!merchant) {
    return (
      <div className="container-custom py-12">
        <div className="max-w-lg mx-auto text-center bg-white rounded-2xl border border-gray-100 p-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ليس لديك متجر بعد</h1>
          <p className="text-gray-500 mb-6">قم بإنشاء متجرك الآن لبدء عرض منتجاتك وخدماتك</p>
        </div>
      </div>
    )
  }

  if (merchant.status === "pending") {
    return (
      <div className="container-custom py-12">
        <div className="max-w-lg mx-auto text-center bg-white rounded-2xl border border-gray-100 p-8">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">بانتظار الموافقة</h1>
          <p className="text-gray-500 mb-2">تم إرسال طلب تسجيل متجرك إلى الإدارة. سنعلمك عند اكتمال المراجعة.</p>
          <p className="text-xs text-gray-400 mb-6">يمكنك تصفح المنصة كعميل أثناء انتظار الموافقة.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    )
  }

  if (merchant.status === "rejected") {
    return (
      <div className="container-custom py-12">
        <div className="max-w-lg mx-auto text-center bg-white rounded-2xl border border-gray-100 p-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">لم يتم الموافقة</h1>
          <p className="text-gray-500 mb-6">نأسف، لم يتم الموافقة على طلب تسجيل متجرك. يرجى التواصل مع الدعم لمزيد من المعلومات.</p>
          <Link href="/contact" className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            تواصل مع الدعم
          </Link>
        </div>
      </div>
    )
  }

  const avgRating = merchant && merchant.reviews.length > 0
    ? (merchant.reviews.reduce((a, r) => a + r.rating, 0) / merchant.reviews.length).toFixed(1)
    : null

  const orders = merchant ? await prisma.order.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { consumer: { select: { name: true } }, items: { select: { unitPrice: true, quantity: true } } },
  }) : []

  const recentOrders = orders.slice(0, 5)
  const totalRevenue = orders.reduce((sum, o) => sum + (o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)), 0)
  const pendingOrders = orders.filter(o => o.status === "PENDING").length
  const completedOrders = orders.filter(o => o.status === "COMPLETED").length

  const topProducts = merchant ? [...merchant.products].sort((a, b) => (b._count.favorites + b._count.orderItems) - (a._count.favorites + a._count.orderItems)).slice(0, 5) : []

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{merchant?.nameAr || "لوحة التحكم"}</h1>
      {merchant?.isVerified && <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">موثق</span>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{merchant?._count.products || 0}</div>
          <div className="text-xs text-gray-500 mt-0.5">المنتجات</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-amber-500">{pendingOrders}</div>
          <div className="text-xs text-gray-500 mt-0.5">قيد الانتظار</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{completedOrders}</div>
          <div className="text-xs text-gray-500 mt-0.5">مكتملة</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString("ar-SA")}</div>
          <div className="text-xs text-gray-500 mt-0.5">إجمالي الإيرادات (SAR)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{avgRating || "-"}</div>
          <div className="text-xs text-gray-500 mt-0.5">التقييم العام</div>
        </div>
      </div>

      {topProducts.length > 0 && (
        <section className="mb-8 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 text-sm">أشهر المنتجات</h2>
          <div className="space-y-3">
            {topProducts.map((p) => {
              const popularity = p._count.favorites + p._count.orderItems
              const maxPop = Math.max(...topProducts.map(x => x._count.favorites + x._count.orderItems), 1)
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{p.nameAr}</span>
                    <span className="text-gray-400 text-xs">{popularity} تفاعل</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${(popularity / maxPop) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {recentOrders.length > 0 && (
        <section className="mb-8 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 text-sm">آخر الطلبات</h2>
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{o.consumer.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    o.status === "PENDING" ? "bg-amber-50 text-amber-600" :
                    o.status === "ACCEPTED" ? "bg-green-50 text-green-600" :
                    o.status === "COMPLETED" ? "bg-blue-50 text-blue-600" :
                    "bg-gray-50 text-gray-600"
                  }`}>{o.status === "PENDING" ? "جديد" : o.status === "ACCEPTED" ? "مقبول" : o.status === "REJECTED" ? "مرفوض" : o.status === "COMPLETED" ? "مكتمل" : "ملغي"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/dashboard/merchant/products" className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm">
          <h3 className="font-bold text-gray-800 text-sm">إدارة المنتجات</h3>
          <p className="text-xs text-gray-500 mt-1">إضافة وتعديل المنتجات</p>
        </Link>
        <Link href="/dashboard/merchant/orders" className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm">
          <h3 className="font-bold text-gray-800 text-sm">الطلبات</h3>
          <p className="text-xs text-gray-500 mt-1">متابعة طلبات العملاء</p>
        </Link>
        <Link href="/dashboard/merchant/reviews" className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm">
          <h3 className="font-bold text-gray-800 text-sm">التقييمات</h3>
          <p className="text-xs text-gray-500 mt-1">عرض التقييمات والمراجعات</p>
        </Link>
        <Link href="/dashboard/merchant/settings" className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm">
          <h3 className="font-bold text-gray-800 text-sm">الإعدادات</h3>
          <p className="text-xs text-gray-500 mt-1">تعديل بيانات المتجر</p>
        </Link>
      </div>
    </div>
  )
}
