import sharp from 'sharp'

const WIDTH = 1080
const HEIGHT = 1350
const ACCENT = '#26A1B0'
const TEXT_ON_DARK = '#FFFFFF'

// ponytail: naive character-count word-wrap (no real font-metrics measurement) — good
// enough for short social captions at fixed font sizes; revisit with a text-measuring
// approach if headings start overflowing the frame in practice.
function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
    if (lines.length === maxLines) break
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildOverlaySvg(text: string, variant: 'cover' | 'point'): string {
  const fontSize = variant === 'cover' ? 64 : 48
  const maxChars = variant === 'cover' ? 18 : 22
  const lines = wrapText(text, maxChars, 3)
  const lineHeight = fontSize * 1.25
  const bottomPadding = 110
  const startY = HEIGHT - bottomPadding - (lines.length - 1) * lineHeight

  const tspans = lines
    .map((line, i) => `<tspan x="72" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('')

  const accentBar =
    variant === 'point'
      ? `<rect x="72" y="${startY - fontSize - 24}" width="96" height="6" fill="${ACCENT}" />`
      : ''

  return `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="55%" stop-color="#0C1A1D" stop-opacity="0" />
          <stop offset="100%" stop-color="#0C1A1D" stop-opacity="0.85" />
        </linearGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scrim)" />
      ${accentBar}
      <text font-family="sans-serif" font-weight="700" font-size="${fontSize}" fill="${TEXT_ON_DARK}">${tspans}</text>
    </svg>
  `
}

export async function compositeSlideImage(input: {
  imageBuffer: Buffer
  text: string
  variant: 'cover' | 'point'
}): Promise<Buffer> {
  const resized = await sharp(input.imageBuffer).resize(WIDTH, HEIGHT, { fit: 'cover' }).toBuffer()
  const overlay = Buffer.from(buildOverlaySvg(input.text, input.variant))

  return sharp(resized)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 85 })
    .toBuffer()
}
