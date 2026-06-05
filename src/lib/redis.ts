import { logger } from "./logger"

type Store = {
  get(key: string): Promise<string | null>
  setex(key: string, ttl: number, value: string): Promise<void>
  del(key: string): Promise<void>
  incr(key: string): Promise<number>
  expire(key: string, ttl: number): Promise<void>
  pttl(key: string): Promise<number>
}

let store: Store | null = null

const mem = new Map<string, { v: string; exp: number }>()
const memStore: Store = {
  async get(k) { const e = mem.get(k); if (!e) return null; if (e.exp < Date.now()) { mem.delete(k); return null }; return e.v },
  async setex(k, ttl, v) { mem.set(k, { v, exp: Date.now() + ttl * 1000 }) },
  async del(k) { mem.delete(k) },
  async incr(k) { const e = mem.get(k); if (!e || e.exp < Date.now()) { const nv = "1"; mem.set(k, { v: nv, exp: Date.now() + 86400000 }); return 1 }; const n = String(parseInt(e.v) + 1); mem.set(k, { v: n, exp: e.exp }); return parseInt(n) },
  async expire(k, ttl) { const e = mem.get(k); if (e) e.exp = Date.now() + ttl * 1000 },
  async pttl(k) { const e = mem.get(k); if (!e) return -2; const r = e.exp - Date.now(); return r > 0 ? r : -2 },
}

export async function getStore(): Promise<Store> {
  if (store) return store
  const url = process.env.REDIS_URL || ""
  if (url) {
    try {
      const IORedis = (await import("ioredis")).default
      const r = new IORedis(url, { maxRetriesPerRequest: 1, retryStrategy() { return null }, lazyConnect: true })
      await r.connect()
      store = {
        get: (k: string) => r.get(k),
        setex: (k: string, t: number, v: string) => r.setex(k, t, v).then(() => {}),
        del: (k: string) => r.del(k).then(() => {}),
        incr: (k: string) => r.incr(k),
        expire: (k: string, t: number) => r.expire(k, t).then(() => {}),
        pttl: (k: string) => r.pttl(k),
      }
      logger.info("Redis connected", { module: "redis" })
      return store!
    } catch (err) {
      logger.warn("Redis unavailable, using memory store", { module: "redis", context: { error: String(err) } })
    }
  }
  store = memStore
  return store
}
