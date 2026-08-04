import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import profile from '../../content/profile.json'
import projects from '../../content/projects.json'
import skills from '../../content/skills.json'
import experience from '../../content/experience.json'
import education from '../../content/education.json'
import achievements from '../../content/achievements.json'
import useGithubContributions from '../../hooks/useGithubContributions'

export const ZONE_TITLES = {
  spawn: 'Welcome',
  workshop: 'Workshop — Projects',
  garden: 'Garden — Skills',
  archive: 'Archive — Experience',
  shrine: 'Shrine — Achievements',
  tower: 'Tower — Contact',
}

function SpawnContent() {
  return (
    <div>
      <p className="text-[#F4EDE2]/85">{profile.tagline}</p>
      <div className="mt-5 grid grid-cols-2 gap-4">
        {profile.stats.map((s) => (
          <div key={s.label}>
            <p className="text-lg font-semibold text-[#F4EDE2]">{s.value}</p>
            <p className="text-xs text-[#F4EDE2]/60">{s.label}</p>
          </div>
        ))}
      </div>
      <a
        href={profile.links.resume}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-lg bg-[#F2A65A] px-4 py-2 text-sm font-semibold text-[#2B2438] transition-opacity duration-150 hover:opacity-90"
      >
        Download résumé
      </a>
    </div>
  )
}

function WorkshopContent() {
  const sorted = [...projects].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      {sorted.map((p) => (
        <article key={p.id} className="rounded-lg border border-[#F4EDE2]/15 bg-black/15 p-4">
          <h3 className="text-base font-semibold text-[#F4EDE2]">{p.title}</h3>
          <p className="mt-1 text-sm text-[#F4EDE2]/75">{p.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.stack.map((s, i) => (
              <span key={i} className="rounded-full bg-[#F4EDE2]/10 px-2 py-0.5 text-xs text-[#F4EDE2]">
                {s}
              </span>
            ))}
          </div>
          <div className="-my-2.5 mt-3 flex gap-4 text-sm">
            {p.links.github && (
              <a
                href={p.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-2.5 text-[#E86A6A] hover:underline"
              >
                GitHub
              </a>
            )}
            {(p.links.live || p.links.demo || p.links.playStore) && (
              <a
                href={p.links.live || p.links.demo || p.links.playStore}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-2.5 text-[#E86A6A] hover:underline"
              >
                Live
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

const CROP_COLORS = ['bg-[#5A4632]', 'bg-[#3E7A44]/30', 'bg-[#3E7A44]/55', 'bg-[#3E7A44]/80', 'bg-[#3E7A44]']

function GardenContent() {
  const heatmap = useGithubContributions()
  const scrollRef = useRef(null)

  // scrolled to the most recent weeks by default — on a narrow sheet the
  // heatmap overflows and oldest-first would otherwise open on old history
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [heatmap.status])

  return (
    <div>
      <div className="space-y-4">
        {skills.map((group) => (
          <div key={group.group}>
            <p className="text-xs uppercase tracking-wide text-[#F4EDE2]/50">{group.group}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.skills.map((s, i) => (
                <span key={i} className="rounded-full bg-[#3E7A44]/35 px-2.5 py-1 text-xs text-[#F4EDE2]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold text-[#F4EDE2]">The crop field</h3>
      {heatmap.status === 'ready' ? (
        <div>
          <div
            ref={scrollRef}
            className="flex gap-0.5 overflow-x-auto pb-2"
            role="img"
            aria-label={`${heatmap.total} contributions in the last year, ${heatmap.streak}-day streak`}
          >
            {heatmap.weeks.map((week, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.count} on ${day.date}`}
                    className={`h-2 w-2 shrink-0 rounded-[1px] ${CROP_COLORS[day.level] ?? CROP_COLORS[0]}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-xs text-[#F4EDE2]/50">
            {heatmap.total.toLocaleString()} plots tilled · {heatmap.streak}-day streak
          </p>
        </div>
      ) : (
        <p className="text-sm text-[#F4EDE2]/50">The field is resting.</p>
      )}
    </div>
  )
}

function ArchiveContent() {
  return (
    <div className="space-y-5">
      {experience.tier1.map((exp) => (
        <div key={exp.org} className="border-l-2 border-[#F4EDE2]/20 pl-3">
          <p className="text-sm font-semibold text-[#F4EDE2]">{exp.org}</p>
          <p className="text-xs text-[#F4EDE2]/55">{exp.period}</p>
        </div>
      ))}
      {education.map((edu) => (
        <div key={edu.institution} className="border-l-2 border-[#F4EDE2]/20 pl-3">
          <p className="text-sm font-semibold text-[#F4EDE2]">{edu.institution}</p>
          <p className="text-xs text-[#F4EDE2]/55">{edu.period}</p>
        </div>
      ))}
    </div>
  )
}

function ShrineContent() {
  return (
    <div className="space-y-3">
      <p className="mb-2 text-xs text-[#F2A65A]">{achievements.summary}</p>
      {achievements.hackathons.map((h) => (
        <div key={h.event} className="rounded-lg bg-black/15 p-3">
          <p className="text-sm font-semibold text-[#F4EDE2]">{h.event}</p>
          <p className="text-xs text-[#F2A65A]">{h.result}</p>
        </div>
      ))}
    </div>
  )
}

function TowerContent() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#F4EDE2]/70">Sending a signal to —</p>
      <a
        href={`mailto:${profile.email}`}
        className="-my-2.5 inline-block py-2.5 text-lg font-semibold text-[#E86A6A] hover:underline"
      >
        {profile.email}
      </a>
      <div className="-my-2.5 flex gap-5 text-sm">
        <a
          href={profile.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block py-2.5 text-[#F4EDE2]/80 hover:text-[#F2A65A]"
        >
          GitHub
        </a>
        <a
          href={profile.links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block py-2.5 text-[#F4EDE2]/80 hover:text-[#F2A65A]"
        >
          LinkedIn
        </a>
      </div>
      <p className="text-xs text-[#F4EDE2]/50">{profile.location}</p>
    </div>
  )
}

export const CONTENT_BY_ZONE = {
  spawn: SpawnContent,
  workshop: WorkshopContent,
  garden: GardenContent,
  archive: ArchiveContent,
  shrine: ShrineContent,
  tower: TowerContent,
}

export default function ZonePanel({ zoneId, onClose }) {
  const Content = CONTENT_BY_ZONE[zoneId]
  const title = ZONE_TITLES[zoneId] ?? zoneId

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end bg-black/30" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#2B2438] p-6 shadow-2xl sm:my-auto sm:h-auto sm:max-h-[80vh] sm:rounded-2xl sm:border sm:border-[#F4EDE2]/10"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm text-[#F4EDE2]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="cursor-pointer text-[#F4EDE2]/70 transition-colors duration-150 hover:text-[#F2A65A]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 text-base leading-relaxed">
          {Content ? <Content /> : <p className="text-[#F4EDE2]/70">Coming soon.</p>}
        </div>
      </div>
    </div>
  )
}
