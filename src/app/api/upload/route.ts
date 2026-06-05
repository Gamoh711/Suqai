import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { validateMagicBytes } from "@/lib/magic-bytes"
import { logger } from "@/lib/logger"

const AUTHORIZED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 })

    if (!AUTHORIZED_TYPES.has(file.type)) {
      logger.warn("Upload rejected - invalid mime type", { module: "upload", context: { mime: file.type, userId: session.userId } })
      return NextResponse.json({ error: "نوع الملف غير مدعوم" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      logger.warn("Upload rejected - file too large", { module: "upload", context: { size: file.size, userId: session.userId } })
      return NextResponse.json({ error: "حجم الملف يتجاوز 5 ميغابايت" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const detected = validateMagicBytes(new Uint8Array(buffer))
    if (!detected) {
      logger.warn("Upload rejected - invalid magic bytes", { module: "upload", context: { userId: session.userId, fileName: file.name } })
      return NextResponse.json({ error: "محتويات الملف لا تطابق الصيغة المعلنة" }, { status: 400 })
    }

    const ext = detected
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const dir = path.join(process.cwd(), "public", "uploads")
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), buffer)

    logger.info("Upload success", { module: "upload", context: { filename, size: file.size, userId: session.userId } })
    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (error) {
    logger.error("Upload failed", { module: "upload", context: { error: String(error), userId: session?.userId } })
    return NextResponse.json({ error: "فشل رفع الملف" }, { status: 500 })
  }
}
