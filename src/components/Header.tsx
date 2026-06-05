import { getSession } from "@/lib/auth"
import Link from "next/link"
import LogoutButton from "./LogoutButton"
import AIChatWidget from "./AIChatWidget"
import NotificationBell from "./NotificationBell"
import MobileMenu from "./MobileMenu"
import CartDrawer from "./CartDrawer"

export default async function Header() {
  const session = await getSession()

  const navLinks = session
    ? [
        ...(session.role === "CONSUMER"
          ? [
              { href: "/dashboard/consumer", label: "لوحتي" },
              { href: "/dashboard/favorites", label: "المفضلة" },
              { href: "/dashboard/orders", label: "طلباتي" },
            ]
          : []),
        ...(session.role === "MERCHANT"
          ? [{ href: "/dashboard/merchant", label: "لوحة التحكم" }]
          : []),
        ...(session.role === "ADMIN" ? [{ href: "/dashboard/admin", label: "إدارة" }] : []),
      ]
    : []

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container-custom flex items-center justify-between h-16">
        <Link href="/" className="text-xl sm:text-2xl font-extrabold text-emerald-600 shrink-0">
          ســـوقـــي
        </Link>
        <nav className="hidden md:flex items-center gap-2 text-sm">
          <Link href="/search" className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-emerald-600 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span>بحث</span>
          </Link>
          {session ? (
            <>
              {session.role === "CONSUMER" && <CartDrawer />}
              <NotificationBell />
              <span className="text-gray-500 truncate max-w-[120px]">{session.name}</span>
              <Link href="/messages" className="px-2 py-1.5 text-gray-600 hover:text-emerald-600">الرسائل</Link>
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className="px-2 py-1.5 text-gray-600 hover:text-emerald-600">
                  {l.label}
                </Link>
              ))}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="px-3 py-1.5 text-gray-600 hover:text-emerald-600">دخول</Link>
              <Link href="/auth/register" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">تسجيل</Link>
            </>
          )}
        </nav>
        <MobileMenu session={session} navLinks={navLinks} />
      </div>
      <AIChatWidget />
    </header>
  )
}
