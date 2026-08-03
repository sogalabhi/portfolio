export default function StatStrip({ stats }) {
  return (
    <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:flex sm:flex-wrap sm:gap-x-12">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dd className="font-display text-2xl font-semibold text-ink md:text-3xl">
            {stat.value}
          </dd>
          <dt className="mt-1 text-sm text-faint">{stat.label}</dt>
        </div>
      ))}
    </dl>
  )
}
