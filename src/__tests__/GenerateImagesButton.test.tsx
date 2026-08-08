import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GenerateImagesButton from '@/components/admin/GenerateImagesButton'
import { splitSections } from '@/lib/images/sections'

const TWO_SECTION_BODY = `Intro paragraph, not a section.

## Tip One

This is the first tip with plenty of content, well over forty characters long.

## Tip Two

This is the second tip, also with plenty of content past the forty char mark.`

describe('GenerateImagesButton', () => {
  it('is disabled when the body has no qualifying sections', () => {
    render(<GenerateImagesButton body="Just a short intro, no headings." onBodyChange={jest.fn()} onGenerate={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Generate Images' })).toBeDisabled()
  })

  it('generates one image per qualifying section and inserts both correctly', async () => {
    const onGenerate = jest
      .fn()
      .mockResolvedValueOnce('https://x/1.jpg')
      .mockResolvedValueOnce('https://x/2.jpg')
    const onBodyChange = jest.fn()

    render(<GenerateImagesButton body={TWO_SECTION_BODY} onBodyChange={onBodyChange} onGenerate={onGenerate} />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate Images' }))

    await waitFor(() => expect(onGenerate).toHaveBeenCalledTimes(2))
    expect(onGenerate).toHaveBeenNthCalledWith(1, 'Tip One — warm tropical interior, photorealistic')
    expect(onGenerate).toHaveBeenNthCalledWith(2, 'Tip Two — warm tropical interior, photorealistic')

    const finalBody = onBodyChange.mock.calls[onBodyChange.mock.calls.length - 1][0]
    const reparsed = splitSections(finalBody)
    expect(reparsed).toHaveLength(2)
    expect(reparsed[0].hasImage).toBe(true)
    expect(reparsed[1].hasImage).toBe(true)
  })

  it('resolves each section by position, not heading text, so duplicate headings do not collide', async () => {
    const duplicateBody = `## Tip One\n\nSame long enough content repeated in both sections here easily.\n\n## Tip One\n\nDifferent long enough content in the second section, also past forty chars.`
    const onGenerate = jest
      .fn()
      .mockResolvedValueOnce('https://x/1.jpg')
      .mockResolvedValueOnce('https://x/2.jpg')
    const onBodyChange = jest.fn()

    render(<GenerateImagesButton body={duplicateBody} onBodyChange={onBodyChange} onGenerate={onGenerate} />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate Images' }))

    await waitFor(() => expect(onGenerate).toHaveBeenCalledTimes(2))

    const finalBody = onBodyChange.mock.calls[onBodyChange.mock.calls.length - 1][0]
    const reparsed = splitSections(finalBody)
    expect(reparsed).toHaveLength(2)
    expect(reparsed[0].hasImage).toBe(true)
    expect(reparsed[1].hasImage).toBe(true)
    // each image landed in its own section's content, not both stacked on the first
    expect(reparsed[0].content).not.toContain('https://x/2.jpg')
    expect(reparsed[1].content).not.toContain('https://x/1.jpg')
  })

  it('keeps a successful section when another section fails, and reports the error', async () => {
    const onGenerate = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('https://x/2.jpg')
    const onBodyChange = jest.fn()

    render(<GenerateImagesButton body={TWO_SECTION_BODY} onBodyChange={onBodyChange} onGenerate={onGenerate} />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate Images' }))

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(1))
    expect(screen.getByRole('alert')).toHaveTextContent('Tip One')

    const finalBody = onBodyChange.mock.calls[onBodyChange.mock.calls.length - 1][0]
    const reparsed = splitSections(finalBody)
    expect(reparsed[0].hasImage).toBe(false)
    expect(reparsed[1].hasImage).toBe(true)
  })
})
