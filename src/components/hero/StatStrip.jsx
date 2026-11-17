import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '../../lib/gsap'
import useReducedMotion from '../../hooks/useReducedMotion'
import sitePlan from '../../content/site-plan.json'

const { titleBlock } = sitePlan

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
        if (!parsed || /^(st|nd|rd|th)\b/.test(parsed.suffix)) return

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

  const cell = 'border-ink/20 px-5 py-4 sm:px-6'
  const label = 'font-mono text-[10px] uppercase tracking-[0.1em] text-faint'

  // laid out as a drawing's title block: a label over each value, ruled cells
  return (
    <dl
      ref={containerRef}
      className="relative grid grid-cols-2 border-t border-ink/35 bg-paper sm:grid-cols-4 lg:grid-cols-[1.25fr_repeat(4,1fr)_0.7fr]"
    >
      <div className={`hidden lg:block lg:pl-14 ${cell}`}>
        <dt className={label}>{titleBlock.drawingLabel}</dt>
        <dd className="mt-1 font-display text-lg italic text-ink">{titleBlock.drawing}</dd>
      </div>
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`${cell} lg:border-l ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t sm:border-t-0' : ''} ${i === 2 ? 'sm:border-l' : ''}`}
        >
          <dt className={label}>{stat.label}</dt>
          <dd data-stat-value className="mt-1 font-mono text-xl font-medium text-ink md:text-2xl">
            {stat.value}
          </dd>
        </div>
      ))}
      <div className={`hidden border-l lg:block ${cell}`}>
        <dt className={label}>{titleBlock.sheetLabel}</dt>
        <dd className="mt-1 font-mono text-xl text-ink md:text-2xl">{titleBlock.sheet}</dd>
      </div>
    </dl>
  )
}
