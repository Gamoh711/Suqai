"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("كلمة المرور غير متطابقة"); return }
    if (password.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return }
    setSaving(true)
    setError("")
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    if (res.ok) {
      setDone(true)
    } else {
      setError(data.error || "حدث خطأ")
    }
    setSaving(false)
  }

  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12">
        <div className="text-center max-w-md bg-white rounded-2xl border border-gray-100 p-8">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">رابط غير صالح</h1>
          <p className="text-gray-500 text-sm mb-4">عذراً، رابط إعادة تعيين كلمة المرور غير صالح</p>
          <Link href="/auth/forgot-password" className="text-sm text-emerald-600 hover:underline">طلب رابط جديد</Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12">
        <div className="text-center max-w-md bg-white rounded-2xl border border-gray-100 p-8">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">تم تغيير كلمة المرور</h1>
          <p className="text-gray-500 text-sm mb-4">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة</p>
          <Link href="/auth/login" className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">تسجيل الدخول</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-2">إعادة تعيين كلمة المرور</h1>
        <p className="text-gray-500 text-center text-sm mb-6">أدخل كلمة المرور الجديدة</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "تغيير كلمة المرور"}
          </button>
        </form>
      </div>
    </div>
  )
}
