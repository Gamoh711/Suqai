"use client"

import { useState, useEffect } from "react"

interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === "accepted") setShow(false)
    setDeferredPrompt(null)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-xs">
      <p className="text-sm font-medium text-gray-800 mb-2">تثبيت تطبيق سوقي</p>
      <p className="text-xs text-gray-500 mb-3">قم بتثبيت التطبيق على جهازك للوصول السريع</p>
      <div className="flex gap-2">
        <button onClick={handleInstall} className="flex-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
          تثبيت
        </button>
        <button onClick={() => setShow(false)} className="px-3 py-1.5 text-gray-500 text-sm hover:bg-gray-50 rounded-lg">
          لاحقاً
        </button>
      </div>
    </div>
  )
}
