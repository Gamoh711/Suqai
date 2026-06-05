"use client"

import { useState, useEffect } from "react"

export default function ConsumerReviewsPage() {
  const [reviews, setReviews] = useState<{ id: string; rating: number; comment: string | null; createdAt: string; merchant: { nameAr: string } }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/reviews?mine=true")
      .then(r => r.json())
      .then(setReviews)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">تقييماتي</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="text-5xl mb-3 text-amber-300">&#9733;</div>
          <p className="text-gray-500">لم تقم بتقييم أي تاجر بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">{r.merchant.nameAr}</span>
                <span className="text-sm text-gray-400">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</span>
              </div>
              <div className="flex items-center gap-1 mb-2" dir="ltr">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={i < r.rating ? "text-amber-400" : "text-gray-200"}>★</span>
                ))}
              </div>
              {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
