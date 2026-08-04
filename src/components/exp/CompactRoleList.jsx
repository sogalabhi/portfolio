import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function CompactRoleList({ roles }) {
  const [open, setOpen] = useState(false)

  if (roles.length === 0) return null

  return (
    <div data-reveal className="border-b border-line py-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-clay print:hidden"
        aria-expanded={open}
      >
        <span className="print:hidden">{open ? 'Hide' : `Show ${roles.length} more roles`}</span>
        <ChevronDown
          size={16}
          className={`print:hidden transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <ul className={`mt-4 space-y-2 print:!block ${open ? '' : 'hidden'}`}>
        {roles.map((role, i) => (
          <li
            key={`${role.org}-${i}`}
            className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm text-slate"
          >
            <span>
              {role.title !== 'NEEDS_INPUT' ? `${role.title} · ` : ''}
              {role.org}
            </span>
            <span className="font-mono text-xs text-faint">{role.period}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
