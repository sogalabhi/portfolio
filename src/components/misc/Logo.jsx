// An organisation's logo on a small white square, the way LinkedIn shows
// them. The square stays white in the dark theme too: the logos come in
// their own colours, and some of them (Polkadot, NITK) are black.
export default function Logo({ src, alt = '', size = 44, className = '' }) {
  return (
    <span
      className={`relative z-10 flex shrink-0 items-center justify-center border border-ink/20 bg-white p-1.5 ${className}`}
      style={{ width: size, height: size }}
    >
      <img src={src} alt={alt} loading="lazy" className="max-h-full max-w-full object-contain" />
    </span>
  )
}
