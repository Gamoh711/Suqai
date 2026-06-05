import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderConfirmationPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/auth/login")
  const { id } = await params

  const order = await prisma.order.findFirst({
    where: { id, consumerId: session.userId },
    include: {
      merchant: { select: { nameAr: true, contactPhone: true, contactEmail: true } },
      items: { include: { product: { select: { nameAr: true } } } },
      coupon: { select: { code: true } },
    },
  })
  if (!order) notFound()

  return (
    <div className="container-custom py-12">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">تم إرسال طلبك بنجاح</h1>
        <p className="text-gray-500 mb-8">سيتم التواصل معك من قبل {order.merchant.nameAr} قريباً</p>

        <div className="bg-white rounded-xl border border-gray-100 p-6 text-right mb-6">
          <h2 className="font-bold text-gray-800 mb-4">تفاصيل الطلب</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">رقم الطلب</span>
              <span className="text-gray-800 font-medium" dir="ltr">{order.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">التاجر</span>
              <span className="text-gray-800">{order.merchant.nameAr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الحالة</span>
              <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-xs font-medium">قيد الانتظار</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">التاريخ</span>
              <span className="text-gray-800">{new Date(order.createdAt).toLocaleDateString("ar-SA")}</span>
            </div>
            {order.totalAmount && (
              <div className="flex justify-between">
                <span className="text-gray-500">الإجمالي</span>
                <span className="text-emerald-600 font-bold">{order.totalAmount.toLocaleString("ar-SA")} SAR</span>
              </div>
            )}
            {order.shippingAddress && (
              <div className="flex justify-between">
                <span className="text-gray-500">العنوان</span>
                <span className="text-gray-800 text-xs">{order.shippingAddress}</span>
              </div>
            )}
            {order.coupon && (
              <div className="flex justify-between text-emerald-600">
                <span className="text-gray-500">كود الخصم</span>
                <span>{order.coupon.code}</span>
              </div>
            )}
          </div>

          {order.items.length > 0 && (
            <>
              <hr className="my-3 border-gray-100" />
              <h3 className="font-bold text-gray-700 text-sm mb-2">المنتجات:</h3>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">{item.product.nameAr}</span>
                  <span className="text-gray-800">{item.unitPrice.toLocaleString("ar-SA")} SAR</span>
                </div>
              ))}
            </>
          )}

          {order.message && (
            <>
              <hr className="my-3 border-gray-100" />
              <div className="text-sm">
                <span className="text-gray-500">رسالتك:</span>
                <p className="text-gray-700 mt-1">{order.message}</p>
              </div>
            </>
          )}
        </div>

        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-right mb-6">
          <h3 className="font-bold text-emerald-800 text-sm mb-2">معلومات التواصل مع التاجر</h3>
          {order.merchant.contactPhone && <p className="text-emerald-700 text-sm">هاتف: {order.merchant.contactPhone}</p>}
          {order.merchant.contactEmail && <p className="text-emerald-700 text-sm">بريد: {order.merchant.contactEmail}</p>}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/dashboard/orders" className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            متابعة طلباتي
          </Link>
          <Link href="/" className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
