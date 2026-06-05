"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string | null; isRead: boolean; createdAt: string }[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/notifications").then(r => r.json()).then((data) => {
      setNotifications(data)
      setLoading(false)
    })
  }, [])

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    router.refresh()
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">الإشعارات</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <p className="text-gray-500">لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${!n.isRead ? "border-emerald-200 bg-emerald-50/50" : "border-gray-100"}`}
              onClick={() => !n.isRead && markRead(n.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`text-sm ${!n.isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>{n.title}</h3>
                  {n.body && <p className="text-xs text-gray-500 mt-1">{n.body}</p>}
                </div>
                {!n.isRead && <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 mt-1.5" />}
              </div>
              <div className="text-[10px] text-gray-400 mt-2">{new Date(n.createdAt).toLocaleDateString("ar-SA")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
