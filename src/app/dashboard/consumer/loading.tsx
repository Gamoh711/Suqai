import { ListSkeleton } from "@/components/Skeletons"

export default function Loading() {
  return (
    <div className="container-custom py-8">
      <div className="h-8 bg-gray-100 rounded w-1/4 mb-6 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
            <div className="h-8 bg-gray-100 rounded w-1/3 mx-auto mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto" />
          </div>
        ))}
      </div>
      <div className="h-6 bg-gray-100 rounded w-1/4 mb-3 animate-pulse" />
      <ListSkeleton />
    </div>
  )
}
