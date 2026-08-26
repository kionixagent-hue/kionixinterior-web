import sharp from 'sharp'
import { compositeSlideImage } from '@/lib/social/slideImage'

async function makeSourceImage(): Promise<Buffer> {
  return sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 100, g: 120, b: 130 } } })
    .jpeg()
    .toBuffer()
}

describe('compositeSlideImage', () => {
  it('outputs a 1080x1350 JPEG for a cover slide', async () => {
    const source = await makeSourceImage()
    const result = await compositeSlideImage({ imageBuffer: source, text: 'Judul Artikel', variant: 'cover' })

    const meta = await sharp(result).metadata()
    expect(meta.width).toBe(1080)
    expect(meta.height).toBe(1350)
    expect(meta.format).toBe('jpeg')
  })

  it('outputs a 1080x1350 JPEG for a point slide', async () => {
    const source = await makeSourceImage()
    const result = await compositeSlideImage({ imageBuffer: source, text: 'Poin Satu', variant: 'point' })

    const meta = await sharp(result).metadata()
    expect(meta.width).toBe(1080)
    expect(meta.height).toBe(1350)
    expect(meta.format).toBe('jpeg')
  })
})
