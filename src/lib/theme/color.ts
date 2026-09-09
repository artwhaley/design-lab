type Rgb = { r: number; g: number; b: number }

function hexToRgb(hex: string): Rgb | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  const value = Number.parseInt(match[1], 16)
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

export function mixColors(from: string, toward: string, t: number): string {
  const a = hexToRgb(from) ?? { r: 255, g: 255, b: 255 }
  const b = hexToRgb(toward) ?? { r: 255, g: 255, b: 255 }
  const ratio = Math.max(0, Math.min(1, t))
  const channel = (x: number, y: number) => Math.round(x + (y - x) * ratio).toString(16).padStart(2, '0')
  return `#${channel(a.r, b.r)}${channel(a.g, b.g)}${channel(a.b, b.b)}`
}

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
