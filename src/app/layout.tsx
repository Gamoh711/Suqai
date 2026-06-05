import type { Metadata } from "next"
import { Tajawal } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"
import CookieConsent from "@/components/CookieConsent"
import { ToastProvider } from "@/components/Toast"
import PwaInstallPrompt from "@/components/PwaInstallPrompt"

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
  display: "swap",
  variable: "--font-tajawal",
})
import Link from "next/link"

export const metadata: Metadata = {
  title: { default: "سوقي - المنصة الرقمية الذكية", template: "%s | سوقي" },
  description: "منصة رقمية ذكية تربط التجار والمؤسسات والمستهلكين ضمن بيئة موحدة",
  keywords: ["سوق", "تجارة", "مؤسسات", "منتجات", "خدمات", "اليمن"],
  openGraph: {
    title: "سوقي - المنصة الرقمية الذكية",
    description: "منصة رقمية ذكية تربط التجار والمؤسسات والمستهلكين ضمن بيئة موحدة",
    type: "website",
    locale: "ar_YE",
    siteName: "سوقي",
  },
  twitter: { card: "summary_large_image", title: "سوقي", description: "منصة رقمية ذكية للتجار والمستهلكين" },
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.json",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: "var(--font-tajawal), sans-serif" }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", () => {
                  navigator.serviceWorker.register("/sw.js").catch(() => {});
                });
              }
            `,
          }}
        />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="سوقي" />
        <a href="#main-content" className="skip-link">تخطى إلى المحتوى الرئيسي</a>
        <ToastProvider>
          <Header />
          <main id="main-content">{children}</main>
          <PwaInstallPrompt />
        </ToastProvider>
        <CookieConsent />
        <footer className="bg-white border-t border-gray-200 mt-16 py-8">
          <div className="container-custom">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 mb-3">
              <Link href="/about" className="hover:text-emerald-600">حول سوقي</Link>
              <Link href="/faq" className="hover:text-emerald-600">الأسئلة الشائعة</Link>
              <Link href="/contact" className="hover:text-emerald-600">اتصل بنا</Link>
              <Link href="/privacy" className="hover:text-emerald-600">سياسة الخصوصية</Link>
              <Link href="/search" className="hover:text-emerald-600">بحث</Link>
            </div>
            <div className="text-center text-gray-400 text-xs">
              © {new Date().getFullYear()} سوقي - جميع الحقوق محفوظة
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
