import { buildCaption } from '@/lib/social/caption'

describe('buildCaption', () => {
  const CTA_LINE = 'Mau konsultasi gratis interior rumah/kantor di Batam? Chat kami via WhatsApp (link di bio) 📲'
  const HASHTAGS = '#interiorbatam #desaininteriorbatam #kionixinterior #renovasirumahbatam'

  it('starts with the hook and lists each point with a sparkle bullet', () => {
    const result = buildCaption({
      hook: 'Kenapa nuansa hangat jadi tren?',
      points: ['Poin A', 'Poin B'],
    })

    expect(result.startsWith('Kenapa nuansa hangat jadi tren?')).toBe(true)
    expect(result).toContain('✨ Poin A')
    expect(result).toContain('✨ Poin B')
    expect(result).toContain(CTA_LINE)
    expect(result.trim().endsWith(HASHTAGS)).toBe(true)
  })

  it('caps points at 3 even when more are given', () => {
    const result = buildCaption({
      hook: 'Hook',
      points: ['A', 'B', 'C', 'D', 'E'],
    })

    expect(result).toContain('✨ A')
    expect(result).toContain('✨ C')
    expect(result).not.toContain('✨ D')
    expect(result).not.toContain('✨ E')
  })

  it('handles a single point', () => {
    const result = buildCaption({ hook: 'Hook satu poin', points: ['Satu'] })
    expect(result).toContain('✨ Satu')
  })
})
