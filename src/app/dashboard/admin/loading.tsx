import { StatsCardSkeleton, ListSkeleton } from "@/components/Skeletons"

export default function Loading() {
  return (
    <div className="container-custom py-8">
      <div className="h-8 bg-gray-100 rounded w-1/4 mb-6 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
      </div>
      <div className="h-6 bg-gray-100 rounded w-1/4 mb-3 animate-pulse" />
      <ListSkeleton />
    </div>
  )
}
