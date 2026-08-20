import { filterNewKeywords } from '@/lib/topics/dedupe'

describe('filterNewKeywords', () => {
  it('drops candidates already present (case-insensitive) in existing keywords', () => {
    expect(
      filterNewKeywords(['Warna Cat Tropis', 'kitchen set minimalis'], ['Kitchen Set Minimalis'])
    ).toEqual(['Warna Cat Tropis'])
  })

  it('drops duplicates within the candidate batch itself', () => {
    expect(filterNewKeywords(['Storage Kecil', 'storage kecil', 'Storage Kecil'], [])).toEqual([
      'Storage Kecil',
    ])
  })
})
