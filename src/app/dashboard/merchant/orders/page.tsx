"use client"

import { useState, useEffect } from "react"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار", ACCEPTED: "مقبول", REJECTED: "مرفوض", COMPLETED: "مكتمل", CANCELLED: "ملغي",
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600", ACCEPTED: "bg-green-50 text-green-600",
  REJECTED: "bg-red-50 text-red-600", COMPLETED: "bg-blue-50 text-blue-600", CANCELLED: "bg-gray-50 text-gray-600",
}

export default function MerchantOrdersPage() {
  interface OrderItem { product: { nameAr: string } }
  interface OrderWithConsumer { id: string; status: string; message: string | null; createdAt: string; consumer: { name: string; phone: string | null; email: string }; items: OrderItem[] }
  const [orders, setOrders] = useState<OrderWithConsumer[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchOrders() {
    setLoading(true)
    const res = await fetch("/api/orders")
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => { setTimeout(() => fetchOrders()) }, [])

  async function updateStatus(orderId: string, status: string) {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    })
    fetchOrders()
  }

  if (loading) return <div className="container-custom py-8 text-center text-gray-500">جاري التحميل...</div>

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">الطلبات</h1>
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          </div>
          <p className="text-gray-500">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-800">{order.consumer.name}</span>
                  {order.consumer.phone && <span className="mr-3 text-sm text-gray-400">هاتف: {order.consumer.phone}</span>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-50 text-gray-600"}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              {order.message && <p className="text-sm text-gray-600 mb-2">{order.message}</p>}
              {order.items?.length > 0 && (
                <div className="text-sm text-gray-500 mb-2">
                  المنتجات: {order.items.map((i) => i.product.nameAr).join("، ")}
                </div>
              )}
              <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("ar-SA")}</div>
              {order.status === "PENDING" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateStatus(order.id, "ACCEPTED")}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">قبول</button>
                  <button onClick={() => updateStatus(order.id, "REJECTED")}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">رفض</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
