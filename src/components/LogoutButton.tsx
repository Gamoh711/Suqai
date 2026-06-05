"use client"

import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/me", { method: "DELETE" })
    router.push("/")
    router.refresh()
  }

  return (
    <button onClick={handleLogout} className="px-3 py-1.5 text-gray-500 hover:text-red-600 transition-colors">
      تسجيل خروج
    </button>
  )
}
