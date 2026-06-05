import { NextRequest, NextResponse } from "next/server"
import { searchProducts } from "@/lib/search"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  try {
    const results = await searchProducts({
      q: searchParams.get("q")?.trim() || undefined,
      citySlug: searchParams.get("city") || undefined,
      sectorSlug: searchParams.get("sector") || undefined,
      minPrice: searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined,
      maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined,
      category: searchParams.get("category") || undefined,
      type: searchParams.get("type") || undefined,
    })
    return NextResponse.json({ products: results })
  } catch {
    return NextResponse.json({ error: "حدث خطأ في البحث" }, { status: 500 })
  }
}
