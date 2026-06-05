"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NotificationBell() {
  interface Notification { id: string; title: string; body: string | null; isRead: boolean; createdAt: string }
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/notifications").then(r => r.json()).then((data) => {
      setNotifications(data)
      setUnread(data.filter((n: { isRead: boolean }) => !n.isRead).length)
    })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
    setUnread(0)
    setNotifications((prev) => prev.map((n: Notification) => ({ ...n, isRead: true })))
    router.refresh()
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative px-2 py-1.5 text-gray-600 hover:text-emerald-600">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-800">الإشعارات</h3>
            <div className="flex gap-2 text-xs">
              {unread > 0 && <button onClick={markAllRead} className="text-emerald-600 hover:underline">تحديد الكل مقروء</button>}
              <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="text-gray-500 hover:underline">عرض الكل</Link>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">لا توجد إشعارات</div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div key={n.id} className={`p-3 border-b border-gray-50 text-sm ${!n.isRead ? "bg-emerald-50" : ""}`}>
                  <div className="font-medium text-gray-800">{n.title}</div>
                  {n.body && <div className="text-gray-500 text-xs mt-0.5">{n.body}</div>}
                  <div className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString("ar-SA")}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
