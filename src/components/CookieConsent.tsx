"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) setTimeout(() => setVisible(true), 0)
  }, [])

  function accept() {
    localStorage.setItem("cookie-consent", "accepted")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-gray-900/95 text-white p-4">
      <div className="container-custom flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-300">
          نستخدم ملفات تعريف الارتباط لتحسين تجربتك. باستخدام الموقع، فإنك توافق على{" "}
          <Link href="/privacy" className="text-emerald-400 hover:underline">سياسة الخصوصية</Link>.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={accept} className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors">
            موافق
          </button>
        </div>
      </div>
    </div>
  )
}
