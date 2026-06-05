"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<{ id: string; nameAr: string; status: string; city?: { nameAr: string }; sector?: { nameAr: string }; _count?: { products: number } }[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchMerchants()
  }, [])

  async function fetchMerchants() {
    const res = await fetch("/api/merchants?all=true")
    if (res.ok) setMerchants(await res.json())
    setLoading(false)
  }

  async function handleAction(merchantId: string, action: "approve" | "reject") {
    const res = await fetch("/api/merchants/verify", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId, action }),
    })
    if (res.ok) fetchMerchants()
  }

  async function handleDelete(merchantId: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المتجر؟")) return
    setDeleting(merchantId)
    const res = await fetch(`/api/merchants/${merchantId}`, { method: "DELETE" })
    if (res.ok) fetchMerchants()
    setDeleting(null)
  }

  if (loading) return (
    <div className="container-custom py-8">
      <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
    </div>
  )

  return (
    <div className="container-custom py-8">
      <Link href="/dashboard/admin" className="text-sm text-emerald-600 hover:underline mb-4 inline-block">
        ← العودة للوحة الإدارة
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">إدارة التجار</h1>
        <Link href="/dashboard/admin/merchants/create" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
          إضافة تاجر
        </Link>
      </div>

      {merchants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-500">
          لا يوجد تجار
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-3 text-sm font-medium text-gray-600">التاجر</th>
                <th className="p-3 text-sm font-medium text-gray-600">المدينة</th>
                <th className="p-3 text-sm font-medium text-gray-600">القطاع</th>
                <th className="p-3 text-sm font-medium text-gray-600">المنتجات</th>
                <th className="p-3 text-sm font-medium text-gray-600">الحالة</th>
                <th className="p-3 text-sm font-medium text-gray-600">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3 font-medium">{m.nameAr}</td>
                  <td className="p-3 text-sm text-gray-500">{m.city?.nameAr}</td>
                  <td className="p-3 text-sm text-gray-500">{m.sector?.nameAr}</td>
                  <td className="p-3 text-sm">{m._count?.products || 0}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      m.status === "active" ? "bg-green-50 text-green-600" :
                      m.status === "pending" ? "bg-amber-50 text-amber-600" :
                      m.status === "rejected" ? "bg-red-50 text-red-600" :
                      "bg-gray-50 text-gray-600"
                    }`}>
                      {m.status === "active" ? "نشط" :
                       m.status === "pending" ? "قيد الانتظار" :
                       m.status === "rejected" ? "مرفوض" : "موقوف"}
                    </span>
                  </td>
                  <td className="p-3">
                    {m.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(m.id, "approve")}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700">
                          موافقة
                        </button>
                        <button onClick={() => handleAction(m.id, "reject")}
                          className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                          رفض
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {m.status === "active" ? "✓ مفعل" :
                         m.status === "rejected" ? "✕ مرفوض" : "—"}
                      </span>
                    )}
                    <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                      className="mr-2 px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs hover:bg-red-100 hover:text-red-600 disabled:opacity-50">
                      {deleting === m.id ? "..." : "حذف"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
