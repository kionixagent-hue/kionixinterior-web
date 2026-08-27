import {
  splitSections,
  qualifyingSections,
  insertImageAfterSection,
  buildSectionImagePrompt,
  buildCoverPrompt,
} from '@/lib/images/sections'

const TWO_SECTION_BODY = `Intro paragraph, not a section.

## Tip One

This is the first tip with plenty of content, well over forty characters long.

## Tip Two

This is the second tip, also with plenty of content past the forty char mark.`

describe('splitSections', () => {
  it('returns one entry per H2 heading, skipping the intro', () => {
    const sections = splitSections(TWO_SECTION_BODY)
    expect(sections).toHaveLength(2)
    expect(sections[0].heading).toBe('Tip One')
    expect(sections[1].heading).toBe('Tip Two')
    expect(sections[0].hasImage).toBe(false)
    expect(sections[1].hasImage).toBe(false)
  })

  it('detects a section that already has a markdown image', () => {
    const body = `## Tip One\n\nSome content here that is long enough to qualify easily.\n\n![Tip One](https://x/1.jpg)`
    const sections = splitSections(body)
    expect(sections[0].hasImage).toBe(true)
  })
})

describe('qualifyingSections', () => {
  it('filters out sections with short content', () => {
    const body = `## Tip One\n\nShort.\n\n## Tip Two\n\nThis is long enough content to qualify for image generation.`
    const sections = splitSections(body)
    const qualifying = qualifyingSections(sections)
    expect(qualifying).toHaveLength(1)
    expect(qualifying[0].heading).toBe('Tip Two')
  })

  it('filters out sections that already have an image', () => {
    const body = `## Tip One\n\nLong enough content here to qualify for image generation easily.\n\n![Tip One](https://x/1.jpg)\n\n## Tip Two\n\nAlso long enough content here to qualify for image generation.`
    const sections = splitSections(body)
    const qualifying = qualifyingSections(sections)
    expect(qualifying).toHaveLength(1)
    expect(qualifying[0].heading).toBe('Tip Two')
  })
})

describe('insertImageAfterSection', () => {
  it('inserts the image into the target section without touching others (round-trip)', () => {
    const sections = splitSections(TWO_SECTION_BODY)
    const updated = insertImageAfterSection(TWO_SECTION_BODY, sections[0], '![Tip One](https://x/1.jpg)')

    const reparsed = splitSections(updated)
    expect(reparsed).toHaveLength(2)
    expect(reparsed[0].hasImage).toBe(true)
    expect(reparsed[1].heading).toBe(sections[1].heading)
    expect(reparsed[1].content).toBe(sections[1].content)
  })

  it('appends correctly when the target is the last section', () => {
    const sections = splitSections(TWO_SECTION_BODY)
    const updated = insertImageAfterSection(TWO_SECTION_BODY, sections[1], '![Tip Two](https://x/2.jpg)')

    const reparsed = splitSections(updated)
    expect(reparsed).toHaveLength(2)
    expect(reparsed[1].hasImage).toBe(true)
  })

  it('only modifies the targeted section when two sections have identical raw text', () => {
    const duplicateBody = `## Tip One\n\nSame long enough content repeated in both sections here.\n\n## Tip One\n\nSame long enough content repeated in both sections here.`
    const sections = splitSections(duplicateBody)
    expect(sections).toHaveLength(2)

    const updated = insertImageAfterSection(duplicateBody, sections[1], '![Tip One](https://x/2.jpg)')
    const reparsed = splitSections(updated)

    expect(reparsed[0].hasImage).toBe(false)
    expect(reparsed[1].hasImage).toBe(true)
  })
})

describe('buildSectionImagePrompt', () => {
  it('builds a brand-styled prompt from the heading', () => {
    expect(buildSectionImagePrompt('Tip One')).toBe('Tip One — modern minimalist interior, photorealistic')
  })
})

describe('buildCoverPrompt', () => {
  it('combines title and quick answer', () => {
    expect(buildCoverPrompt('My Title', 'A short summary.')).toBe('My Title. A short summary.')
  })

  it('truncates to 300 chars', () => {
    const longTitle = 'T'.repeat(200)
    const longAnswer = 'A'.repeat(200)
    const prompt = buildCoverPrompt(longTitle, longAnswer)
    expect(prompt.length).toBe(300)
  })
})
