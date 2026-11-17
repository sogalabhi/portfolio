import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import sections from '../../content/sections.json'
import fill from '../../lib/fill'

export default function CompactRoleList({ roles }) {
  const [open, setOpen] = useState(false)

  if (roles.length === 0) return null

  return (
    <div data-reveal className="border-b border-line py-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 font-mono text-xs uppercase tracking-[0.08em] text-clay print:hidden"
        aria-expanded={open}
      >
        <span className="print:hidden">{open ? sections.experience.hideRoles : fill(sections.experience.moreRoles, { count: roles.length })}</span>
        <ChevronDown
          size={16}
          className={`print:hidden transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <ul className={`mt-4 space-y-3 print:!block ${open ? '' : 'hidden'}`}>
        {roles.map((role, i) => (
          <li key={`${role.org}-${i}`} className="text-sm text-slate">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span>
                {role.title !== 'NEEDS_INPUT' ? `${role.title} · ` : ''}
                {role.org}
              </span>
              <span className="font-mono text-xs text-faint">{role.period}</span>
            </div>
            {role.note && role.note !== 'NEEDS_INPUT' && (
              <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-faint">{role.note}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
