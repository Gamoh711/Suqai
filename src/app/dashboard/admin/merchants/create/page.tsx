"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AdminCreateMerchantPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [cityId, setCityId] = useState("")
  const [sectorId, setSectorId] = useState("")
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([])
  const [sectors, setSectors] = useState<{ id: string; nameAr: string }[]>([])
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/cities").then(r => r.json()).then(setCities)
  }, [])

  useEffect(() => {
    if (!cityId) { setTimeout(() => setSectors([])); return }
    fetch(`/api/sectors?cityId=${cityId}&parentId=null`).then(r => r.json()).then(setSectors)
  }, [cityId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/admin/merchants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone, cityId, sectorId }),
    })
    if (res.ok) {
      router.push("/dashboard/admin/merchants")
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || "حدث خطأ")
    }
    setSaving(false)
  }

  return (
    <div className="container-custom py-8">
      <Link href="/dashboard/admin/merchants" className="text-sm text-emerald-600 hover:underline mb-4 inline-block">
        ← العودة لإدارة التجار
      </Link>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">إضافة تاجر جديد</h1>
      <div className="max-w-lg bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="0777xxxxxx" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">القطاع</label>
            <select value={sectorId} onChange={e => setSectorId(e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" disabled={!cityId}>
              <option value="">{cityId ? "اختر القطاع" : "اختر المدينة أولاً"}</option>
              {sectors.map((s) => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
            سيتم إنشاء حساب تاجر معتمد (نشط) مباشرة.
          </p>
          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "إضافة التاجر"}
          </button>
        </form>
      </div>
    </div>
  )
}
