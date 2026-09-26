// All 7 zones, positioned every frame from WorldScene.emitZoneLabels - not
// proximity-gated like InteractPrompt. Someone arriving via a link has no
// reason to know what "Tower" means until they've already walked there;
// this labels every building from the very first frame, phone or desktop.

// Press Start 2P at 10px is a 10px-wide monospace glyph; px-2 + a 1px border
// either side adds 18px, and py-1 + line height + border comes to ~26px
const GLYPH_WIDTH = 10
const LABEL_PAD_X = 18
const LABEL_HEIGHT = 26
const HUD_GAP = 6

// A label drifting under a fixed HUD control (the Portfolio button, help,
// the zone menu, the hint) was half-hidden behind it and read as a glitch -
// fade it out while it's there instead. Labels are bottom-centre anchored
// at x/y (see the translate classes below).
function isUnderHud(label, hudRects) {
  const width = label.title.length * GLYPH_WIDTH + LABEL_PAD_X
  const left = label.x - width / 2
  const right = label.x + width / 2
  const top = label.y - LABEL_HEIGHT
  const bottom = label.y
  return hudRects.some(
    (r) =>
      left < r.right + HUD_GAP &&
      right > r.left - HUD_GAP &&
      top < r.bottom + HUD_GAP &&
      bottom > r.top - HUD_GAP
  )
}

export default function ZoneLabels({ labels }) {
  const hudRects = [...document.querySelectorAll('[data-world-hud]')].map((el) =>
    el.getBoundingClientRect()
  )

  return (
    <>
      {labels.map((z) => (
        <div
          key={z.id}
          className="pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-[#2B2438]/70 bg-[#F4EDE2]/90 px-2 py-1 text-[10px] text-[#2B2438] shadow-sm transition-opacity duration-150"
          style={{
            left: z.x,
            top: z.y,
            opacity: isUnderHud(z, hudRects) ? 0 : 1,
            fontFamily: "'Press Start 2P', monospace",
          }}
        >
          {z.title}
        </div>
      ))}
    </>
  )
}
