import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

async function getStats() {
  const [cities, sectors, merchants, users, orders, tickets, products, reviews] = await Promise.all([
    prisma.city.count(),
    prisma.sector.count(),
    prisma.merchant.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.ticket.count({ where: { status: "open" } }),
    prisma.product.count(),
    prisma.review.count(),
  ])
  return { cities, sectors, merchants, users, orders, tickets, products, reviews }
}

export default async function AdminDashboard() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/")
  const stats = await getStats()

  const statCards = [
    { label: "المدن", value: stats.cities, color: "text-emerald-600" },
    { label: "القطاعات", value: stats.sectors, color: "text-blue-500" },
    { label: "التجار", value: stats.merchants, color: "text-amber-500" },
    { label: "المستخدمين", value: stats.users, color: "text-purple-500" },
    { label: "المنتجات", value: stats.products, color: "text-rose-500" },
    { label: "الطلبات", value: stats.orders, color: "text-sky-500" },
    { label: "التقييمات", value: stats.reviews, color: "text-yellow-500" },
    { label: "تذاكر مفتوحة", value: stats.tickets, color: "text-red-500" },
  ]

  const linkCards = [
    { href: "/dashboard/admin/cities", title: "إدارة المدن", desc: "إضافة وتعديل المدن" },
    { href: "/dashboard/admin/sectors", title: "إدارة القطاعات", desc: "إضافة وتعديل القطاعات" },
    { href: "/dashboard/admin/merchants", title: "إدارة التجار", desc: "توثيق وإدارة حسابات التجار" },
    { href: "/dashboard/admin/users", title: "إدارة المستخدمين", desc: "عرض وإدارة حسابات المستخدمين" },
    { href: "/dashboard/admin/tickets", title: "طلبات التواصل", desc: `${stats.tickets} طلب مفتوح` },
  ]

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">لوحة الإدارة</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {linkCards.map((c) => (
          <Link key={c.href} href={c.href} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-all hover:border-emerald-200">
            <h3 className="font-bold text-gray-800 text-sm">{c.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
