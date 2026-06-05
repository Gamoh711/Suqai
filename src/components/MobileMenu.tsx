"use client"

import { useState } from "react"
import Link from "next/link"
import NotificationBell from "./NotificationBell"
import LogoutButton from "./LogoutButton"

interface NavLink {
  href: string
  label: string
}

export default function MobileMenu({
  session,
  navLinks,
}: {
  session: { name: string; role: string } | null
  navLinks: NavLink[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="p-2 text-gray-600" aria-label="القائمة">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 p-4">
            <div className="flex flex-col gap-2 text-sm">
              {session && (
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-2">
                  <NotificationBell />
                  <span className="text-gray-600 font-medium truncate">{session.name}</span>
                </div>
              )}
              <Link href="/search" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">بحث</Link>
              {session?.role === "CONSUMER" && (
                <Link href="/checkout" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">السلة</Link>
              )}
              {session && <Link href="/messages" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">الرسائل</Link>}
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">{l.label}</Link>
              ))}
              {session ? (
                <div className="pt-2 border-t border-gray-100">
                  <LogoutButton />
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Link href="/auth/login" onClick={() => setOpen(false)} className="flex-1 px-3 py-2 text-center rounded-lg border border-gray-200 text-gray-700">دخول</Link>
                  <Link href="/auth/register" onClick={() => setOpen(false)} className="flex-1 px-3 py-2 text-center bg-emerald-600 text-white rounded-lg">تسجيل</Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
