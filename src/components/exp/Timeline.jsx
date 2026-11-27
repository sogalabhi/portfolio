import useGsapReveal from '../../hooks/useGsapReveal'
import Logo from '../misc/Logo'
import StackLine from '../misc/StackLine'
import experience from '../../content/experience.json'
import education from '../../content/education.json'
import sections from '../../content/sections.json'

const copy = sections.experience

// Laid out like LinkedIn: one line down the left, each organisation's logo
// sitting on it, and a dot on the line for every role held there, newest
// first. The gutter is 44px wide and the line runs down its middle.
const GUTTER = 'grid grid-cols-[44px_minmax(0,1fr)] gap-x-5'

// the stretch of the line beside one entry: it starts at the first logo and
// stops at the last one, so it never trails off past either end
function Rail({ first, last }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute left-[21.5px] border-l border-ink/25 ${first ? 'top-[22px]' : 'top-0'} ${last ? 'h-[22px]' : 'bottom-0'}`}
    />
  )
}

function Marker({ logo, alt }) {
  if (logo) return <Logo src={logo} alt={alt} />
  return (
    <span className="relative z-10 mx-auto mt-2 block h-3 w-3 border border-ink/50 bg-paper" aria-hidden="true" />
  )
}

function Period({ children }) {
  return <span className="shrink-0 font-mono text-[13px] text-faint">{children}</span>
}

function Job({ job, first, last }) {
  const multi = job.roles.length > 1
  const detailed = Boolean(job.bullets)

  return (
    <li data-reveal className={`relative ${GUTTER} ${last ? '' : detailed ? 'pb-12' : 'pb-8'}`}>
      <Rail first={first} last={last} />
      <div>
        <Marker logo={job.logo} alt={job.org} />
      </div>

      <div className={job.logo ? 'pt-1' : ''}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 className={detailed ? 'text-xl text-ink' : 'text-lg text-ink'}>{job.org}</h3>
          <Period>{job.period}</Period>
        </div>

        {multi ? (
          <ol className="mt-3 space-y-2">
            {job.roles.map((role, i) => (
              <li key={role.period} className="relative flex flex-wrap items-baseline justify-between gap-x-4">
                {/* the role's dot, back on the line in the gutter */}
                <span
                  aria-hidden="true"
                  className={`absolute -left-[46px] top-[0.55em] h-[9px] w-[9px] rounded-full border ${
                    i === 0 && job.period.endsWith('Present') ? 'border-clay bg-clay' : 'border-ink/50 bg-paper'
                  }`}
                />
                <span className="text-ink">{role.title}</span>
                <Period>{role.period}</Period>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-0.5 text-slate">{job.roles[0].title}</p>
        )}

        {detailed && (
          <ul className="mt-4 space-y-2 text-slate">
            {job.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2.5">
                <span aria-hidden="true">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}
        <StackLine items={job.stack} className="mt-3" />
      </div>
    </li>
  )
}

export default function Timeline() {
  const revealRef = useGsapReveal({ batch: true, stagger: 0.06 })
  const { jobs, clubs } = experience

  return (
    <div ref={revealRef} className="mt-10">
      <ol>
        {jobs.map((job, i) => (
          <Job key={job.org} job={job} first={i === 0} last={i === jobs.length - 1} />
        ))}
      </ol>

      <h3 className="mt-16 text-xl text-ink">{copy.clubsHeading}</h3>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {clubs.map((club) => (
          <li key={club.org} data-reveal className="py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="text-ink">
                {club.org}
                <span className="text-slate">, {club.title}</span>
              </span>
              <Period>{club.period}</Period>
            </div>
            {club.note && <p className="mt-1 max-w-[62ch] text-[15px] leading-relaxed text-slate">{club.note}</p>}
          </li>
        ))}
      </ul>

      <h3 className="mt-16 text-xl text-ink">{copy.educationHeading}</h3>
      <ul className="mt-5">
        {education.map((entry) => (
          <li key={entry.institution} data-reveal className={GUTTER}>
            <div>{entry.logo && <Logo src={entry.logo} alt={entry.institution} />}</div>
            <div className="pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="font-display text-lg font-semibold text-ink">{entry.institution}</span>
                <Period>{entry.period}</Period>
              </div>
              <ul className="mt-1 text-slate">
                {entry.degrees.map((d) => (
                  <li key={d.label}>
                    {d.label}
                    <span className="text-faint"> · {d.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
