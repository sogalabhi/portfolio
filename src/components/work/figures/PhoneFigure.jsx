import { Drawing, Leader } from './Drawing'

// Fig. 1, Arjun Guruji: the phone in front elevation, and what runs on it -
// a shelf of books, lyrics that follow the audio, and a notification bell.
// Moving parts (figures.css): the playhead runs the scrubber once a loop, the
// lyric highlight steps down a line each quarter in step with it, the
// waveform pulses, and the bell rings once near the end.

const COVERS = [
  [84, 72],
  [134, 72],
  [84, 106],
  [134, 106],
]
const LYRICS = [
  [150, 168],
  [162, 154],
  [174, 172],
  [186, 146],
]
const BARS = [6, 10, 15, 9, 18, 12, 7, 14, 20, 11, 16, 8, 13, 19, 10, 6, 12]
const SCRUB = { x1: 84, x2: 176, y: 240 }

export default function PhoneFigure({ figure, title, active }) {
  const { labels } = figure
  return (
    <Drawing type="phone" title={title} active={active}>
      {(hatch) => (
        <g transform="translate(14 0)">
          {/* the phone: body, screen, speaker, side key */}
          <rect x="64" y="22" width="132" height="260" rx="18" fill="var(--color-paper)" />
          <g data-hair fill="none" stroke="currentColor">
            <rect x="64" y="22" width="132" height="260" rx="18" opacity="0.85" />
            <rect x="74" y="44" width="112" height="216" rx="4" opacity="0.5" />
            <rect x="114" y="31" width="32" height="4" rx="2" opacity="0.6" />
            <path d="M196 84v22M196 116v12" opacity="0.6" />
            <path d="M74 62H186" opacity="0.35" />
            {/* construction lines: the three bands of the screen */}
            <path d="M74 140H186M74 196H186" opacity="0.2" strokeDasharray="2 3" />
          </g>

          {/* the bell in the screen's top bar */}
          <g className="fig-phone-bell" data-hair fill="none" stroke="currentColor" opacity="0.85">
            <path d="M164 58c0-2 1-2 1-5a5 5 0 0 1 10 0c0 3 1 3 1 5z" />
            <path d="M168.5 60a1.6 1.6 0 0 0 3 0" />
          </g>
          <circle className="fig-phone-badge text-clay" cx="176" cy="49" r="2.4" fill="currentColor" />

          {/* the shelf: four covers, a picture and a title line each */}
          <g data-hair fill="none" stroke="currentColor">
            {COVERS.map(([x, y]) => (
              <g key={`${x}-${y}`}>
                <rect x={x} y={y} width="42" height="30" rx="2" opacity="0.8" />
                <rect x={x + 4} y={y + 4} width="34" height="15" fill={hatch} stroke="none" />
                <path d={`M${x + 4} ${y + 24}h${x % 3 ? 22 : 28}`} opacity="0.5" />
              </g>
            ))}
          </g>

          {/* lyrics, and the line being sung */}
          <rect
            className="fig-phone-lyric text-clay"
            x="79"
            y={LYRICS[0][0] - 5}
            width="102"
            height="10"
            rx="1.5"
            fill="currentColor"
            opacity="0.16"
          />
          <g data-hair stroke="currentColor" opacity="0.6">
            {LYRICS.map(([y, x2]) => (
              <path key={y} d={`M84 ${y}H${x2}`} />
            ))}
          </g>

          {/* audio: waveform over the scrubber */}
          <g fill="currentColor" opacity="0.55">
            {BARS.map((h, i) => (
              <rect
                key={i}
                className="fig-phone-bar"
                style={{ animationDelay: `${-i * 0.13}s` }}
                x={85 + i * 5.4}
                y={216 - h / 2}
                width="2.6"
                height={h}
              />
            ))}
          </g>
          <g data-hair stroke="currentColor">
            <path d={`M${SCRUB.x1} ${SCRUB.y}H${SCRUB.x2}`} opacity="0.35" />
          </g>
          <g className="text-clay">
            <rect className="fig-phone-played" x={SCRUB.x1} y={SCRUB.y - 0.75} width={SCRUB.x2 - SCRUB.x1} height="1.5" fill="currentColor" />
            <circle className="fig-phone-playhead" cx={SCRUB.x1} cy={SCRUB.y} r="3.5" fill="currentColor" />
          </g>
          <path d="M84 247l6 3.5-6 3.5z" fill="currentColor" opacity="0.6" />

          <Leader at={[180, 54]} to={[228, 54]}>
            {labels.notifications}
          </Leader>
          <Leader at={[176, 87]} to={[228, 106]}>
            {labels.books}
          </Leader>
          <Leader at={[172, 174]} to={[228, 186]}>
            {labels.lyrics}
          </Leader>
        </g>
      )}
    </Drawing>
  )
}
