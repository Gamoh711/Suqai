"use client"

import { useEffect } from "react"

interface TrackViewProps {
  productId: string
  productName: string
  productImage: string
  isService: boolean
  url: string
}

export default function TrackProductView({ productId, productName, productImage, isService, url }: TrackViewProps) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem("suqai_recent")
      const items = raw ? JSON.parse(raw) : []
      const filtered = items.filter((i: { id: string }) => i.id !== productId)
      filtered.unshift({ id: productId, name: productName, image: productImage, isService, url })
      localStorage.setItem("suqai_recent", JSON.stringify(filtered.slice(0, 20)))
    } catch {}
  }, [productId, productName, productImage, isService, url])

  return null
}
