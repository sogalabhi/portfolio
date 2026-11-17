export default function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`scroll-mt-20 py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-5xl px-6 md:px-10">{children}</div>
    </section>
  )
}
