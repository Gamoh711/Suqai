"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface City { id: string; nameAr: string }
interface Sector { id: string; nameAr: string }

export default function CreateMerchantPage() {
  const [cities, setCities] = useState<City[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [selectedCity, setSelectedCity] = useState("")
  const [nameAr, setNameAr] = useState("")
  const [description, setDescription] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [address, setAddress] = useState("")
  const [sectorId, setSectorId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/cities").then(r => r.json()).then(setCities)
  }, [])

  useEffect(() => {
    if (selectedCity) {
      fetch(`/api/sectors?cityId=${selectedCity}&parentId=null`).then(r => r.json()).then(setSectors)
    }
  }, [selectedCity])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/merchants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameAr, description, contactPhone, contactEmail, address, cityId: selectedCity, sectorId }),
    })
    if (res.ok) {
      router.push("/dashboard/merchant")
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || "حدث خطأ")
      setLoading(false)
    }
  }

  return (
    <div className="container-custom py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">إنشاء متجر جديد</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر</label>
          <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">اختر المدينة</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القطاع</label>
            <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">اختر القطاع</option>
              {sectors.map((s) => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
          {loading ? "جاري الحفظ..." : "إنشاء المتجر"}
        </button>
      </form>
    </div>
  )
}
