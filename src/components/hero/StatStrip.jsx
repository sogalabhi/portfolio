import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '../../lib/gsap'
import useReducedMotion from '../../hooks/useReducedMotion'

function parseStat(value) {
  const match = value.match(/^([\d,]+\.?\d*)/)
  if (!match) return null

  const numStr = match[1]
  const suffix = value.slice(numStr.length)
  const hasComma = numStr.includes(',')
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0
  const target = parseFloat(numStr.replace(/,/g, ''))

  return { target, suffix, hasComma, decimals }
}

function formatStat(n, { hasComma, decimals }) {
  const fixed = n.toFixed(decimals)
  if (!hasComma) return fixed
  const [intPart, decPart] = fixed.split('.')
  const grouped = Number(intPart).toLocaleString('en-US')
  return decPart ? `${grouped}.${decPart}` : grouped
}

export default function StatStrip({ stats }) {
  const containerRef = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced || !containerRef.current) return

      containerRef.current.querySelectorAll('[data-stat-value]').forEach((el) => {
        const original = el.textContent
        const parsed = parseStat(original)
        if (!parsed) return

        const proxy = { n: 0 }
        gsap.to(proxy, {
          n: parsed.target,
          duration: 1.2,
          ease: 'power2.out',
          delay: 0.45,
          onUpdate: () => {
            el.textContent = formatStat(proxy.n, parsed) + parsed.suffix
          },
          onComplete: () => {
            el.textContent = original
          },
        })
      })
    },
    { scope: containerRef, dependencies: [reduced] },
  )

  return (
    <dl
      ref={containerRef}
      className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:flex sm:flex-wrap sm:gap-x-12"
    >
      {stats.map((stat) => (
        <div key={stat.label}>
          <dd
            data-stat-value
            className="font-display text-2xl font-semibold text-ink md:text-3xl"
          >
            {stat.value}
          </dd>
          <dt className="mt-1 text-sm text-faint">{stat.label}</dt>
        </div>
      ))}
    </dl>
  )
}
