type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  requestId?: string
  module?: string
  context?: Record<string, unknown>
}

const logQueue: LogEntry[] = []
const FLUSH_INTERVAL = 5000

function enqueue(entry: LogEntry): void {
  logQueue.push(entry)
}

function flush(): void {
  if (logQueue.length === 0) return
  const batch = logQueue.splice(0, logQueue.length)
  for (const e of batch) {
    process.stdout.write(JSON.stringify(e) + "\n")
  }
}

export const logger = {
  debug: (message: string, ctx?: { module?: string; requestId?: string; context?: Record<string, unknown> }) =>
    enqueue({ level: "debug", message, timestamp: new Date().toISOString(), ...ctx }),
  info: (message: string, ctx?: { module?: string; requestId?: string; context?: Record<string, unknown> }) =>
    enqueue({ level: "info", message, timestamp: new Date().toISOString(), ...ctx }),
  warn: (message: string, ctx?: { module?: string; requestId?: string; context?: Record<string, unknown> }) =>
    enqueue({ level: "warn", message, timestamp: new Date().toISOString(), ...ctx }),
  error: (message: string, ctx?: { module?: string; requestId?: string; context?: Record<string, unknown> }) =>
    enqueue({ level: "error", message, timestamp: new Date().toISOString(), ...ctx }),
}

if (typeof process !== "undefined" && typeof process.on === "function") {
  setInterval(flush, FLUSH_INTERVAL)
  process.on("exit", flush)
  process.on("SIGTERM", () => { flush(); process.exit(0) })
  process.on("SIGINT", () => { flush(); process.exit(0) })
}
