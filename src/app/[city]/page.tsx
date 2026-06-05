import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import ImageWithFallback from "@/components/ImageWithFallback"

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: slug } = await params
  const city = await prisma.city.findUnique({ where: { slug } })
  if (!city) return { title: "المدينة غير موجودة" }
  return { title: city.nameAr, description: `القطاعات المتوفرة في ${city.nameAr} على سوقي` }
}

interface Props {
  params: Promise<{ city: string }>
}

async function getCityData(slug: string) {
  const city = await prisma.city.findUnique({ where: { slug, isActive: true } })
  if (!city) return null
  const sectors = await prisma.sector.findMany({
    where: { cityId: city.id, parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { merchants: true } } },
  })
  return { city, sectors }
}

export default async function CityPage({ params }: Props) {
  const { city: slug } = await params
  const data = await getCityData(slug)
  if (!data) notFound()

  return (
    <div className="container-custom py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{data.city.nameAr}</h1>
        <p className="text-gray-500">جميع القطاعات المتوفرة في {data.city.nameAr}</p>
      </section>

      {data.sectors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          </div>
          <p className="text-gray-500 text-lg">لا توجد قطاعات متاحة في هذه المدينة حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.sectors.map((sector) => (
            <Link
              key={sector.id}
              href={`/${data.city.slug}/${sector.slug}`}
              className="group bg-white rounded-xl border border-gray-100 p-6 hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              <div className="relative h-32 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl bg-gradient-to-br from-emerald-50 to-teal-50">
                {sector.image ? (
                  <ImageWithFallback src={sector.image} alt={sector.nameAr} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">{sector.icon || "&#128230;"}</div>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                {sector.nameAr}
              </h3>
              {sector.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{sector.description}</p>
              )}
              <div className="mt-3 text-xs text-gray-400">
                {sector._count.merchants} تاجر
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
