"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [devUrl, setDevUrl] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (res.ok) {
      setDone(true)
      if (data.devUrl) setDevUrl(data.devUrl)
    } else {
      setError(data.error || "حدث خطأ")
    }
    setSaving(false)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {done ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">تم الإرسال</h1>
            <p className="text-gray-500 text-sm mb-4">إذا كان البريد مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور</p>
            {devUrl && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">رابط التطوير (dev only):</p>
                <a href={devUrl} className="text-sm text-emerald-600 break-all hover:underline">{devUrl}</a>
              </div>
            )}
            <Link href="/auth/login" className="text-sm text-emerald-600 hover:underline">العودة لتسجيل الدخول</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-2">نسيت كلمة المرور</h1>
            <p className="text-gray-500 text-center text-sm mb-6">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {saving ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
              </button>
            </form>
            <div className="text-center mt-4">
              <Link href="/auth/login" className="text-sm text-emerald-600 hover:underline">تذكرت كلمة المرور؟ تسجيل الدخول</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
