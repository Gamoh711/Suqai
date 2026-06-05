import { describe, it, expect } from "vitest"
import { validateMagicBytes } from "@/lib/magic-bytes"

describe("validateMagicBytes", () => {
  it("detects JPEG", () => {
    const buffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10])
    expect(validateMagicBytes(buffer)).toBe("jpeg")
  })

  it("detects PNG", () => {
    const buffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    expect(validateMagicBytes(buffer)).toBe("png")
  })

  it("detects GIF", () => {
    const buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
    expect(validateMagicBytes(buffer)).toBe("gif")
  })

  it("detects WebP", () => {
    const buffer = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ])
    expect(validateMagicBytes(buffer)).toBe("webp")
  })

  it("rejects non-image file (text file)", () => {
    const buffer = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F])
    expect(validateMagicBytes(buffer)).toBeNull()
  })

  it("rejects empty buffer", () => {
    expect(validateMagicBytes(new Uint8Array([]))).toBeNull()
  })

  it("rejects partial JPEG signature", () => {
    const buffer = new Uint8Array([0xFF, 0xD8])
    expect(validateMagicBytes(buffer)).toBeNull()
  })

  it("rejects PHP file disguised as image", () => {
    const buffer = new Uint8Array([0x3C, 0x3F, 0x70, 0x68, 0x70])
    expect(validateMagicBytes(buffer)).toBeNull()
  })

  it("rejects HTML file", () => {
    const buffer = new Uint8Array([0x3C, 0x68, 0x74, 0x6D, 0x6C])
    expect(validateMagicBytes(buffer)).toBeNull()
  })
})
