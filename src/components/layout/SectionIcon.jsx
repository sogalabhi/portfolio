// Reuses the /world building sprites as section markers instead of a generic
// icon set - these are the one asset nobody else has. Height-locked, width
// auto, since the buildings don't share an aspect ratio (the tower is tall
// and narrow, the shed is short and wide) and cropping them to a uniform box
// would cut them oddly.
export default function SectionIcon({ src, size = 40 }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      style={{ height: size, width: 'auto', imageRendering: 'pixelated' }}
      className="shrink-0"
    />
  )
}
