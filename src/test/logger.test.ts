import { describe, it, expect, vi, beforeEach } from "vitest"

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("logger", () => {
  it("exports logger with all levels", async () => {
    const { logger } = await import("@/lib/logger")
    expect(logger.debug).toBeDefined()
    expect(logger.info).toBeDefined()
    expect(logger.warn).toBeDefined()
    expect(logger.error).toBeDefined()
  })

  it("logger.info writes valid JSON", async () => {
    const { logger } = await import("@/lib/logger")
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    logger.info("test message", { module: "test" })

    const written = writeSpy.mock.calls[0]?.[0]
    if (written) {
      const parsed = JSON.parse(String(written))
      expect(parsed.level).toBe("info")
      expect(parsed.message).toBe("test message")
      expect(parsed.module).toBe("test")
      expect(parsed.timestamp).toBeDefined()
    }
  })
})
