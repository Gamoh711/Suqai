import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { searchProducts } from "@/lib/search"
import Link from "next/link"
import ImageWithFallback from "@/components/ImageWithFallback"

export const metadata: Metadata = {
  title: "بحث",
  description: "ابحث عن المنتجات والخدمات والتجار في سوقي",
}

interface Props {
  searchParams: Promise<{ q?: string; city?: string; sector?: string; minPrice?: string; maxPrice?: string; category?: string; type?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams
  const hasFilters = sp.q || sp.city || sp.sector || sp.minPrice || sp.maxPrice || sp.category || sp.type

  const cities = await prisma.city.findMany({
    where: { isActive: true },
    select: { nameAr: true, slug: true },
    orderBy: { nameAr: "asc" },
  })

  const categories = await prisma.$queryRawUnsafe<{ category: string }[]>(
    `SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category`
  )

  let products: import("@/lib/search").SearchResult[] = []
  if (hasFilters) {
    products = await searchProducts({
      q: sp.q?.trim() || undefined,
      citySlug: sp.city || undefined,
      minPrice: sp.minPrice ? parseFloat(sp.minPrice) : undefined,
      maxPrice: sp.maxPrice ? parseFloat(sp.maxPrice) : undefined,
      category: sp.category || undefined,
      type: sp.type || undefined,
    })
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">بحث</h1>

      <form method="GET" className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input name="q" defaultValue={sp.q} placeholder="ابحث عن منتج أو تاجر..." className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <select name="city" defaultValue={sp.city} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">كل المدن</option>
            {cities.map(c => <option key={c.slug} value={c.slug}>{c.nameAr}</option>)}
          </select>
          <select name="category" defaultValue={sp.category} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">كل التصنيفات</option>
            {categories.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
          </select>
          <select name="type" defaultValue={sp.type} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">الكل</option>
            <option value="product">منتجات</option>
            <option value="service">خدمات</option>
          </select>
          <div className="flex gap-2 lg:col-span-2">
            <input name="minPrice" defaultValue={sp.minPrice} type="number" placeholder="أقل سعر" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input name="maxPrice" defaultValue={sp.maxPrice} type="number" placeholder="أعلى سعر" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 shrink-0">بحث</button>
          </div>
        </div>
      </form>

      {!hasFilters ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p className="text-gray-500">أدخل كلمة البحث للبدء</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-gray-500">لا توجد نتائج لبحثك</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/${p.citySlug}/${p.sectorSlug}/${p.merchantSlug}/product/${p.id}`}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all group">
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                {p.images?.length > 0 ? (
                  <ImageWithFallback src={p.images[0]} alt={p.nameAr} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl opacity-30">{p.isService ? "&#9881;" : "&#128230;"}</span>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-bold text-gray-800 text-sm group-hover:text-emerald-600">{p.nameAr}</h4>
                <p className="text-xs text-gray-400 mt-1">{p.merchantName}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-emerald-600 font-bold">{p.price.toLocaleString("ar-SA")} {p.currency}</span>
                  {p.avgRating > 0 && <span className="text-xs text-amber-500">⭐ {p.avgRating.toFixed(1)}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
