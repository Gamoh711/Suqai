import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminTicketsPage() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/")
  const tickets = await prisma.ticket.findMany({
    include: { sender: { select: { name: true, email: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })
  return (
    <div className="container-custom py-8">
      <Link href="/dashboard/admin" className="text-sm text-emerald-600 hover:underline mb-4 inline-block">← العودة للوحة الإدارة</Link>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">طلبات التواصل</h1>
      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="text-5xl mb-3 text-gray-400">&#9993;</div>
          <p className="text-gray-500">لا توجد طلبات تواصل</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{t.subject}</h3>
                  <p className="text-xs text-gray-400">{t.sender.name} ({t.sender.email})</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                  t.status === "open" ? "bg-green-50 text-green-600" :
                  t.status === "in_progress" ? "bg-amber-50 text-amber-600" :
                  "bg-gray-50 text-gray-600"
                }`}>{t.status === "open" ? "مفتوح" : t.status === "in_progress" ? "قيد المعالجة" : "مغلق"}</span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line">{t.description}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                <span className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleDateString("ar-SA")}</span>
                <span className="text-[10px] text-gray-400">أولوية: {t.priority === "high" ? "عالية" : t.priority === "low" ? "منخفضة" : "متوسطة"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
