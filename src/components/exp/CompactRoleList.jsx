import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function CompactRoleList({ roles }) {
  const [open, setOpen] = useState(false)

  if (roles.length === 0) return null

  return (
    <div className="relative pl-8">
      <span className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-line" aria-hidden="true" />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-clay"
        aria-expanded={open}
      >
        {open ? 'Hide' : `Show ${roles.length} more roles`}
        <ChevronDown
          size={16}
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul className="mt-4 space-y-2">
          {roles.map((role, i) => (
            <li
              key={`${role.org}-${i}`}
              className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm text-slate"
            >
              <span>
                {role.title !== 'NEEDS_INPUT' ? `${role.title} · ` : ''}
                {role.org}
              </span>
              <span className="text-faint">{role.period}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
