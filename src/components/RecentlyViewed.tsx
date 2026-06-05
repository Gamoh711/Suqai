"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import ImageWithFallback from "./ImageWithFallback"

export default function RecentlyViewed() {
  interface RecentItem { id: string; name: string; image: string; isService: boolean; url: string }
  const [items, setItems] = useState<RecentItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("suqai_recent")
      if (raw) setTimeout(() => setItems(JSON.parse(raw).slice(0, 6)), 0)
    } catch {}
  }, [])

  if (items.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 mb-3">شوهد مؤخراً</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item) => (
          <Link key={item.id} href={item.url}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all group"
          >
            <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              {item.image ? (
                <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl opacity-30">{item.isService ? "&#9881;" : "&#128230;"}</span>
              )}
            </div>
            <div className="p-2">
              <h4 className="font-bold text-gray-800 text-xs truncate group-hover:text-emerald-600">{item.name}</h4>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
