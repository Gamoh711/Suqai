"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminCreateSectorPage() {
  const [nameAr, setNameAr] = useState("")
  const [slug, setSlug] = useState("")
  const [icon, setIcon] = useState("")
  const [image, setImage] = useState("")
  const [description, setDescription] = useState("")
  const [cityId, setCityId] = useState("")
  const [parentId, setParentId] = useState("")
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([])
  const [sectors, setSectors] = useState<{ id: string; nameAr: string; parentId: string | null }[]>([])
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/cities").then(r => r.json()).then(setCities)
  }, [])

  useEffect(() => {
    if (!cityId) { setTimeout(() => setSectors([])); return }
    fetch(`/api/sectors?cityId=${cityId}`).then(r => r.json()).then(setSectors)
  }, [cityId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/sectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameAr,
        slug: slug || nameAr.toLowerCase().replace(/\s+/g, "-"),
        icon: icon || undefined,
        image: image || undefined,
        description,
        cityId,
        parentId: parentId || undefined,
      }),
    })
    if (res.ok) {
      router.push("/dashboard/admin/sectors")
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || "حدث خطأ")
    }
    setSaving(false)
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">إضافة قطاع</h1>
      <div className="max-w-lg bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم القطاع</label>
            <input value={nameAr} onChange={e => { setNameAr(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")) }} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الرابط (slug)</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الأيقونة</label>
              <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="🔧" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
              <select value={cityId} onChange={e => setCityId(e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">اختر المدينة</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رابط الصورة (اختياري)</label>
            <input value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" dir="ltr" />
            {image && (
              <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="معاينة" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القطاع الأب (اختياري)</label>
            <select value={parentId} onChange={e => setParentId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">قطاع رئيسي</option>
              {sectors.filter((s) => !s.parentId).map((s) => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "إضافة القطاع"}
          </button>
        </form>
      </div>
    </div>
  )
}
