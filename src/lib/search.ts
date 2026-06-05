import { prisma } from "@/lib/prisma"

export interface SearchFilters {
  q?: string
  citySlug?: string
  sectorSlug?: string
  minPrice?: number
  maxPrice?: number
  category?: string
  type?: string
}

export interface SearchResult {
  id: string
  nameAr: string
  price: number
  currency: string
  images: string[]
  isService: boolean
  category: string | null
  tags: string[]
  merchantName: string
  merchantSlug: string
  sectorSlug: string
  citySlug: string
  avgRating: number
}

export async function searchProducts(filters: SearchFilters): Promise<SearchResult[]> {
  const conditions: string[] = ["p.is_active = true", "m.status = 'active'"]
  const params: (string | number)[] = []
  let idx = 1

  if (filters.q) {
    conditions.push(`(p.name_ar ILIKE $${idx} OR p.description ILIKE $${idx} OR p.tags::text ILIKE $${idx} OR m.name_ar ILIKE $${idx})`)
    params.push(`%${filters.q}%`)
    idx++
  }
  if (filters.citySlug) {
    conditions.push(`c.slug = $${idx}`)
    params.push(filters.citySlug)
    idx++
  }
  if (filters.sectorSlug) {
    conditions.push(`s.slug = $${idx}`)
    params.push(filters.sectorSlug)
    idx++
  }
  if (filters.minPrice !== undefined) {
    conditions.push(`p.price >= $${idx}`)
    params.push(filters.minPrice)
    idx++
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`p.price <= $${idx}`)
    params.push(filters.maxPrice)
    idx++
  }
  if (filters.category) {
    conditions.push(`p.category = $${idx}`)
    params.push(filters.category)
    idx++
  }
  if (filters.type === "service") {
    conditions.push(`p.is_service = true`)
  } else if (filters.type === "product") {
    conditions.push(`p.is_service = false`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const sql = `
    SELECT p.id, p.name_ar, p.price, p.currency, p.images, p.is_service, p.category, p.tags,
           m.name_ar as merchant_name, m.slug as merchant_slug, m.logo as merchant_logo,
           s.slug as sector_slug, c.slug as city_slug,
           COALESCE((SELECT AVG(rating) FROM reviews rv WHERE rv.merchant_id = m.id), 0) as avg_rating
    FROM products p
    JOIN merchants m ON m.id = p.merchant_id
    JOIN sectors s ON s.id = m.sector_id
    JOIN cities c ON c.id = m.city_id
    ${where}
    ORDER BY p."createdAt" DESC
    LIMIT 50
  `

  type RawRow = {
    id: string; name_ar: string; price: number; currency: string; images: string[]
    is_service: boolean; category: string | null; tags: string[]
    merchant_name: string; merchant_slug: string; merchant_logo: string | null
    sector_slug: string; city_slug: string; avg_rating: number
  }
  const rows = await prisma.$queryRawUnsafe<RawRow[]>(sql, ...params)
  return rows.map((p) => ({
    id: p.id,
    nameAr: p.name_ar,
    price: Number(p.price),
    currency: p.currency,
    images: p.images || [],
    isService: p.is_service,
    category: p.category,
    tags: p.tags || [],
    merchantName: p.merchant_name,
    merchantSlug: p.merchant_slug,
    sectorSlug: p.sector_slug,
    citySlug: p.city_slug,
    avgRating: Number(p.avg_rating),
  }))
}
