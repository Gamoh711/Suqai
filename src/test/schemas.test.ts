import { describe, it, expect } from "vitest"
import { registerSchema, loginSchema, reviewSchema, contactSchema } from "@/lib/schemas"

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({ name: "test", email: "test@test.com", password: "12345678", phone: "0777000000" })
    expect(result.success).toBe(true)
  })
  it("rejects short password", () => {
    const result = registerSchema.safeParse({ name: "test", email: "test@test.com", password: "123" })
    expect(result.success).toBe(false)
  })
  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ name: "test", email: "invalid", password: "123456" })
    expect(result.success).toBe(false)
  })
  it("accepts valid phone format", () => {
    const result = registerSchema.safeParse({ name: "test", email: "test@test.com", password: "12345678", phone: "0501234567" })
    expect(result.success).toBe(true)
  })
  it("accepts Yemeni number with leading 0", () => {
    const result = registerSchema.safeParse({ name: "test", email: "test@test.com", password: "12345678", phone: "0777000000" })
    expect(result.success).toBe(true)
  })
  it("accepts Yemeni number without leading 0", () => {
    const result = registerSchema.safeParse({ name: "test", email: "test@test.com", password: "12345678", phone: "777000000" })
    expect(result.success).toBe(true)
  })
  it("rejects invalid phone format", () => {
    const result = registerSchema.safeParse({ name: "test", email: "test@test.com", password: "12345678", phone: "1234" })
    expect(result.success).toBe(false)
  })
})

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({ email: "test@test.com", password: "x" })
    expect(result.success).toBe(true)
  })
  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "test@test.com", password: "" })
    expect(result.success).toBe(false)
  })
})

describe("reviewSchema", () => {
  it("accepts valid review", () => {
    const result = reviewSchema.safeParse({ rating: 4, merchantId: "some-id" })
    expect(result.success).toBe(true)
  })
  it("rejects rating < 1", () => {
    const result = reviewSchema.safeParse({ rating: 0, merchantId: "some-id" })
    expect(result.success).toBe(false)
  })
  it("rejects rating > 5", () => {
    const result = reviewSchema.safeParse({ rating: 6, merchantId: "some-id" })
    expect(result.success).toBe(false)
  })
})

describe("contactSchema", () => {
  it("accepts valid contact", () => {
    const result = contactSchema.safeParse({ name: "test", email: "a@b.com", subject: "help", message: "I need help please" })
    expect(result.success).toBe(true)
  })
  it("rejects short message", () => {
    const result = contactSchema.safeParse({ name: "test", email: "a@b.com", subject: "help", message: "short" })
    expect(result.success).toBe(false)
  })
})
