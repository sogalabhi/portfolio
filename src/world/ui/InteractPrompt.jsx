import { bus, EVENTS } from '../bus'
import useReducedMotion from '../../hooks/useReducedMotion'

export default function InteractPrompt({ x, y, zoneId }) {
  const reduced = useReducedMotion()

  return (
    <button
      type="button"
      onClick={() => bus.emit(EVENTS.INTERACT, { id: zoneId })}
      className={`fixed z-30 flex h-8 w-8 -translate-x-1/2 cursor-pointer items-center justify-center rounded-md border-2 border-[#2B2438] bg-[#F2A65A] text-sm font-bold text-[#2B2438] shadow-md ${
        reduced ? '' : 'animate-bounce'
      }`}
      style={{ left: x, top: y, fontFamily: "'Press Start 2P', monospace" }}
      aria-label="Interact"
    >
      E
    </button>
  )
}
