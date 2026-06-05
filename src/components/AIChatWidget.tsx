"use client"

import { useState, useRef, useEffect } from "react"

export default function AIChatWidget({ cityId }: { cityId?: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "مرحباً! أنا مساعد سوقي الذكي. كيف يمكنني مساعدتك اليوم؟" },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", text: userMsg }])
    setLoading(true)
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, cityId }),
      })
      const data = await res.json()
      const reply = data.response || "عذراً، حدث خطأ."
      setMessages((prev) => [...prev, { role: "ai", text: reply.split("\n").join("\n") }])
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "عذراً، حدث خطأ في الاتصال." }])
    }
    setLoading(false)
  }

  function quickSearch(term: string) {
    setInput(term)
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {open && (
        <div className="absolute bottom-16 left-0 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-2">
          <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold">مساعد سوقي الذكي</h3>
              <p className="text-xs opacity-80">مدعوم بالذكاء الاصطناعي</p>
            </div>
            <button onClick={() => setMessages([{ role: "ai", text: "مرحباً! كيف يمكنني مساعدتك؟" }])}
              className="text-white/70 hover:text-white text-xs">جديد</button>
          </div>
          <div className="h-80 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-gray-100 text-gray-800 rounded-br-sm"
                      : "bg-emerald-50 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-emerald-50 rounded-xl px-3 py-2 text-sm text-gray-500">جاري البحث...</div>
              </div>
            )}
            <div ref={endRef} />

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["طاقة شمسية", "كهربائيات", "أجهزة إلكترونية", "مواد بناء"].map((term) => (
                  <button key={term} onClick={() => quickSearch(term)}
                    className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-emerald-50 hover:border-emerald-200">
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 font-bold"
            >
              ارسال
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center text-2xl"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          )}
        </svg>
      </button>
    </div>
  )
}
