"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/Toast"

interface RequestQuoteButtonProps {
  merchantId: string
  merchantName: string
  productIds?: string[]
}

export default function RequestQuoteButton({ merchantId, merchantName, productIds }: RequestQuoteButtonProps) {
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId, message, phone, productIds }),
    })
    const data = await res.json()
    if (res.ok) {
      toast("تم إرسال طلبك بنجاح", "success")
      router.push(`/order/confirmation/${data.id}`)
    } else {
      setError(data.error || "حدث خطأ. يرجى تسجيل الدخول أولاً.")
      toast(data.error || "حدث خطأ", "error")
    }
    setSaving(false)
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
      >
        {showForm ? "إلغاء" : "طلب عرض سعر"}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-3">{error}</div>}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`اكتب رسالتك إلى ${merchantName}...`}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="رقم جوالك للتواصل"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {saving ? "..." : "إرسال"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
