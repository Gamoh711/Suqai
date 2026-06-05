import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سوقي - SuqAI",
    short_name: "سوقي",
    description: "منصة رقمية ذكية تربط التجار والمستهلكين مع مساعد ذكاء اصطناعي",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    dir: "rtl",
    lang: "ar",
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  }
}
