import id from '../../src/messages/id.json'

type Dict = { [key: string]: Dict | string | string[] }

function lookup(dict: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Dict)) {
      return (acc as Dict)[key]
    }
    return undefined
  }, dict)
}

export async function getTranslations(namespace?: string) {
  const dict = namespace ? (lookup(id as Dict, namespace) as Dict) : (id as Dict)

  return (key: string, values?: Record<string, string>): string => {
    const raw = lookup(dict, key)
    if (typeof raw !== 'string') return String(raw)
    if (!values) return raw
    return Object.entries(values).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, v),
      raw
    )
  }
}

export async function getMessages() {
  return id
}

export function setRequestLocale() {
  // ponytail: no-op in tests, real locale scoping happens via next-intl middleware at runtime
}
