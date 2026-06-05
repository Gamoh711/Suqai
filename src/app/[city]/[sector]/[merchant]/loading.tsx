import { ProductCardSkeleton } from "@/components/Skeletons"

export default function Loading() {
  return (
    <div className="container-custom py-8">
      <div className="h-8 bg-gray-100 rounded w-1/4 mb-6 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
