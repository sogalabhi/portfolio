// The one way the page lists a tech stack: a plain line, dot separated.
// Projects, experience and hackathons all use it, so none of them look
// different from the others.
export default function StackLine({ items, max, label = 'Stack', className = '' }) {
  if (!items?.length) return null
  const shown = max ? items.slice(0, max) : items
  return (
    <p aria-label={label} className={`font-mono text-[13px] leading-relaxed text-faint ${className}`}>
      {shown.join(' · ')}
    </p>
  )
}
