import { Drawing } from './Drawing'

// RAG assistant: a question goes through three kinds of search over the
// code's clauses, and the answer's citation is checked against its source.
// Moving parts (figures.css): the searches run in turn, then the answer and
// its check.

const SEARCHES = [
  ['keyword', 66],
  ['semantic', 132],
  ['hybrid', 198],
]

export default function RetrievalFigure({ figure, title, active }) {
  const { labels } = figure
  return (
    <Drawing type="retrieval" title={title} active={active}>
      {() => (
        <>
          <g data-hair stroke="currentColor" fill="none" opacity="0.5">
            {SEARCHES.map(([key, y]) => (
              <path key={key} d={`M104 150H124V${y + 18}H148M254 ${y + 18}H278V150H312`} />
            ))}
          </g>

          <g data-hair stroke="currentColor">
            <rect x="20" y="130" width="84" height="40" rx="4" fill="var(--color-paper)" />
            <rect x="312" y="70" width="148" height="160" fill="var(--color-paper)" />
          </g>
          <text x="62" y="154" textAnchor="middle" className="fig-label">
            {labels.question}
          </text>

          {SEARCHES.map(([key, y], i) => (
            <g key={key} className={`fig-rag-search fig-rag-search-${i + 1}`}>
              <g data-hair stroke="currentColor">
                <rect x="148" y={y} width="106" height="36" rx="4" fill="var(--color-paper)" />
              </g>
              <text x="201" y={y + 22} textAnchor="middle" className="fig-label">
                {labels[key]}
              </text>
            </g>
          ))}

          <text x="386" y="60" textAnchor="middle" className="fig-label">
            {labels.answer}
          </text>
          <g className="fig-rag-answer" fill="currentColor" opacity="0.45">
            {[116, 100, 120, 84, 108].map((w, i) => (
              <rect key={i} x="328" y={90 + i * 16} width={w} height="4" rx="1" />
            ))}
          </g>
          <g className="fig-rag-check text-moss">
            <path d="M322 198l7 7l13 -15" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="348" y="202" className="fig-label fig-label-sm">
              {labels.cited}
            </text>
          </g>
          <text x="201" y="262" textAnchor="middle" className="fig-label fig-label-sm">
            {labels.source}
          </text>
        </>
      )}
    </Drawing>
  )
}
