export function readableTextColor(background: string): string {
  const match = /^#([0-9a-f]{6})$/i.exec(background.trim())
  if (!match) return '#1A1A1A'
  const value = Number.parseInt(match[1], 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance < 0.56 ? '#FFFFFF' : '#1A1A1A'
}
