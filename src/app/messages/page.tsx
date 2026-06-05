"use client"

import { useState, useEffect, useRef } from "react"

interface Message {
  id: string; content: string; senderId: string
  sender: { name: string; role: string }
  createdAt: string
}

interface Order {
  id: string; message?: string | null
  status: string; createdAt: string
  merchant: { nameAr: string }
  consumer: { name: string }
}

export default function MessagesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/auth/me").then(r => r.json()),
    ]).then(([ordersData, me]) => {
      setOrders(ordersData)
      setUserId(me.userId)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedOrder) return
    fetch(`/api/messages?orderId=${selectedOrder}`)
      .then(r => r.json())
      .then(setMessages)
      .catch(() => {})

    const es = new EventSource(`/api/messages/stream?orderId=${selectedOrder}`)
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.id) setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      } catch {}
    }
    return () => es.close()
  }, [selectedOrder])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedOrder) return
    setSaving(true)
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage, orderId: selectedOrder }),
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages(prev => [...prev, msg])
      setNewMessage("")
    }
    setSaving(false)
  }

  if (loading) return <div className="container-custom py-8 text-center text-gray-500">جاري التحميل...</div>

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">الرسائل</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">لا توجد رسائل</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-100 font-bold text-gray-800">الطلبات</div>
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-auto">
              {orders.map(o => (
                <button key={o.id} onClick={() => setSelectedOrder(o.id)}
                  className={`w-full text-right p-3 hover:bg-gray-50 transition-colors ${selectedOrder === o.id ? "bg-emerald-50" : ""}`}>
                  <p className="font-medium text-sm text-gray-800">{o.merchant?.nameAr || o.consumer?.name}</p>
                  <p className="text-xs text-gray-400">{o.message || "طلب"}</p>
                  <span className="text-[10px] text-gray-400">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 flex flex-col">
            {!selectedOrder ? (
              <div className="flex-1 flex items-center justify-center p-12 text-gray-400">اختر طلباً لعرض الرسائل</div>
            ) : (
              <>
                <div className="flex-1 overflow-auto p-4 space-y-3 max-h-[500px]">
                  {messages.length === 0 && <p className="text-center text-gray-400 text-sm py-8">لا توجد رسائل بعد. ابدأ المحادثة!</p>}
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.senderId === userId ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${m.senderId === userId ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                        <p className="text-xs opacity-70 mb-1">{m.sender.name}</p>
                        <p>{m.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={sendMessage} className="border-t border-gray-100 p-3 flex gap-2">
                  <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="اكتب رسالتك..." />
                  <button type="submit" disabled={saving || !newMessage.trim()}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                    إرسال
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
