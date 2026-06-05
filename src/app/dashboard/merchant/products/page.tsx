"use client"

import { useState, useEffect } from "react"
import ImageWithFallback from "@/components/ImageWithFallback"

export default function MerchantProductsPage() {
  const [products, setProducts] = useState<{ id: string; nameAr: string; price: number; currency: string; isService: boolean; isActive: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const res = await fetch("/api/products")
    if (res.ok) {
      setProducts(await res.json())
    }
    setLoading(false)
  }

  async function deleteProduct(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
    if (res.ok) fetchProducts()
  }

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">إدارة المنتجات</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
          {showForm ? "إلغاء" : "إضافة منتج"}
        </button>
      </div>

      {showForm && <ProductForm onDone={() => { setShowForm(false); fetchProducts() }} />}

      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          </div>
          <p className="text-gray-500">لا توجد منتجات بعد</p>
          <button onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
            إضافة منتج
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-3 text-sm font-medium text-gray-600">المنتج</th>
                <th className="p-3 text-sm font-medium text-gray-600">السعر</th>
                <th className="p-3 text-sm font-medium text-gray-600">النوع</th>
                <th className="p-3 text-sm font-medium text-gray-600">الحالة</th>
                <th className="p-3 text-sm font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3">{p.nameAr}</td>
                  <td className="p-3 text-emerald-600 font-medium">{p.price} {p.currency}</td>
                  <td className="p-3">{p.isService ? "خدمة" : "منتج"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${p.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                      {p.isActive ? "نشط" : "غير نشط"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:text-red-700 text-xs">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ProductForm({ onDone }: { onDone: () => void }) {
  const [nameAr, setNameAr] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [isService, setIsService] = useState(false)
  const [category, setCategory] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (res.ok) {
      const data = await res.json()
      setImages((prev) => [...prev, data.url])
    }
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameAr, description, price: parseFloat(price), isService, category, images, tags: [] }),
    })
    if (res.ok) {
      onDone()
    } else {
      const data = await res.json()
      setError(data.error || "حدث خطأ")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 mb-6 space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
          <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">السعر (SAR)</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الصور</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
              <ImageWithFallback src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-bl flex items-center justify-center">✕</button>
            </div>
          ))}
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-emerald-400 text-gray-400 text-xl">
            {uploading ? "..." : "+"}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isService} onChange={(e) => setIsService(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-gray-300" />
          <span className="text-sm text-gray-700">هذه خدمة وليس منتج</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
        </div>
      </div>
      <button type="submit" disabled={saving}
        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
        {saving ? "جاري الحفظ..." : "حفظ المنتج"}
      </button>
    </form>
  )
}
