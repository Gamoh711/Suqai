import { describe, it, expect } from "vitest"
import { registerSchema, loginSchema } from "@/lib/schemas"

describe("registerSchema", () => {
  it("rejects password shorter than 8 chars", () => {
    const result = registerSchema.safeParse({ name: "test", email: "a@b.com", password: "1234567" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("8")
    }
  })

  it("accepts password of exactly 8 chars", () => {
    const result = registerSchema.safeParse({ name: "test", email: "a@b.com", password: "12345678", phone: "0777000000" })
    expect(result.success).toBe(true)
  })

  it("rejects email without domain", () => {
    const result = registerSchema.safeParse({ name: "test", email: "invalid", password: "12345678" })
    expect(result.success).toBe(false)
  })

  it("accepts merchant registration with optional fields", () => {
    const result = registerSchema.safeParse({
      name: "test",
      email: "merchant@test.com",
      password: "12345678",
      phone: "0777000000",
      accountType: "merchant",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({ name: "", email: "a@b.com", password: "12345678" })
    expect(result.success).toBe(false)
  })
})

describe("loginSchema", () => {
  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "12345678" })
    expect(result.success).toBe(false)
  })

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" })
    expect(result.success).toBe(false)
  })

  it("accepts valid login", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "correct-password" })
    expect(result.success).toBe(true)
  })
})
