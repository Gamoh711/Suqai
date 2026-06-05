import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logger } from "./lib/logger"

const rateLimit = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60_000
const MAX_REQUESTS = 60

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export function middleware(req: NextRequest) {
  const url = req.nextUrl

  if (url.pathname.startsWith("/api/")) {
    if (MUTATING_METHODS.has(req.method)) {
      const origin = req.headers.get("origin")
      const host = req.headers.get("host")
      if (origin && host) {
        try {
          const originHost = new URL(origin).host
          if (originHost !== host) {
            logger.warn("CSRF rejection", { module: "security", context: { origin, host, path: url.pathname, method: req.method } })
            return new NextResponse(JSON.stringify({ error: "طلب مرفوض" }), {
              status: 403,
              headers: { "Content-Type": "application/json; charset=utf-8" },
            })
          }
        } catch {
          logger.warn("CSRF rejection - invalid origin", { module: "security", context: { origin, path: url.pathname } })
          return new NextResponse(JSON.stringify({ error: "طلب مرفوض" }), {
            status: 403,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          })
        }
      }
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
    const now = Date.now()
    const entry = rateLimit.get(ip)

    if (!entry || entry.resetAt < now) {
      rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    } else {
      entry.count++
      if (entry.count > MAX_REQUESTS) {
        logger.warn("Rate limit triggered", { module: "security", context: { ip, path: url.pathname, count: entry.count } })
        return new NextResponse(JSON.stringify({ error: "طلبات كثيرة جداً. حاول لاحقاً." }), {
          status: 429,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        })
      }
    }
  }

  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-DNS-Prefetch-Control", "off")

  const isDev = process.env.NODE_ENV === "development"
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://upload.wikimedia.org",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")
  response.headers.set("Content-Security-Policy", csp)

  if (!isDev) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  }

  return response
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)"],
}
