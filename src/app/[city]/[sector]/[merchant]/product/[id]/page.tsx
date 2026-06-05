import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import RequestQuoteButton from "@/components/RequestQuoteButton"
import FavoriteButton from "@/components/FavoriteButton"
import TrackProductView from "@/components/TrackProductView"
import ImageWithFallback from "@/components/ImageWithFallback"
import AddToCartButton from "@/components/AddToCartButton"
import { getSession } from "@/lib/auth"

export async function generateMetadata({ params }: { params: Promise<{ city: string; sector: string; merchant: string; id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id }, include: { merchant: { select: { nameAr: true } } } })
  if (!product) return { title: "المنتج غير موجود" }
  return { title: product.nameAr, description: product.description || `${product.nameAr} - ${product.merchant.nameAr}` }
}

interface Props {
  params: Promise<{ city: string; sector: string; merchant: string; id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: { merchant: true },
  })
  if (!product || !product.isActive) notFound()

  const session = await getSession()
  const isService = product.isService

  const productUrl = `/${(await params).city}/${(await params).sector}/${(await params).merchant}/product/${id}`

  return (
    <div className="container-custom py-8">
      <TrackProductView productId={product.id} productName={product.nameAr} productImage={product.images[0] || ""} isService={product.isService} url={productUrl} />
      <nav className="text-sm text-gray-400 mb-6">
        <span className="text-gray-700">{product.merchant.nameAr}</span>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.nameAr}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center border border-gray-100">
          {product.images.length > 0 ? (
            <ImageWithFallback src={product.images[0]} alt={product.nameAr} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <span className="text-8xl opacity-20">{isService ? "&#9881;" : "&#128230;"}</span>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{product.nameAr}</h1>
              {product.category && (
                <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 mb-3">
                  {product.category}
                </span>
              )}
            </div>
            {session && <FavoriteButton productId={product.id} />}
          </div>

          <div className="text-3xl font-bold text-emerald-600 mb-4">
            {product.price.toLocaleString("ar-SA")} {product.currency}
          </div>
          {isService && (
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm mb-4">
              خدمة
            </span>
          )}
          {product.description && (
            <p className="text-gray-600 mb-6">{product.description}</p>
          )}

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-2">معلومات التاجر</h3>
            <p className="text-gray-700">{product.merchant.nameAr}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500">
              {product.merchant.contactPhone && <span>{product.merchant.contactPhone}</span>}
              {product.merchant.address && <span>{product.merchant.address}</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {session?.role === "CONSUMER" && <AddToCartButton productId={product.id} />}
            <RequestQuoteButton
              merchantId={product.merchantId}
              merchantName={product.merchant.nameAr}
              productIds={[product.id]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
