const CTA_LINE = 'Mau konsultasi gratis interior rumah/kantor di Batam? Chat kami via WhatsApp (link di bio) 📲'
const HASHTAGS = '#interiorbatam #desaininteriorbatam #kionixinterior #renovasirumahbatam'
const MAX_POINTS = 3

export function buildCaption(input: { hook: string; points: string[] }): string {
  const points = input.points.slice(0, MAX_POINTS).map((p) => `✨ ${p}`)
  return [input.hook, '', ...points, '', CTA_LINE, '', HASHTAGS].join('\n')
}
