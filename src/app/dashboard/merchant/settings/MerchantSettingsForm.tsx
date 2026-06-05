"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ImageWithFallback from "@/components/ImageWithFallback"

interface Props {
  merchant: { nameAr: string; description: string | null; contactEmail: string | null; contactPhone: string | null; address: string | null; cityId: string; sectorId: string; logo: string | null; workingHours: unknown }
  cities: { id: string; nameAr: string }[]
  sectors: { id: string; nameAr: string }[]
}

const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]
const FALLBACK_HOURS = DAYS.map(day => ({ day, open: "09:00", close: "21:00" }))

function parseWorkingHours(raw: unknown): { day: string; open: string; close: string }[] {
  if (Array.isArray(raw) && raw.every(w => typeof w === "object" && w && "day" in w && "open" in w && "close" in w))
    return raw as { day: string; open: string; close: string }[]
  return FALLBACK_HOURS
}

export default function MerchantSettingsForm({ merchant, cities, sectors }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    nameAr: merchant.nameAr,
    description: merchant.description || "",
    contactEmail: merchant.contactEmail || "",
    contactPhone: merchant.contactPhone || "",
    address: merchant.address || "",
    cityId: merchant.cityId,
    sectorId: merchant.sectorId,
  })
  const [workingHours, setWorkingHours] = useState(parseWorkingHours(merchant.workingHours))
  const [logo, setLogo] = useState(merchant.logo || "")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (res.ok) {
      const data = await res.json()
      setLogo(data.url)
    }
    setUploading(false)
  }

  function updateWorkingHour(day: string, field: "open" | "close", value: string) {
    setWorkingHours(prev => prev.map(w => (w.day === day ? { ...w, [field]: value } : w)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/merchants/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, workingHours, logo: logo || null }),
      })
      if (res.ok) router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر</label>
        <input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
          <input value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
          <input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
        <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">شعار المتجر</label>
        <div className="flex items-center gap-3">
          {logo && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
              <ImageWithFallback src={logo} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setLogo("")}
                className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-bl flex items-center justify-center">✕</button>
            </div>
          )}
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-emerald-400 text-gray-400 text-xl">
            {uploading ? "..." : "+"}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
          <select value={form.cityId} onChange={e => setForm({ ...form, cityId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            {cities.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">القطاع</label>
          <select value={form.sectorId} onChange={e => setForm({ ...form, sectorId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            {sectors.map(s => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
          </select>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">ساعات العمل</label>
        <div className="space-y-1.5">
          {workingHours.map(w => (
            <div key={w.day} className="flex items-center gap-2 text-sm">
              <span className="w-16 shrink-0 text-gray-600">{w.day}</span>
              <input type="time" value={w.open} onChange={e => updateWorkingHour(w.day, "open", e.target.value)} className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
              <span className="text-gray-400">–</span>
              <input type="time" value={w.close} onChange={e => updateWorkingHour(w.day, "close", e.target.value)} className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
            </div>
          ))}
        </div>
      </div>
      <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
        {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
      </button>
    </form>
  )
}
