import useGsapReveal from '../../hooks/useGsapReveal'
import about from '../../content/about.json'

// Sheet 05: the portrait as a figure plate on the left (the 32x48 pixel
// portrait at 5x, blinking now and then - .portrait-blink in index.css), the
// bio on the right, then numbered general notes, the way a drawing lists them.
export default function About() {
  const revealRef = useGsapReveal({ stagger: 0.06 })
  const { portrait } = about

  return (
    <div ref={revealRef} className="mt-10 grid gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-14">
      <figure data-reveal className="mx-auto w-fit md:mx-0">
        <div className="plate-grid relative flex items-end justify-center border border-ink/30 bg-paper px-12 pb-6 pt-10">
          <div
            role="img"
            aria-label={portrait.alt}
            className="portrait-blink"
            style={{ backgroundImage: `url(${portrait.src})` }}
          />
          {/* the ground line he stands on */}
          <span className="absolute inset-x-6 bottom-6 border-t border-ink/40" aria-hidden="true" />
        </div>
        <figcaption className="mt-3 max-w-[16rem] font-mono text-[11px] uppercase leading-relaxed tracking-[0.06em] text-slate">
          <span className="text-ink">{portrait.figure}</span>
          <span className="mx-2 text-faint" aria-hidden="true">
            ·
          </span>
          {portrait.caption}
        </figcaption>
      </figure>

      <div>
        <div className="max-w-[62ch] space-y-5 text-lg leading-relaxed text-slate">
          {about.bio.map((paragraph, i) => (
            <p key={i} data-reveal className={i === 0 ? 'text-ink' : ''}>
              {paragraph}
            </p>
          ))}
        </div>

        <div data-reveal className="mt-10 max-w-[62ch]">
          <h3 className="border-b border-ink/25 pb-2 font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-slate">
            {about.notesHeading}
          </h3>
          <ol className="divide-y divide-line">
            {about.notes.map((note, i) => (
              <li key={i} className="grid grid-cols-[2rem_1fr] gap-2 py-3 text-[15px] leading-relaxed text-ink">
                <span className="font-mono text-sm text-clay">{i + 1}.</span>
                <span>{note}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
