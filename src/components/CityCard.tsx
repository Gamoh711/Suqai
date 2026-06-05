import Link from "next/link"
import ImageWithFallback from "./ImageWithFallback"

interface CityCardProps {
  nameAr: string
  slug: string
  image?: string | null
}

export default function CityCard({ nameAr, slug, image }: CityCardProps) {
  return (
    <Link
      href={`/${slug}`}
      className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-200"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
        {image ? (
          <ImageWithFallback src={image} alt={nameAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-30">&#127963;</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 text-center group-hover:text-emerald-600 transition-colors">
          {nameAr}
        </h3>
      </div>
    </Link>
  )
}
