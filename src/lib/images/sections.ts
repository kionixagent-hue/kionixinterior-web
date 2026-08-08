const MIN_CONTENT_LENGTH = 40
const IMAGE_MARKDOWN_RE = /!\[[^\]]*\]\([^)]*\)/
const COVER_PROMPT_MAX_LENGTH = 300

export type Section = { heading: string; content: string; raw: string; hasImage: boolean }

export function splitSections(body: string): Section[] {
  return body
    .split(/\n(?=## )/)
    .filter((chunk) => chunk.startsWith('## '))
    .map((raw) => {
      const heading = raw.match(/^##\s+(.+)/)?.[1].trim() ?? ''
      const content = raw.replace(/^##.*\n?/, '').trim()
      return { heading, content, raw, hasImage: IMAGE_MARKDOWN_RE.test(content) }
    })
}

export function qualifyingSections(sections: Section[]): Section[] {
  return sections.filter((s) => !s.hasImage && s.content.length >= MIN_CONTENT_LENGTH)
}

export function insertImageAfterSection(body: string, section: Section, imageMarkdown: string): string {
  const updatedRaw = `${section.raw.trimEnd()}\n\n${imageMarkdown}`
  return body.replace(section.raw, updatedRaw)
}

export function buildSectionImagePrompt(heading: string): string {
  return `${heading} — warm tropical interior, photorealistic`
}

export function buildCoverPrompt(title: string, quickAnswer: string): string {
  return `${title}. ${quickAnswer}`.slice(0, COVER_PROMPT_MAX_LENGTH)
}
