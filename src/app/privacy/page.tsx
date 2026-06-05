import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "سياسة الخصوصية وشروط الاستخدام لمنصة سوقي",
}

export default function PrivacyPage() {
  return (
    <div className="container-custom py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">سياسة الخصوصية</h1>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-600 leading-relaxed">
          <p>نحن في سوقي نلتزم بحماية خصوصية مستخدمينا. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك الشخصية.</p>
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-3">المعلومات التي نجمعها</h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>معلومات الحساب: الاسم، البريد الإلكتروني، رقم الجوال</li>
            <li>معلومات الملف الشخصي: الصورة، العنوان، المدينة</li>
            <li>معلومات الاستخدام: المنتجات المفضلة، الطلبات، التقييمات</li>
          </ul>
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-3">كيف نستخدم معلوماتك</h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>تقديم وتحسين خدمات المنصة</li>
            <li>التواصل معك بشأن طلباتك واستفساراتك</li>
            <li>إرسال إشعارات مهمة متعلقة بحسابك</li>
            <li>تحسين تجربة المستخدم وتخصيص المحتوى</li>
          </ul>
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-3">حماية المعلومات</h2>
          <p>نستخدم إجراءات أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح.</p>
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-3">اتصل بنا</h2>
          <p>للاستفسارات المتعلقة بسياسة الخصوصية، يرجى التواصل معنا عبر البريد الإلكتروني: privacy@suqai.com</p>
          <p className="text-sm text-gray-400 mt-8">آخر تحديث: مايو 2026</p>
        </div>
      </div>
    </div>
  )
}
