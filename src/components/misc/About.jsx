import useGsapReveal from '../../hooks/useGsapReveal'
import about from '../../content/about.json'

// A few paragraphs in my own words. A photo sits beside them once
// about.json's `photo` has one: { "src": "/about/photo.jpg", "alt": "..." }.
export default function About() {
  const revealRef = useGsapReveal({ stagger: 0.06 })
  const { photo } = about

  return (
    <div
      ref={revealRef}
      className={`mt-10 grid gap-10 ${photo ? 'md:grid-cols-[16rem_minmax(0,1fr)] md:gap-14' : ''}`}
    >
      {photo && (
        <img
          data-reveal
          src={photo.src}
          alt={photo.alt}
          loading="lazy"
          className="aspect-[4/5] w-full max-w-[16rem] border border-ink/30 object-cover"
        />
      )}

      <div className="max-w-[62ch] space-y-5 text-lg leading-relaxed text-slate">
        {about.bio.map((paragraph, i) => (
          <p key={i} data-reveal className={i === 0 ? 'text-ink' : ''}>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}
