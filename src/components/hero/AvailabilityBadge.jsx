export default function AvailabilityBadge({ text }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-moss/10 px-4 py-1.5 text-sm font-medium text-moss">
      <span className="h-1.5 w-1.5 rounded-full bg-moss" aria-hidden="true" />
      {text}
    </span>
  )
}
