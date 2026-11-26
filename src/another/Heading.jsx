export default function Heading({ id, title, note, children }) {
  return (
    <section id={id} className="scroll-mt-16 py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b-2 border-ink pb-3">
          <h2 className="text-ink">{title}</h2>
          {note && <p className="max-w-[34ch] pb-1 text-sm text-slate">{note}</p>}
        </header>
        {children}
      </div>
    </section>
  )
}
