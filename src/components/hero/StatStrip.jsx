// The hero sheet's title block: a label over each value, in ruled cells.
export default function StatStrip({ stats }) {
  return (
    <dl className="relative grid grid-cols-2 border-t border-ink/35 bg-paper lg:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`border-ink/20 px-5 py-4 sm:px-6 lg:first:pl-14 ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''}`}
        >
          <dt className="text-[13px] text-faint">{stat.label}</dt>
          <dd className="mt-1 font-display text-xl font-semibold text-ink md:text-2xl">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
