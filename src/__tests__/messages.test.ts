import id from '../messages/id.json'
import en from '../messages/en.json'
import zh from '../messages/zh.json'

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj).flatMap(([k, v]) =>
    flattenKeys(v, prefix ? `${prefix}.${k}` : k)
  )
}

test('all three locales define the exact same set of message keys', () => {
  const idKeys = flattenKeys(id).sort()
  const enKeys = flattenKeys(en).sort()
  const zhKeys = flattenKeys(zh).sort()
  expect(enKeys).toEqual(idKeys)
  expect(zhKeys).toEqual(idKeys)
})
