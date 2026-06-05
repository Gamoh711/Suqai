import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "حول سوقي",
  description: "تعرف على منصة سوقي الرقمية الذكية",
}

export default function AboutPage() {
  return (
    <div className="container-custom py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">حول سوقي</h1>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-600 leading-relaxed">
          <p>سوقي هي منصة رقمية ذكية تهدف إلى ربط التجار والمؤسسات والمستهلكين ضمن بيئة رقمية موحدة، تغطي قطاعات متعددة تشمل الطاقة المتجددة، الكهربائيات، الإلكترونيات، مواد البناء، السيارات، والعقارات.</p>
          <p>تتميز المنصة بمساعد ذكاء اصطناعي يساعد المستخدمين في العثور على المنتجات والخدمات المناسبة، بالإضافة إلى أدوات متكاملة للتجار لإدارة متاجرهم الإلكترونية.</p>
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-3">رؤيتنا</h2>
          <p>أن نكون المنصة الرقمية الأولى في اليمن التي تجمع جميع القطاعات التجارية في مكان واحد، مع توفير تجربة مستخدم سلسة وذكية.</p>
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-3">رسالتنا</h2>
          <p>تمكين التجار والمؤسسات من الوصول إلى عملائهم بسهولة، وتوفير منصة موثوقة للمستهلكين لاستكشاف وشراء المنتجات والخدمات بكل ثقة.</p>
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-3">قيمنا</h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>الشفافية والثقة</li>
            <li>الابتكار والتطوير المستمر</li>
            <li>تجربة مستخدم استثنائية</li>
            <li>دعم الاقتصاد الرقمي في اليمن</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
