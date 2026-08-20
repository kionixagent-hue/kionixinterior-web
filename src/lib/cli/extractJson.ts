export function extractJsonObject(raw: string): string {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) {
    throw new Error('no JSON object found in CLI output')
  }
  return raw.slice(start, end + 1)
}
