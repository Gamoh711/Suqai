import { getStore } from "./redis"
import { logger } from "./logger"

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 15 * 60

export async function checkLoginRateLimit(email: string, ip: string): Promise<boolean> {
  const store = await getStore()
  const key = `login:${email}:${ip}`
  const count = await store.incr(key)
  if (count === 1) await store.expire(key, LOCKOUT_SECONDS)
  if (count > MAX_ATTEMPTS) {
    logger.warn("Rate limit triggered", { module: "auth", context: { email, ip, attempts: count } })
    return false
  }
  return true
}

export async function resetLoginRateLimit(email: string, ip: string): Promise<void> {
  const store = await getStore()
  await store.del(`login:${email}:${ip}`)
}
