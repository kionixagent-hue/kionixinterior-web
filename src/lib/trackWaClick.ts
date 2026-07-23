export function trackWaClick(source: string, lead: { name: string; phone: string }) {
  fetch('/api/wa-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, ...lead }),
  }).catch(() => {})
}
