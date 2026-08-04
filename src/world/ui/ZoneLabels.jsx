// All 7 zones, positioned every frame from WorldScene.emitZoneLabels - not
// proximity-gated like InteractPrompt. Someone arriving via a link has no
// reason to know what "Tower" means until they've already walked there;
// this labels every building from the very first frame, phone or desktop.
export default function ZoneLabels({ labels }) {
  return (
    <>
      {labels.map((z) => (
        <div
          key={z.id}
          className="pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-[#2B2438]/70 bg-[#F4EDE2]/90 px-2 py-1 text-[10px] text-[#2B2438] shadow-sm"
          style={{ left: z.x, top: z.y, fontFamily: "'Press Start 2P', monospace" }}
        >
          {z.title}
        </div>
      ))}
    </>
  )
}
