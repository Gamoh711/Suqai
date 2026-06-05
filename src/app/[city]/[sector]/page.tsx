import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import ImageWithFallback from "@/components/ImageWithFallback"
import MerchantCard from "@/components/MerchantCard"

export async function generateMetadata({ params }: { params: Promise<{ city: string; sector: string }> }): Promise<Metadata> {
  const { city: citySlug, sector: sectorSlug } = await params
  const city = await prisma.city.findUnique({ where: { slug: citySlug } })
  const sector = city ? await prisma.sector.findUnique({ where: { slug_cityId: { slug: sectorSlug, cityId: city.id } } }) : null
  if (!sector) return { title: "القطاع غير موجود" }
  return { title: `${sector.nameAr} - ${city?.nameAr}`, description: sector.description || `${sector.nameAr} في ${city?.nameAr}` }
}

interface Props {
  params: Promise<{ city: string; sector: string }>
  searchParams?: Promise<{ q?: string; minPrice?: string; maxPrice?: string; category?: string; type?: string }>
}

async function getSectorData(citySlug: string, sectorSlug: string, filters: { q?: string; minPrice?: string; maxPrice?: string; category?: string; type?: string }) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug, isActive: true } })
  if (!city) return null
  const sector = await prisma.sector.findUnique({
    where: { slug_cityId: { slug: sectorSlug, cityId: city.id } },
  })
  if (!sector || !sector.isActive) return null
  const subSectors = await prisma.sector.findMany({
    where: { parentId: sector.id, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { merchants: true } } },
  })

  const productWhere: {
    isActive: boolean
    OR?: { nameAr?: { contains: string; mode: "default" | "insensitive" }; description?: { contains: string; mode: "default" | "insensitive" }; tags?: { has: string } }[]
    price?: { gte?: number; lte?: number }
    category?: string
    isService?: boolean
  } = { isActive: true }
  if (filters.q) {
    productWhere.OR = [
      { nameAr: { contains: filters.q, mode: "insensitive" as const } },
      { description: { contains: filters.q, mode: "insensitive" as const } },
      { tags: { has: filters.q } },
    ]
  }
  if (filters.minPrice) productWhere.price = { ...productWhere.price, gte: parseFloat(filters.minPrice) }
  if (filters.maxPrice) productWhere.price = { ...productWhere.price, lte: parseFloat(filters.maxPrice) }
  if (filters.category) productWhere.category = filters.category
  if (filters.type === "service") productWhere.isService = true
  else if (filters.type === "product") productWhere.isService = false

  const merchantWhere: { sectorId: string; status: string; id?: { in: string[] } } = { sectorId: sector.id, status: "active" }
  if (filters.q || filters.minPrice || filters.maxPrice || filters.category || filters.type) {
    const matchingProductMerchantIds = await prisma.product.findMany({
      where: { ...productWhere, merchant: { sectorId: sector.id } },
      select: { merchantId: true },
    })
    merchantWhere.id = { in: [...new Set(matchingProductMerchantIds.map(p => p.merchantId))] }
  }

  const merchants = await prisma.merchant.findMany({
    where: merchantWhere,
    include: {
      _count: { select: { products: true, reviews: true } },
      reviews: { select: { rating: true } },
    },
  })

  const categories = await prisma.$queryRawUnsafe<{ category: string }[]>(
    `SELECT DISTINCT p.category FROM products p JOIN merchants m ON m.id = p.merchant_id WHERE m.sector_id = $1 AND p.category IS NOT NULL AND p.category != '' ORDER BY p.category`,
    sector.id
  )

  return { city, sector, subSectors, merchants, categories: categories.map(c => c.category) }
}

export default async function SectorPage({ params, searchParams }: Props) {
  const { city: citySlug, sector: sectorSlug } = await params
  const sp = await searchParams
  const filters = { q: sp?.q, minPrice: sp?.minPrice, maxPrice: sp?.maxPrice, category: sp?.category, type: sp?.type }
  const data = await getSectorData(citySlug, sectorSlug, filters)
  if (!data) notFound()

  return (
    <div className="container-custom py-8">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href={`/${citySlug}`} className="hover:text-emerald-600">{data.city.nameAr}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{data.sector.nameAr}</span>
      </nav>

      <section className="mb-8">
        {data.sector.image && (
          <div className="relative h-40 md:h-56 -mx-4 md:-mx-0 rounded-none md:rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-emerald-50 to-teal-50">
            <ImageWithFallback src={data.sector.image} alt={data.sector.nameAr} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{data.sector.nameAr}</h1>
        {data.sector.description && <p className="text-gray-500">{data.sector.description}</p>}
      </section>

      {data.subSectors.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-3">الأقسام الفرعية</h2>
          <div className="flex flex-wrap gap-2">
            {data.subSectors.map((sub) => (
              <Link
                key={sub.id}
                href={`/${citySlug}/${sub.slug}`}
                className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-gray-200 transition-all"
              >
                {sub.icon} {sub.nameAr}
                <span className="mr-1 text-xs text-gray-400">({sub._count.merchants})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <details className="bg-white rounded-xl border border-gray-100" open={!!(filters.q || filters.minPrice || filters.maxPrice || filters.category || filters.type)}>
          <summary className="px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer select-none">
            <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            فلترة البحث</summary>
          <form method="GET" className="p-4 pt-0 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <input name="q" defaultValue={filters.q} placeholder="ابحث في هذا القطاع..." className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input name="minPrice" defaultValue={filters.minPrice} type="number" placeholder="أقل سعر" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input name="maxPrice" defaultValue={filters.maxPrice} type="number" placeholder="أعلى سعر" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <select name="category" defaultValue={filters.category} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">كل التصنيفات</option>
                {data.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select name="type" defaultValue={filters.type} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">الكل</option>
                <option value="product">منتجات</option>
                <option value="service">خدمات</option>
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">بحث</button>
              <a href={`/${citySlug}/${sectorSlug}`} className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">إلغاء الفلتر</a>
            </div>
          </form>
        </details>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">التجار والمؤسسات</h2>
        {data.merchants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-gray-500">لا يوجد تجار في هذا القطاع حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.merchants.map((merchant) => {
              const avgRating =
                merchant.reviews.length > 0
                  ? (merchant.reviews.reduce((a, r) => a + r.rating, 0) / merchant.reviews.length).toFixed(1)
                  : null
              return (
                <MerchantCard
                  key={merchant.id}
                  id={merchant.id}
                  citySlug={citySlug}
                  sectorSlug={sectorSlug}
                  slug={merchant.slug}
                  nameAr={merchant.nameAr}
                  description={merchant.description}
                  logo={merchant.logo}
                  coverImage={merchant.coverImage}
                  productCount={merchant._count.products}
                  avgRating={avgRating}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
