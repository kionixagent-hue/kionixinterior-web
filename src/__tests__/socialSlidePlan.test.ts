import { buildSlidePlan } from '@/lib/social/slidePlan'

describe('buildSlidePlan', () => {
  it('starts with the cover slide using the article title and cover image', () => {
    const slides = buildSlidePlan({
      title: 'Judul Artikel',
      coverImageUrl: '/uploads/cover.jpg',
      body: '## Poin Satu\nIsi poin satu yang cukup panjang untuk lolos filter.\n\n![Poin Satu](/uploads/s1.jpg)',
    })

    expect(slides[0]).toEqual({ kind: 'cover', imageUrl: '/uploads/cover.jpg', text: 'Judul Artikel' })
  })

  it('adds one point slide per section that already has an image', () => {
    const slides = buildSlidePlan({
      title: 'Judul',
      coverImageUrl: '/uploads/cover.jpg',
      body: [
        '## Poin Satu',
        'Isi poin satu yang cukup panjang untuk lolos filter.',
        '',
        '![Poin Satu](/uploads/s1.jpg)',
        '## Poin Dua',
        'Isi poin dua yang cukup panjang untuk lolos filter.',
        '',
        '![Poin Dua](/uploads/s2.jpg)',
      ].join('\n'),
    })

    expect(slides).toHaveLength(3)
    expect(slides[1]).toEqual({ kind: 'point', imageUrl: '/uploads/s1.jpg', text: 'Poin Satu' })
    expect(slides[2]).toEqual({ kind: 'point', imageUrl: '/uploads/s2.jpg', text: 'Poin Dua' })
  })

  it('skips sections that have no image yet', () => {
    const slides = buildSlidePlan({
      title: 'Judul',
      coverImageUrl: '/uploads/cover.jpg',
      body: '## Tanpa Gambar\nIsi section ini panjang tapi belum ada gambar sama sekali di sini.',
    })

    expect(slides).toHaveLength(1)
    expect(slides[0].kind).toBe('cover')
  })

  it('caps point slides at 5 even when more sections have images', () => {
    const sections = Array.from({ length: 7 }, (_, i) =>
      `## Poin ${i + 1}\nIsi poin ${i + 1} yang cukup panjang untuk lolos filter konten.\n\n![Poin ${i + 1}](/uploads/s${i + 1}.jpg)`
    ).join('\n')

    const slides = buildSlidePlan({ title: 'Judul', coverImageUrl: '/uploads/cover.jpg', body: sections })

    expect(slides).toHaveLength(6) // 1 cover + 5 point (capped)
    expect(slides.filter((s) => s.kind === 'point')).toHaveLength(5)
  })
})
