"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DeleteSectorButton({ sectorId, hasMerchants }: { sectorId: string; hasMerchants: boolean }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا القطاع؟")) return
    setDeleting(true)
    const res = await fetch(`/api/sectors/${sectorId}`, { method: "DELETE" })
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || "حدث خطأ")
    }
    setDeleting(false)
  }

  if (hasMerchants) return <span className="text-xs text-gray-300">—</span>

  return (
    <button onClick={handleDelete} disabled={deleting}
      className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50">
      {deleting ? "..." : "حذف"}
    </button>
  )
}
