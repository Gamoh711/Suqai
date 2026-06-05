const MAGIC_BYTES: { ext: string; sig: number[]; offset: number }[] = [
  { ext: "jpeg", sig: [0xFF, 0xD8, 0xFF], offset: 0 },
  { ext: "png", sig: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 },
  { ext: "gif", sig: [0x47, 0x49, 0x46, 0x38], offset: 0 },
  { ext: "webp", sig: [0x52, 0x49, 0x46, 0x46], offset: 0 },
]

export function validateMagicBytes(buffer: Uint8Array): string | null {
  for (const fmt of MAGIC_BYTES) {
    if (buffer.length < fmt.offset + fmt.sig.length) continue
    let match = true
    for (let i = 0; i < fmt.sig.length; i++) {
      if (buffer[fmt.offset + i] !== fmt.sig[i]) { match = false; break }
    }
    if (match) {
      if (fmt.ext === "webp") {
        if (buffer.length < 12) continue
        if (buffer[8] !== 0x57 || buffer[9] !== 0x45 || buffer[10] !== 0x42 || buffer[11] !== 0x50) continue
      }
      return fmt.ext
    }
  }
  return null
}
