export function trackWaClick(source: string) {
  fetch('/api/wa-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  }).catch(() => {})
}
