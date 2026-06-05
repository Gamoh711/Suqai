"use client"

import { useState, useEffect } from "react"

export default function ConsumerOrdersPage() {
  interface OrderWithMerchant { id: string; status: string; message: string | null; createdAt: string; merchant: { nameAr: string }; items: { product: { nameAr: string } }[] }
  const [orders, setOrders] = useState<OrderWithMerchant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/orders")
      .then(r => r.json())
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: "قيد الانتظار", color: "bg-amber-50 text-amber-600" },
    ACCEPTED: { label: "تم القبول", color: "bg-green-50 text-green-600" },
    REJECTED: { label: "مرفوض", color: "bg-red-50 text-red-600" },
    COMPLETED: { label: "مكتمل", color: "bg-blue-50 text-blue-600" },
    CANCELLED: { label: "ملغي", color: "bg-gray-50 text-gray-600" },
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">طلباتي</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          </div>
          <p className="text-gray-500">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = statusLabels[order.status] || { label: order.status, color: "bg-gray-50 text-gray-600" }
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{order.merchant.nameAr}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                </div>
                {order.message && <p className="text-sm text-gray-600 mb-2">{order.message}</p>}
                {order.items?.length > 0 && (
                  <div className="text-sm text-gray-500 mb-2">
                    المنتجات: {order.items.map((i) => i.product.nameAr).join("، ")}
                  </div>
                )}
                <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("ar-SA")}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
