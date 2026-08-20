import { extractJsonObject } from '@/lib/cli/extractJson'

describe('extractJsonObject', () => {
  it('strips wrapper text before/after the JSON object', () => {
    expect(extractJsonObject('Here is the result:\n{"a":1}\nHope that helps!')).toBe('{"a":1}')
  })

  it('passes through clean JSON with no wrapper text', () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}')
  })

  it('throws when no JSON object is present', () => {
    expect(() => extractJsonObject('no json here')).toThrow('no JSON object found in CLI output')
  })
})
