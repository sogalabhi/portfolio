import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, X } from 'lucide-react'

export default function WorldNav() {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      <div className="fixed left-4 top-4 z-30">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-[#2B2438] bg-[#F4EDE2] px-3 py-2 text-xs text-[#2B2438] shadow-md transition-transform duration-150 hover:scale-[1.03]"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          ← Portfolio
        </Link>
      </div>

      <div className="fixed right-4 top-4 z-30">
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          aria-label="Controls help"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border-2 border-[#2B2438] bg-[#F4EDE2] text-[#2B2438] shadow-md transition-transform duration-150 hover:scale-[1.03]"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {showHelp && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-6"
          onClick={() => setShowHelp(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border-2 border-[#F4EDE2]/15 bg-[#2B2438] p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-[#F4EDE2]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                Controls
              </h2>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Close"
                className="cursor-pointer text-[#F4EDE2]/70 hover:text-[#F2A65A]"
              >
                <X size={18} />
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm text-[#F4EDE2]/85">
              <div className="flex justify-between">
                <dt>Move</dt>
                <dd>WASD / arrows / click</dd>
              </div>
              <div className="flex justify-between">
                <dt>Interact</dt>
                <dd>E / Space / Enter</dd>
              </div>
              <div className="flex justify-between">
                <dt>Close panel</dt>
                <dd>Esc</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </>
  )
}
