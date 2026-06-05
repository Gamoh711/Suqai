"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterForm() {
  const [accountType, setAccountType] = useState<"customer" | "merchant">("customer")
  const [name, setName] = useState("")
  const [storeName, setStoreName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [cities, setCities] = useState<{ id: string; nameAr: string }[]>([])
  const [sectors, setSectors] = useState<{ id: string; nameAr: string }[]>([])
  const [cityId, setCityId] = useState("")
  const [sectorId, setSectorId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/cities").then(r => r.json()).then(setCities)
  }, [])

  useEffect(() => {
    if (cityId) {
      fetch(`/api/sectors?cityId=${cityId}`).then(r => r.json()).then(setSectors)
    }
  }, [cityId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const body: Record<string, string | undefined> = { name, email: email || undefined, password, phone: phone || undefined, accountType }
    if (accountType === "merchant") {
      body.name = storeName
      body.storeName = storeName
      body.cityId = cityId
      body.sectorId = sectorId
      body.phone = phone || undefined
    }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok) {
      router.push(accountType === "merchant" ? "/dashboard/merchant" : "/")
      router.refresh()
    } else {
      setError(data.error || "حدث خطأ")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button type="button" onClick={() => setAccountType("customer")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${accountType === "customer" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          حساب عميل
        </button>
        <button type="button" onClick={() => setAccountType("merchant")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${accountType === "merchant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          حساب متجر
        </button>
      </div>

      {accountType === "customer" ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="الاسم الكامل" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="0777xxxxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني (اختياري)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="your@email.com" />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر</label>
            <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="اسم المتجر" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="0777xxxxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني (اختياري)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="store@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
            <select value={cityId} onChange={(e) => setCityId(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">اختر المدينة</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القطاع</label>
            <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              disabled={!cityId}>
              <option value="">{cityId ? "اختر القطاع" : "اختر المدينة أولاً"}</option>
              {sectors.map(s => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
            </select>
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
            سيتم إرسال طلبك إلى الإدارة للموافقة على المتجر. سنعلمك عند اكتمال المراجعة.
          </p>
        </>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          placeholder="••••••••" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
        {loading ? "جاري التحميل..." : accountType === "customer" ? "إنشاء حساب" : "تقديم طلب تسجيل المتجر"}
      </button>
      <p className="text-center text-sm text-gray-500">
        لديك حساب بالفعل؟{" "}
        <Link href="/auth/login" className="text-emerald-600 hover:underline">تسجيل دخول</Link>
      </p>
    </form>
  )
}
