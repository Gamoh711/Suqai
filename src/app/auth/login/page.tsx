import LoginForm from "./LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-2">تسجيل الدخول</h1>
        <p className="text-gray-500 text-center text-sm mb-6">أهلاً بعودتك! أدخل بياناتك للمتابعة</p>
        <LoginForm />
      </div>
    </div>
  )
}
