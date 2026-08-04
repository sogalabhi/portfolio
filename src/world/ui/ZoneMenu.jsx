import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { bus, EVENTS } from '../bus'

// The touch escape hatch - every zone reachable in two taps without walking.
// Visible from first load, not hidden behind an idle timer or an exploration
// reward: desktop gets the same access via the terminal's `cd`, this is its
// touch equivalent. Excludes 'spawn' - you already start there.
const DESTINATIONS = [
  { id: 'workshop', title: 'Workshop', blurb: 'Projects' },
  { id: 'garden', title: 'Garden', blurb: 'Skills & activity' },
  { id: 'archive', title: 'Archive', blurb: 'Experience' },
  { id: 'shrine', title: 'Shrine', blurb: 'Hackathons' },
  { id: 'tower', title: 'Tower', blurb: 'Contact' },
  { id: 'terminal', title: 'Terminal', blurb: '...try it' },
]

const ARRIVE_DELAY_MS = 400

export default function ZoneMenu() {
  const [open, setOpen] = useState(false)

  const select = (id) => {
    bus.emit(EVENTS.TELEPORT, { id })
    setOpen(false)
    setTimeout(() => bus.emit(EVENTS.INTERACT, { id }), ARRIVE_DELAY_MS)
  }

  return (
    <>
      <div className="fixed right-4 top-16 z-30">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Jump to a zone"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border-2 border-[#2B2438] bg-[#F4EDE2] text-[#2B2438] shadow-md"
        >
          <Menu size={18} />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/30"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-[20px] bg-[#2B2438] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-[#F4EDE2]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                Jump to
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 cursor-pointer items-center justify-center text-[#F4EDE2]/70"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="space-y-1">
              {DESTINATIONS.map((z) => (
                <li key={z.id}>
                  <button
                    type="button"
                    onClick={() => select(z.id)}
                    className="flex w-full min-h-11 cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-left active:bg-white/5"
                  >
                    <span className="text-base font-semibold">{z.title}</span>
                    <span className="text-sm text-[#F4EDE2]/55">{z.blurb}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
