/**
 * Pen marks in the margins, the way a journal page collects them.
 *
 * SVG rather than background images: the strokes inherit the theme's ink
 * colour through currentColor, so one set works across all four styles in both
 * light and dark. Images would need eight variants and would still be wrong the
 * moment a colour changed.
 *
 * Desktop only — a phone has no margins to spare — and never interactive.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Sparkles() {
  return (
    <svg viewBox="0 0 60 70" className="h-16 w-14" aria-hidden>
      <g {...stroke}>
        <path d="M20 4 L23 16 L35 19 L23 22 L20 34 L17 22 L5 19 L17 16 Z" />
        <path d="M44 30 L46 37 L53 39 L46 41 L44 48 L42 41 L35 39 L42 37 Z" />
        <path d="M15 50 L16.5 55 L21 56.5 L16.5 58 L15 63 L13.5 58 L9 56.5 L13.5 55 Z" />
      </g>
    </svg>
  )
}

function CurlyArrow() {
  return (
    <svg viewBox="0 0 70 90" className="h-24 w-16" aria-hidden>
      <g {...stroke}>
        <path d="M12 6 C 40 14, 8 40, 34 52 C 52 60, 44 74, 34 82" />
        <path d="M26 74 L34 83 L44 78" />
      </g>
    </svg>
  )
}

function Sprig() {
  return (
    <svg viewBox="0 0 50 90" className="h-24 w-12" aria-hidden>
      <g {...stroke}>
        <path d="M25 84 C 25 60, 24 30, 26 8" />
        <path d="M25 66 C 14 62, 10 52, 12 46 C 20 46, 25 56, 25 66 Z" />
        <path d="M26 54 C 37 50, 41 40, 39 34 C 31 34, 26 44, 26 54 Z" />
        <path d="M26 40 C 16 36, 13 27, 15 22 C 22 22, 26 31, 26 40 Z" />
        <path d="M26 27 C 35 24, 38 16, 37 11 C 30 11, 26 19, 26 27 Z" />
      </g>
    </svg>
  )
}

function Banner() {
  return (
    <svg viewBox="0 0 110 40" className="h-10 w-28" aria-hidden>
      <g {...stroke}>
        <path d="M8 10 L102 10 L94 22 L102 34 L8 34 L16 22 Z" />
        <path d="M28 22 L82 22" strokeDasharray="2 6" />
      </g>
    </svg>
  )
}

function Paperclip() {
  return (
    <svg viewBox="0 0 40 80" className="h-20 w-10" aria-hidden>
      <g {...stroke} strokeWidth={2}>
        <path d="M26 12 L26 58 C 26 68, 12 68, 12 58 L12 18 C 12 12, 21 12, 21 18 L21 56" />
      </g>
    </svg>
  )
}

function CoffeeRing() {
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden>
      <g {...stroke} strokeWidth={2.4}>
        <path d="M40 8 C 58 8, 72 22, 72 40 C 72 58, 58 72, 40 72 C 22 72, 8 58, 8 40 C 8 24, 20 10, 36 8" />
      </g>
    </svg>
  )
}

function DottedFlourish() {
  return (
    <svg viewBox="0 0 120 30" className="h-8 w-32" aria-hidden>
      <g {...stroke}>
        <path d="M4 22 C 24 4, 44 30, 64 14 C 78 4, 92 12, 112 8" strokeDasharray="1 7" />
      </g>
    </svg>
  )
}

/** Each doodle pinned to a margin, well away from the content column. */
const PLACED = [
  { node: <Sparkles />, className: 'left-3 top-28', rotate: -8, opacity: 0.5 },
  { node: <Sprig />, className: 'left-4 top-1/2', rotate: 6, opacity: 0.4 },
  { node: <DottedFlourish />, className: 'left-2 bottom-32', rotate: -4, opacity: 0.45 },
  { node: <CurlyArrow />, className: 'right-4 top-36', rotate: 10, opacity: 0.4 },
  { node: <Paperclip />, className: 'right-6 top-2/3', rotate: -14, opacity: 0.45 },
  { node: <CoffeeRing />, className: 'right-3 bottom-36', rotate: 0, opacity: 0.22 },
  { node: <Banner />, className: 'left-6 bottom-8', rotate: -3, opacity: 0.35 },
]

export default function Doodles() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 hidden select-none text-ink-faint xl:block"
    >
      {PLACED.map((d, i) => (
        <div
          key={i}
          className={`absolute ${d.className}`}
          style={{ transform: `rotate(${d.rotate}deg)`, opacity: d.opacity }}
        >
          {d.node}
        </div>
      ))}
    </div>
  )
}
