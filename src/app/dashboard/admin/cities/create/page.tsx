"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminCreateCityPage() {
  const [nameAr, setNameAr] = useState("")
  const [slug, setSlug] = useState("")
  const [image, setImage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameAr, image: image || undefined, slug: slug || nameAr.toLowerCase().replace(/\s+/g, "-") }),
    })
    if (res.ok) {
      router.push("/dashboard/admin/cities")
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || "حدث خطأ")
    }
    setSaving(false)
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">إضافة مدينة</h1>
      <div className="max-w-lg bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المدينة</label>
            <input value={nameAr} onChange={e => { setNameAr(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")) }} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الرابط (slug)</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رابط الصورة (اختياري)</label>
            <input value={image} onChange={e => setImage(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" dir="ltr" placeholder="https://..." />
            {// eslint-disable-next-line @next/next/no-img-element
            image && <img src={image} alt="" className="mt-2 w-32 h-24 object-cover rounded-lg border" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />}
          </div>
          <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "إضافة المدينة"}
          </button>
        </form>
      </div>
    </div>
  )
}
