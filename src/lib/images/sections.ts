const MIN_CONTENT_LENGTH = 40
const IMAGE_MARKDOWN_RE = /!\[[^\]]*\]\([^)]*\)/
const COVER_PROMPT_MAX_LENGTH = 300

export type Section = { heading: string; content: string; raw: string; start: number; hasImage: boolean }

export function splitSections(body: string): Section[] {
  const sections: Section[] = []
  let offset = 0
  for (const chunk of body.split(/\n(?=## )/)) {
    if (chunk.startsWith('## ')) {
      const heading = chunk.match(/^##\s+(.+)/)?.[1].trim() ?? ''
      const content = chunk.replace(/^##.*\n?/, '').trim()
      sections.push({ heading, content, raw: chunk, start: offset, hasImage: IMAGE_MARKDOWN_RE.test(content) })
    }
    offset += chunk.length + 1 // +1 for the '\n' the split consumed as delimiter
  }
  return sections
}

export function qualifyingSections(sections: Section[]): Section[] {
  return sections.filter((s) => !s.hasImage && s.content.length >= MIN_CONTENT_LENGTH)
}

// Positional replace by `section.start` (not a text-based `String.replace`), so two
// sections with identical raw text (duplicate heading+content) never collide.
export function insertImageAfterSection(body: string, section: Section, imageMarkdown: string): string {
  const end = section.start + section.raw.length
  const updatedRaw = `${section.raw.trimEnd()}\n\n${imageMarkdown}`
  return body.slice(0, section.start) + updatedRaw + body.slice(end)
}

export function buildSectionImagePrompt(heading: string): string {
  return `${heading} — warm tropical interior, photorealistic`
}

export function buildCoverPrompt(title: string, quickAnswer: string): string {
  return `${title}. ${quickAnswer}`.slice(0, COVER_PROMPT_MAX_LENGTH)
}
