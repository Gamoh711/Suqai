"use client"

import { useState } from "react"
import { useToast } from "@/components/Toast"

export default function AddToCartButton({ productId }: { productId: string }) {
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleClick() {
    setSaving(true)
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    })
    if (res.ok) {
      toast("تمت الإضافة إلى السلة", "success")
    } else {
      const data = await res.json()
      toast(data.error || "يجب تسجيل الدخول أولاً", "error")
    }
    setSaving(false)
  }

  return (
    <button onClick={handleClick} disabled={saving}
      className="px-4 py-2.5 bg-white border-2 border-emerald-600 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 disabled:opacity-50 transition-colors">
      {saving ? "..." : "أضف إلى السلة"}
    </button>
  )
}
