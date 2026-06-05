"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<{ id: string; product: { nameAr: string; price: number; currency: string; merchant: { nameAr: string } } }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/favorites")
      .then(r => r.json())
      .then(data => setFavorites(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">المفضلة</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <p className="text-gray-500 mb-4">لا توجد منتجات في المفضلة</p>
          <Link href="/" className="text-emerald-600 hover:underline">تصفح المنتجات</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map((fav) => (
            <div key={fav.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <span className="text-5xl opacity-30">&#128230;</span>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm">{fav.product.nameAr}</h3>
                <p className="text-xs text-gray-500 mt-1">{fav.product.merchant.nameAr}</p>
                <div className="text-emerald-600 font-bold mt-1">
                  {fav.product.price.toLocaleString("ar-SA")} {fav.product.currency}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
