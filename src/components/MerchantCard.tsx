import Link from "next/link"
import ImageWithFallback from "./ImageWithFallback"

interface MerchantCardProps {
  id: string
  citySlug: string
  sectorSlug: string
  slug: string
  nameAr: string
  description?: string | null
  logo?: string | null
  coverImage?: string | null
  productCount: number
  avgRating: string | null
}

export default function MerchantCard({
  citySlug,
  sectorSlug,
  slug,
  nameAr,
  description,
  logo,
  productCount,
  avgRating,
}: MerchantCardProps) {
  return (
    <Link
      href={`/${citySlug}/${sectorSlug}/${slug}`}
      className="block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-emerald-200 transition-all group"
    >
      <div className="h-24 bg-gradient-to-l from-emerald-100 to-teal-50 relative">
        {logo && (
          <div className="absolute -bottom-8 right-4 w-16 h-16 rounded-xl bg-white border-2 border-white shadow-sm overflow-hidden">
            <ImageWithFallback src={logo} alt={nameAr} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="p-4 pt-10">
        <h3 className="font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">{nameAr}</h3>
        {description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>}
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span>{productCount} منتج</span>
          {avgRating && (
            <span className="flex items-center gap-1">
              <span className="text-amber-500">★</span>
              <span>{avgRating}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
