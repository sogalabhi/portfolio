import SectionIcon from './SectionIcon'
import sections from '../../content/sections.json'

// Each section is a sheet of the drawing set the hero starts, so each opens
// the same way: a mono sheet reference (SHEET 02 · A - WORKSHOP; the letter
// is the one on the hero's site plan, which makes the plan the page's index),
// the building from /world and the heading, an optional note set right, and
// a rule. `id` is the section's key in sections.json.
export default function SectionHeader({ id, as: Heading = 'h2' }) {
  const s = sections[id]
  const ref = [s.tag, s.zoneName].filter(Boolean).join(': ')

  return (
    <header data-section-header className="border-b border-ink/25 pb-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
        {sections.sheetLabel} {s.sheet}
        <span className="mx-2 text-line" aria-hidden="true">
          ·
        </span>
        {ref}
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex items-center gap-4">
          <SectionIcon src={`/world/sprites/${s.zone}.png`} />
          <Heading className="text-ink">{s.heading}</Heading>
        </div>
        {s.note && (
          <p className="pb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-slate">{s.note}</p>
        )}
      </div>
    </header>
  )
}
