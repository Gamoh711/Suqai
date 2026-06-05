import { prisma } from "@/lib/prisma"

export default async function sitemap() {
  const baseUrl = "https://suqai.com"

  const cities = await prisma.city.findMany({ where: { isActive: true }, select: { slug: true } })
  const sectors = await prisma.sector.findMany({ where: { isActive: true }, select: { city: { select: { slug: true } }, slug: true } })
  const merchants = await prisma.merchant.findMany({ where: { status: "active", isVerified: true }, select: { city: { select: { slug: true } }, sector: { select: { slug: true } }, slug: true } })

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    ...cities.map((c) => ({ url: `${baseUrl}/${c.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...sectors.map((s) => ({ url: `${baseUrl}/${(s as { city: { slug: string } }).city.slug}/${s.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...merchants.map((m) => ({ url: `${baseUrl}/${(m as { city: { slug: string }; sector: { slug: string } }).city.slug}/${(m as { city: { slug: string }; sector: { slug: string } }).sector.slug}/${m.slug}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 })),
  ]
}
