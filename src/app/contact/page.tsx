import type { Metadata } from "next"
import ContactForm from "./ContactForm"

export const metadata: Metadata = {
  title: "اتصل بنا",
  description: "تواصل مع فريق سوقي",
}

export default function ContactPage() {
  return (
    <div className="container-custom py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">اتصل بنا</h1>
        <p className="text-gray-500 text-center mb-8">نحن هنا لمساعدتك. أرسل لنا رسالة وسنرد عليك في أقرب وقت.</p>
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <ContactForm />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="font-bold text-sm text-gray-800">البريد الإلكتروني</h3>
            <p className="text-xs text-gray-500 mt-1">support@suqai.com</p>
          </div>
          <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <h3 className="font-bold text-sm text-gray-800">رقم الجوال</h3>
            <p className="text-xs text-gray-500 mt-1">+967 77 000 0000</p>
          </div>
          <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h3 className="font-bold text-sm text-gray-800">المقر</h3>
            <p className="text-xs text-gray-500 mt-1">سيئون، اليمن</p>
          </div>
        </div>
      </div>
    </div>
  )
}
