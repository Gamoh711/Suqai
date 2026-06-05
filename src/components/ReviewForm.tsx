"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/Toast"

interface ReviewFormProps {
  merchantId: string
}

export default function ReviewForm({ merchantId }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [hover, setHover] = useState(0)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError("يرجى اختيار تقييم"); return }
    setSaving(true)
    setError("")
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment, merchantId }),
    })
    const data = await res.json()
    if (res.ok) {
      toast("تم إرسال تقييمك بنجاح", "success")
      setRating(0)
      setComment("")
      router.refresh()
    } else {
      setError(data.error || "حدث خطأ")
      toast(data.error || "حدث خطأ", "error")
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="font-bold text-gray-800 mb-3">أضف تقييمك</h3>
      {error && <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-3">{error}</div>}
      <div className="flex items-center gap-1 mb-3" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className={`text-2xl transition-colors ${star <= (hover || rating) ? "text-amber-400" : "text-gray-200"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="اكتب تعليقك (اختياري)"
        rows={3}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
      />
      <button type="submit" disabled={saving}
        className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
        {saving ? "جاري الإرسال..." : "إرسال التقييم"}
      </button>
    </form>
  )
}
