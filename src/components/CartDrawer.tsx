"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useToast } from "@/components/Toast"
import ImageWithFallback from "@/components/ImageWithFallback"

interface CartItem {
  id: string
  quantity: number
  product: { id: string; nameAr: string; price: number; images: string[]; merchantId: string }
}

export default function CartDrawer() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    fetch("/api/cart", { signal: controller.signal })
      .then(r => r.json() as Promise<CartItem[]>)
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
    return () => controller.abort()
  }, [open])

  function handleOpen() { setOpen(true); setLoading(true) }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity }),
    })
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i))
  }

  async function removeItem(itemId: string) {
    await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" })
    setItems(prev => prev.filter(i => i.id !== itemId))
    toast("تم إزالة المنتج من السلة", "info")
  }

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  return (
    <>
      <button onClick={handleOpen} className="relative p-2 text-gray-600 hover:text-emerald-600" aria-label="السلة">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] rounded-full flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-full max-w-sm bg-white shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">سلة التسوق</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="text-center text-gray-500 py-8">جاري التحميل...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">السلة فارغة</p>
                  <button onClick={() => setOpen(false)} className="mt-3 text-emerald-600 text-sm hover:underline">مواصلة التسوق</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shrink-0">
                        <ImageWithFallback src={item.product.images[0]} alt={item.product.nameAr} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.product.id}`} className="text-sm font-medium text-gray-800 hover:text-emerald-600 truncate block">
                          {item.product.nameAr}
                        </Link>
                        <p className="text-emerald-600 font-bold text-sm mt-0.5">{item.product.price.toLocaleString("ar-SA")} SAR</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-white border border-gray-200 text-sm flex items-center justify-center hover:bg-gray-50">-</button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-white border border-gray-200 text-sm flex items-center justify-center hover:bg-gray-50">+</button>
                          <button onClick={() => removeItem(item.id)} className="mr-auto text-xs text-red-500 hover:underline">حذف</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-100 p-4">
                <div className="flex justify-between mb-3">
                  <span className="font-bold text-gray-800">المجموع</span>
                  <span className="font-bold text-emerald-600">{total.toLocaleString("ar-SA")} SAR</span>
                </div>
                <Link href="/checkout" onClick={() => setOpen(false)}
                  className="block w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium text-center">
                  إتمام الطلب
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
