import RegisterForm from "./RegisterForm"

export default function RegisterPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-2">إنشاء حساب جديد</h1>
        <p className="text-gray-500 text-center text-sm mb-6">اختر نوع الحساب: عميل أو تاجر</p>
        <RegisterForm />
      </div>
    </div>
  )
}
