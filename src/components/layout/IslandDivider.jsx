import { Link } from 'react-router-dom'
import { track } from '@vercel/analytics'

// A composed strip, not a new painted asset - no image-generation tool lives
// in this repo (see scripts/assets/README.md), so this reuses the existing
// scatter/character sprites from /world at their native pixel size rather
// than commissioning a dedicated illustration. Doubles as a real link.
export default function IslandDivider() {
  return (
    <Link
      id="world-banner"
      to="/world"
      onClick={() => track('world_explore_click', { source: 'island_divider' })}
      aria-label="Visit the interactive world"
      className="group relative block h-60 overflow-hidden border-y border-line"
      style={{ backgroundColor: '#5FA65A' }}
    >
      <div className="absolute inset-x-0 bottom-0 h-9" style={{ backgroundColor: '#4A7C4E' }} aria-hidden="true" />

      <img
        src="/world/sprites/tree_small_b.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-[8%] transition-transform duration-150 group-hover:-translate-y-1.5"
        style={{ height: 168, width: 'auto', imageRendering: 'pixelated' }}
      />
      <img
        src="/world/sprites/bush_a.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-[18%]"
        style={{ height: 66, width: 'auto', imageRendering: 'pixelated' }}
      />
      <img
        src="/world/char.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 transition-transform duration-150 group-hover:-translate-x-[calc(50%-6px)]"
        style={{ height: 102, width: 'auto', imageRendering: 'pixelated' }}
      />
      <img
        src="/world/sprites/flowers_white.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-[62%]"
        style={{ height: 48, width: 'auto', imageRendering: 'pixelated' }}
      />
      <img
        src="/world/sprites/tree_large_a.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 right-[10%] transition-transform duration-150 group-hover:-translate-y-1.5"
        style={{ height: 204, width: 'auto', imageRendering: 'pixelated' }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="rounded-md bg-[#2B2438]/55 px-4 py-2 font-mono text-base uppercase tracking-wide text-[#F4EDE2] transition-colors duration-150 group-hover:bg-[#2B2438]/70 sm:text-lg"
          aria-hidden="true"
        >
          Click to explore my world →
        </span>
      </div>
    </Link>
  )
}
