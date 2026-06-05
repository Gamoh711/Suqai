export default function Loading() {
  return (
    <div className="container-custom py-8">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
    </div>
  )
}
