import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/api/", "/messages/", "/checkout/"] },
    sitemap: "https://suqai.com/sitemap.xml",
  }
}
