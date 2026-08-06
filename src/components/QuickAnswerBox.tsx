export default function QuickAnswerBox({ text }: { text: string }) {
  return (
    <p className="border-l-[3px] border-accent bg-bg-section p-4 font-sans text-base leading-relaxed text-bg-dark">
      {text}
    </p>
  )
}
