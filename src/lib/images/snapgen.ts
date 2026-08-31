const API_BASE = 'https://api.snapgen.ai/uapi/v1'
const DEFAULT_POLL_INTERVAL_MS = 3000
// ponytail: nano-banana-pro generation now regularly takes ~55-60s (measured live against
// the API on 2026-08-31) — 20 attempts (60s) was timing out real successes, not just genuine
// failures. Bumped for margin; revisit if snapgen gets consistently slower still.
const DEFAULT_MAX_ATTEMPTS = 40

type GenerateOpts = { prompt: string; aspect_ratio: '16:9' | '4:3' }
type PollConfig = { pollIntervalMs?: number; maxAttempts?: number }

type SnapgenRecord = {
  uuid: string
  status: number
  generate_result?: string | null
  generated_image?: { image_url?: string | null }[]
  error_message?: string | null
}

export async function generateImage(apiKey: string, opts: GenerateOpts, pollConfig: PollConfig = {}): Promise<string> {
  const form = new FormData()
  form.set('prompt', opts.prompt)
  form.set('model', 'nano-banana-pro')
  form.set('aspect_ratio', opts.aspect_ratio)
  form.set('style', 'Photorealistic')
  form.set('resolution', '1K')

  const res = await fetch(`${API_BASE}/generate_image`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: form,
  })
  if (!res.ok) throw new Error(`generate_image failed: ${res.status} ${await res.text()}`)
  const record = (await res.json()) as SnapgenRecord

  return pollUntilDone(apiKey, record, pollConfig)
}

async function pollUntilDone(apiKey: string, initial: SnapgenRecord, pollConfig: PollConfig): Promise<string> {
  const pollIntervalMs = pollConfig.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS
  const maxAttempts = pollConfig.maxAttempts ?? DEFAULT_MAX_ATTEMPTS

  let record = initial
  for (let attempt = 0; record.status !== 2 && attempt < maxAttempts; attempt++) {
    if (record.status === 3) throw new Error(`generation failed: ${record.error_message}`)
    await sleep(pollIntervalMs)
    const res = await fetch(`${API_BASE}/history/${record.uuid}`, { headers: { 'x-api-key': apiKey } })
    if (!res.ok) throw new Error(`history poll failed: ${res.status} ${await res.text()}`)
    record = (await res.json()) as SnapgenRecord
  }

  if (record.status === 3) throw new Error(`generation failed: ${record.error_message}`)
  if (record.status !== 2) throw new Error(`generation timed out: ${record.uuid}`)

  const url = record.generate_result ?? record.generated_image?.[0]?.image_url
  if (!url) throw new Error(`generation completed but no image URL was returned: ${record.uuid}`)
  return url
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
