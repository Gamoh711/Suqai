"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/Toast"
import ImageWithFallback from "@/components/ImageWithFallback"

interface CartItem {
  id: string; quantity: number
  product: { id: string; nameAr: string; price: number; images: string[]; merchantId: string; merchant: { nameAr: string } }
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [shippingAddress, setShippingAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [couponCode, setCouponCode] = useState("")
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetch("/api/cart")
      .then(r => r.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const total = Math.max(0, subtotal - couponDiscount)

  async function validateCoupon() {
    if (!couponCode) return
    setCouponError("")
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, orderTotal: subtotal }),
    })
    const data = await res.json()
    if (res.ok) {
      setCouponDiscount(data.discount)
      toast(`تم تطبيق الخصم: ${data.discount.toLocaleString("ar-SA")} SAR`, "success")
    } else {
      setCouponError(data.error || "كود غير صالح")
      setCouponDiscount(0)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingAddress, phone, couponCode: couponDiscount > 0 ? couponCode : undefined }),
    })
    const data = await res.json()
    if (res.ok) {
      toast("تم إرسال الطلب بنجاح", "success")
      router.push(`/order/confirmation/${data.orderId}`)
    } else {
      toast(data.error || "حدث خطأ", "error")
    }
    setSaving(false)
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">إتمام الطلب</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">السلة فارغة</p>
          <button onClick={() => router.push("/")} className="mt-3 text-emerald-600 hover:underline">تسوق الآن</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-4">منتجاتك</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shrink-0">
                      <ImageWithFallback src={item.product.images[0]} alt={item.product.nameAr} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{item.product.nameAr}</p>
                      <p className="text-xs text-gray-400">الكمية: {item.quantity}</p>
                      <p className="text-emerald-600 font-bold text-sm">{(item.product.price * item.quantity).toLocaleString("ar-SA")} SAR</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-bold text-gray-800 mb-4">معلومات التوصيل</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input value={shippingAddress} onChange={e => setShippingAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="العنوان الكامل" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="05xxxxxxxx" />
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-4">كود خصم</h2>
              <div className="flex gap-2">
                <input value={couponCode} onChange={e => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="أدخل الكود" />
                <button type="button" onClick={validateCoupon}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
                  تطبيق
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
              {couponDiscount > 0 && <p className="text-emerald-600 text-xs mt-1">خصم: {couponDiscount.toLocaleString("ar-SA")} SAR</p>}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-4">ملخص الطلب</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">المجموع الفرعي</span>
                  <span>{subtotal.toLocaleString("ar-SA")} SAR</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>الخصم</span>
                    <span>-{couponDiscount.toLocaleString("ar-SA")} SAR</span>
                  </div>
                )}
                <hr className="border-gray-100" />
                <div className="flex justify-between font-bold text-lg">
                  <span>الإجمالي</span>
                  <span className="text-emerald-600">{total.toLocaleString("ar-SA")} SAR</span>
                </div>
              </div>
              <button onClick={handleSubmit} disabled={saving}
                className="w-full mt-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
                {saving ? "جاري الإرسال..." : "تأكيد الطلب"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
