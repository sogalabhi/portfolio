import sections from '../../content/sections.json'

// Every section opens the same way: its heading over a rule. `id` is the
// section's key in sections.json.
export default function SectionHeader({ id, as: Heading = 'h2' }) {
  return (
    <header data-section-header className="border-b border-ink/25 pb-4">
      <Heading className="text-ink">{sections[id].heading}</Heading>
    </header>
  )
}
