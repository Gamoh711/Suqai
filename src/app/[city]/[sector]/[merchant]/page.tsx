import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import ProductCard from "@/components/ProductCard"
import ReviewForm from "@/components/ReviewForm"
import RequestQuoteButton from "@/components/RequestQuoteButton"
import ImageWithFallback from "@/components/ImageWithFallback"
import { getSession } from "@/lib/auth"

export async function generateMetadata({ params }: { params: Promise<{ city: string; sector: string; merchant: string }> }): Promise<Metadata> {
  const { city: citySlug, merchant: merchantSlug } = await params
  const city = await prisma.city.findUnique({ where: { slug: citySlug } })
  const merchant = city ? await prisma.merchant.findUnique({ where: { slug_cityId: { slug: merchantSlug, cityId: city.id } } }) : null
  if (!merchant) return { title: "التاجر غير موجود" }
  return { title: merchant.nameAr, description: merchant.description || `${merchant.nameAr} على سوقي` }
}

interface Props {
  params: Promise<{ city: string; sector: string; merchant: string }>
}

async function getMerchantData(citySlug: string, sectorSlug: string, merchantSlug: string) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug, isActive: true } })
  if (!city) return null
  const sector = await prisma.sector.findUnique({ where: { slug_cityId: { slug: sectorSlug, cityId: city.id } } })
  if (!sector) return null
  const merchant = await prisma.merchant.findUnique({
    where: { slug_cityId: { slug: merchantSlug, cityId: city.id } },
    include: {
      products: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
      reviews: {
        include: { consumer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  })
  if (!merchant || merchant.status !== "active") return null
  await prisma.merchant.update({ where: { id: merchant.id }, data: { viewCount: { increment: 1 } } })
  return { city, sector, merchant }
}

export default async function MerchantPage({ params }: Props) {
  const { city: citySlug, sector: sectorSlug, merchant: merchantSlug } = await params
  const data = await getMerchantData(citySlug, sectorSlug, merchantSlug)
  if (!data) notFound()

  const { city, sector, merchant } = data
  const session = await getSession()
  const avgRating =
    merchant.reviews.length > 0
      ? (merchant.reviews.reduce((a, r) => a + r.rating, 0) / merchant.reviews.length).toFixed(1)
      : null
  const workingHours = merchant.workingHours as Array<{ day: string; open: string; close: string }> | null

  return (
    <div className="container-custom py-8">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href={`/${citySlug}`} className="hover:text-emerald-600">{city.nameAr}</Link>
        <span className="mx-2">/</span>
        <Link href={`/${citySlug}/${sectorSlug}`} className="hover:text-emerald-600">{sector.nameAr}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{merchant.nameAr}</span>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-8">
        <div className="h-48 bg-gradient-to-l from-emerald-200 to-teal-100 relative">
          {merchant.coverImage && <ImageWithFallback src={merchant.coverImage} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="p-6 -mt-12 relative">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden shrink-0">
              {merchant.logo ? (
                <ImageWithFallback src={merchant.logo} alt={merchant.nameAr} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-3xl">&#127979;</div>
              )}
            </div>
            <div className="pt-12 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-gray-900">{merchant.nameAr}</h1>
                {merchant.isVerified && <span className="text-emerald-500 text-lg">✓</span>}
              </div>
              {merchant.description && <p className="text-gray-600 mt-2">{merchant.description}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                {avgRating && (
                  <span className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                    ⭐ {avgRating} ({merchant._count.reviews})
                  </span>
                )}
                {merchant.contactPhone && <span>هاتف: {merchant.contactPhone}</span>}
                {merchant.contactEmail && <span>بريد: {merchant.contactEmail}</span>}
                {merchant.address && <span>عنوان: {merchant.address}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {workingHours && workingHours.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <h3 className="font-bold text-gray-800 mb-2">ساعات العمل</h3>
          <div className="flex flex-wrap gap-2">
            {workingHours.map((wh, i) => (
              <span key={i} className="px-3 py-1 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
                {wh.day}: {wh.open} - {wh.close}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-gray-800">المنتجات والخدمات</h2>
          <RequestQuoteButton merchantId={merchant.id} merchantName={merchant.nameAr} />
        </div>

        {merchant.products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <p className="text-gray-500">لا توجد منتجات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {merchant.products.map((product) => {
              const isFavorited = false
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  nameAr={product.nameAr}
                  description={product.description}
                  price={product.price}
                  currency={product.currency}
                  images={product.images}
                  isService={product.isService}
                  showFavorite={!!session}
                  isFavorited={isFavorited}
                />
              )
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">التقييمات</h2>
          {merchant.reviews.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">لا توجد تقييمات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {merchant.reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{review.consumer.name}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2" dir="ltr">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < review.rating ? "text-amber-400" : "text-gray-200"}>★</span>
                    ))}
                  </div>
                  {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          {session && session.role === "CONSUMER" && (
            <ReviewForm merchantId={merchant.id} />
          )}
        </section>
      </div>
    </div>
  )
}
