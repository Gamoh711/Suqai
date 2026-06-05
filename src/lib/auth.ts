import crypto from "crypto"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { cookies } from "next/headers"
import { logger } from "./logger"

const SESSION_COOKIE = "suqai_session"
const SALT_ROUNDS = 12
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || ""

interface Session {
  userId: string
  role: string
  name: string
}

function signToken(payload: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex")
}

function verifySignature(token: string): string | null {
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [encoded, sig] = parts
  const expected = signToken(encoded)
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  return encoded
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string, role: string, name: string): Promise<void> {
  const payload = JSON.stringify({ userId, role, name, exp: Date.now() + 7 * 86400000 })
  const encoded = Buffer.from(payload).toString("base64url")
  const token = `${encoded}.${signToken(encoded)}`
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 86400,
    path: "/",
  })
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null
    const encoded = verifySignature(token)
    if (!encoded) {
      logger.warn("Invalid session signature", { module: "auth" })
      return null
    }
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString())
    if (data.exp < Date.now()) return null
    return { userId: data.userId, role: data.role, name: data.name }
  } catch {
    return null
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")
  return session
}

export async function requireRole(...roles: string[]): Promise<Session> {
  const session = await requireAuth()
  if (!roles.includes(session.role)) throw new Error("Forbidden")
  return session
}

export async function login(identifier: string, password: string): Promise<Session | string> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ phone: identifier }, { email: identifier }] },
  })
  if (!user) return "رقم الجوال أو كلمة المرور غير صحيحة"
  if (!user.isActive) return "الحساب غير نشط"
  const valid = await verifyPassword(password, user.password)
  if (!valid) return "رقم الجوال أو كلمة المرور غير صحيحة"
  await createSession(user.id, user.role, user.name)
  logger.info("User logged in", { module: "auth", context: { userId: user.id, role: user.role } })
  return { userId: user.id, role: user.role, name: user.name }
}

export async function register(data: { name: string; email?: string; password: string; phone: string; cityId?: string; role?: string }): Promise<Session | string> {
  if (data.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: data.email } })
    if (emailExists) return "البريد الإلكتروني مسجل مسبقاً"
  }
  const phoneExists = await prisma.user.findUnique({ where: { phone: data.phone } })
  if (phoneExists) return "رقم الجوال مسجل مسبقاً"
  const hashed = await hashPassword(data.password)
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email || null,
      password: hashed,
      phone: data.phone,
      cityId: data.cityId,
      role: (data.role || "CONSUMER") as "ADMIN" | "MERCHANT" | "CONSUMER",
    },
  })
  await createSession(user.id, user.role, user.name)
  logger.info("User registered", { module: "auth", context: { userId: user.id, role: user.role } })
  return { userId: user.id, role: user.role, name: user.name }
}
