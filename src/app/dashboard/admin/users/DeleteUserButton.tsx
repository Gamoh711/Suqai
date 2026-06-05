"use client"

import { useState } from "react"

export default function DeleteUserButton({ userId }: { userId: string }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return
    setDeleting(true)
    await fetch(`/api/users/${userId}`, { method: "DELETE" })
    window.location.reload()
  }

  return (
    <button onClick={handleDelete} disabled={deleting}
      className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50">
      {deleting ? "..." : "حذف"}
    </button>
  )
}
