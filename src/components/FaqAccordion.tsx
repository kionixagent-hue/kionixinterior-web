export default function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col divide-y divide-border border-t border-border">
      {items.map((item) => (
        <details key={item.q} className="group py-4">
          <summary className="cursor-pointer list-none font-sans font-semibold text-bg-dark marker:content-none">
            {item.q}
          </summary>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  )
}
