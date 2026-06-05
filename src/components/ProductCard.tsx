import FavoriteButton from "./FavoriteButton"
import ImageWithFallback from "./ImageWithFallback"

interface ProductCardProps {
  id: string
  nameAr: string
  description?: string | null
  price: number
  currency: string
  images: string[]
  isService: boolean
  showFavorite?: boolean
  isFavorited?: boolean
}

export default function ProductCard({ id, nameAr, description, price, currency, images, isService, showFavorite, isFavorited }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow relative">
      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        {images.length > 0 ? (
          <ImageWithFallback src={images[0]} alt={nameAr} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl opacity-30">{isService ? "&#9881;" : "&#128230;"}</span>
        )}
      </div>
      {showFavorite && (
        <div className="absolute top-2 left-2">
          <FavoriteButton productId={id} initialFavorited={isFavorited} />
        </div>
      )}
      <div className="p-3">
        <h4 className="font-bold text-gray-800 text-sm">{nameAr}</h4>
        {description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>}
        <div className="flex items-center justify-between mt-2">
          <span className="text-emerald-600 font-bold">
            {price.toLocaleString("ar-SA")} {currency}
          </span>
          {isService && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">خدمة</span>}
        </div>
      </div>
    </div>
  )
}
