"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface FavoriteButtonProps {
  productId: string
  initialFavorited?: boolean
}

export default function FavoriteButton({ productId, initialFavorited = false }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      if (res.ok) {
        const data = await res.json()
        setFavorited(data.favorited)
        router.refresh()
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`p-2 rounded-full transition-all ${favorited ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
      title={favorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
    >
      <svg className="w-5 h-5" fill={favorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  )
}
