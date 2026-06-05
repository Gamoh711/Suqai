import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import CityCard from "@/components/CityCard"
import ProductCard from "@/components/ProductCard"
import Link from "next/link"

export const metadata: Metadata = {
  title: "سوقي - دليلك التجاري الأول في اليمن",
  description: "اكتشف آلاف المنتجات والخدمات والتجار في جميع المدن اليمنية على سوقي",
}

async function getHomepageData() {
  const [cities, topMerchants, latestProducts] = await Promise.all([
    prisma.city.findMany({ where: { isActive: true }, orderBy: { nameAr: "asc" } }),
    prisma.merchant.findMany({
      where: { status: "active", isVerified: true },
      include: { _count: { select: { products: true } }, city: { select: { slug: true } }, sector: { select: { slug: true } } },
      orderBy: { viewCount: "desc" },
      take: 6,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { merchant: { select: { nameAr: true, slug: true, city: { select: { slug: true } }, sector: { select: { slug: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ])
  return { cities, topMerchants, latestProducts }
}

export default async function HomePage() {
  const { cities, topMerchants, latestProducts } = await getHomepageData()

  return (
    <div>
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white py-12 md:py-20">
        <div className="container-custom text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 leading-tight">
            دليلك التجاري الأول في <span className="text-emerald-200">اليمن</span>
          </h1>
          <p className="text-base md:text-lg text-emerald-100 max-w-2xl mx-auto mb-6 leading-relaxed">
            اكتشف آلاف المنتجات والخدمات والتجار في جميع المدن اليمنية
          </p>
          <form action="/search" method="GET" className="max-w-xl mx-auto mb-6">
            <div className="flex gap-2">
              <input
                name="q"
                placeholder="ابحث عن منتج، تاجر، أو خدمة..."
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 text-sm"
              />
              <button type="submit" className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400 transition-colors shrink-0">
                بحث
              </button>
            </div>
          </form>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/search" className="px-6 py-2.5 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors text-sm border border-white/20">
              تصفح الفئات
            </Link>
            <Link href="/auth/register" className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400 transition-colors text-sm">
              سجل كتاجر مجاناً
            </Link>
          </div>
        </div>
      </section>

      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-4">
          <div className="flex justify-center gap-6 md:gap-12 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{cities.length}</div>
              <div className="text-xs text-gray-500">مدينة</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <div className="text-2xl font-bold text-emerald-600">متاجر</div>
              <div className="text-xs text-gray-500">موثقة ومعتمدة</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <div className="text-2xl font-bold text-emerald-600">آلاف</div>
              <div className="text-xs text-gray-500">منتج وخدمة</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 md:py-12">
        <section className="mb-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">اختر مدينتك</h2>
              <p className="text-sm text-gray-400 mt-1">ابحث عن التجار والمنتجات القريبة منك</p>
            </div>
          </div>
          {cities.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <p className="text-gray-500 text-lg">لا توجد مدن متاحة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cities.map((city) => (
                <CityCard key={city.id} nameAr={city.nameAr} slug={city.slug} image={city.image} />
              ))}
            </div>
          )}
        </section>

        {latestProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">أحدث المنتجات</h2>
                <p className="text-sm text-gray-400 mt-1">أحدث ما أضافه التجار</p>
              </div>
              <Link href="/search" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium shrink-0">
                عرض الكل
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {latestProducts.map((p) => (
                <Link key={p.id}
                  href={`/${p.merchant.city.slug}/${p.merchant.sector.slug}/${p.merchant.slug}/product/${p.id}`}
                >
                  <ProductCard
                    id={p.id}
                    nameAr={p.nameAr}
                    description={p.description}
                    price={p.price}
                    currency={p.currency}
                    images={p.images}
                    isService={p.isService}
                  />
                </Link>
              ))}
            </div>
          </section>
        )}

        {topMerchants.length > 0 && (
          <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">أبرز المتاجر الموثقة</h2>
                <p className="text-sm text-gray-400 mt-1">متاجر موثقة ذات تقييم عالي</p>
              </div>
              <Link href="/search" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium shrink-0">
                عرض الكل
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topMerchants.map((m) => (
                <Link key={m.id} href={`/${m.city.slug}/${m.sector.slug}/${m.slug}`}
                  className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-emerald-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="font-bold text-gray-800 text-sm truncate group-hover:text-emerald-600 transition-colors">{m.nameAr}</h3>
                        {m.isVerified && (
                          <span className="shrink-0 text-emerald-600 bg-emerald-50 rounded-full p-0.5" title="متجر موثق">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{m._count.products} منتج</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="text-center py-12 md:py-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">انضم إلى سوقي كتاجر</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">اعرض منتجاتك وخدماتك أمام آلاف العملاء في جميع أنحاء اليمن. مجاناً!</p>
          <Link href="/auth/register" className="inline-block px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm">
            أنشئ متجرك الآن
          </Link>
        </section>
      </div>
    </div>
  )
}
