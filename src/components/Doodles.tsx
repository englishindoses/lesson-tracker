import type { DoodleSet } from '../lib/theme'

/**
 * Pen marks in the margins, the way a journal page collects them.
 *
 * SVG rather than background images: the strokes inherit the theme's ink
 * colour through currentColor, so one set works across every palette in both
 * light and dark. Images would need one variant per palette and would still be
 * wrong the moment a colour changed.
 *
 * Two sets — plants and pen marks — chosen in Settings. Wide screens only by
 * default, since a phone has no margins to spare; the few marked `phone` sit
 * far enough into the corners to be shown anyway if she asks for them. Never
 * interactive.
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

function Fern() {
  return (
    <svg viewBox="0 0 46 100" className="h-28 w-12" aria-hidden>
      <g {...stroke}>
        <path d="M23 96 C 22 68, 22 34, 25 6" />
        <path d="M23 84 C 15 82, 11 76, 11 71" />
        <path d="M23 84 C 31 81, 35 75, 35 70" />
        <path d="M23 70 C 15 68, 12 62, 12 57" />
        <path d="M23 70 C 31 67, 34 61, 34 56" />
        <path d="M24 56 C 17 54, 14 49, 14 44" />
        <path d="M24 56 C 31 53, 33 48, 33 43" />
        <path d="M24 42 C 18 40, 16 36, 16 32" />
        <path d="M24 42 C 30 40, 32 35, 32 31" />
        <path d="M25 28 C 20 27, 19 23, 19 20" />
        <path d="M25 28 C 29 26, 30 22, 30 19" />
      </g>
    </svg>
  )
}

function MonsteraLeaf() {
  return (
    <svg viewBox="0 0 74 86" className="h-24 w-20" aria-hidden>
      <g {...stroke}>
        <path d="M37 82 C 37 66, 37 54, 37 44" />
        <path d="M37 44 C 14 42, 5 26, 12 12 C 24 4, 50 4, 62 12 C 69 26, 60 42, 37 44 Z" />
        <path d="M37 44 C 31 34, 25 26, 14 20" />
        <path d="M37 42 C 43 32, 49 25, 60 19" />
        <path d="M22 41 C 24 33, 26 27, 30 21" />
        <path d="M52 40 C 50 32, 48 26, 44 20" />
      </g>
    </svg>
  )
}

function PottedPlant() {
  return (
    <svg viewBox="0 0 64 88" className="h-24 w-16" aria-hidden>
      <g {...stroke}>
        <path d="M14 56 L50 56 L44 84 L20 84 Z" />
        <path d="M11 48 L53 48 L53 56 L11 56 Z" />
        <path d="M32 48 C 32 36, 32 28, 32 20" />
        <path d="M32 38 C 20 36, 14 28, 15 20 C 25 20, 32 30, 32 38 Z" />
        <path d="M32 34 C 44 31, 50 23, 49 16 C 39 16, 32 26, 32 34 Z" />
        <path d="M32 22 C 26 18, 24 10, 27 5 C 34 8, 35 17, 32 22 Z" />
      </g>
    </svg>
  )
}

function Daisy() {
  return (
    <svg viewBox="0 0 48 88" className="h-24 w-12" aria-hidden>
      <g {...stroke}>
        <path d="M24 84 C 23 66, 24 52, 24 38" />
        <path d="M24 66 C 14 64, 9 56, 10 50 C 18 51, 23 59, 24 66 Z" />
        <path d="M25 54 C 34 52, 38 45, 37 40 C 30 41, 25 48, 25 54 Z" />
        <circle cx="24" cy="24" r="4.5" />
        <g>
          <ellipse cx="24" cy="12" rx="4" ry="7" />
          <ellipse cx="24" cy="12" rx="4" ry="7" transform="rotate(60 24 24)" />
          <ellipse cx="24" cy="12" rx="4" ry="7" transform="rotate(120 24 24)" />
          <ellipse cx="24" cy="12" rx="4" ry="7" transform="rotate(180 24 24)" />
          <ellipse cx="24" cy="12" rx="4" ry="7" transform="rotate(240 24 24)" />
          <ellipse cx="24" cy="12" rx="4" ry="7" transform="rotate(300 24 24)" />
        </g>
      </g>
    </svg>
  )
}

function Cactus() {
  return (
    <svg viewBox="0 0 60 90" className="h-24 w-16" aria-hidden>
      <g {...stroke}>
        <path d="M23 74 C 19 66, 19 40, 21 30 C 23 20, 37 20, 39 30 C 41 40, 41 66, 37 74 Z" />
        <path d="M21 52 C 12 52, 9 46, 9 39 C 9 34, 14 34, 14 39 C 14 45, 16 48, 21 48" />
        <path d="M39 44 C 47 44, 50 39, 50 33 C 50 29, 46 29, 46 33 C 46 38, 44 40, 39 40" />
        <path d="M16 74 L44 74 L41 86 L19 86 Z" />
        <path d="M30 20 C 30 16, 27 14, 27 11" />
        <circle cx="26" cy="9" r="2.6" />
      </g>
    </svg>
  )
}

function LeafVine() {
  return (
    <svg viewBox="0 0 44 120" className="h-32 w-12" aria-hidden>
      <g {...stroke}>
        <path d="M22 4 C 34 20, 10 36, 22 52 C 34 68, 10 84, 22 100 C 27 108, 24 114, 22 116" />
        <path d="M28 14 C 36 12, 40 16, 39 21 C 33 23, 28 20, 28 14 Z" />
        <path d="M14 34 C 6 33, 3 37, 5 42 C 11 43, 15 40, 14 34 Z" />
        <path d="M29 62 C 37 60, 41 64, 40 69 C 34 71, 29 68, 29 62 Z" />
        <path d="M14 82 C 6 81, 3 85, 5 90 C 11 91, 15 88, 14 82 Z" />
        <path d="M27 104 C 34 103, 37 106, 36 110 C 31 112, 27 109, 27 104 Z" />
      </g>
    </svg>
  )
}

function Berries() {
  return (
    <svg viewBox="0 0 54 76" className="h-20 w-14" aria-hidden>
      <g {...stroke}>
        <path d="M27 72 C 26 54, 27 34, 29 10" />
        <path d="M28 44 C 18 42, 13 34, 14 28 C 23 29, 28 37, 28 44 Z" />
        <path d="M28 30 C 38 27, 43 19, 42 13 C 33 14, 28 23, 28 30 Z" />
        <circle cx="19" cy="18" r="4" />
        <circle cx="27" cy="9" r="4" />
        <circle cx="36" cy="34" r="4" />
        <path d="M19 18 L26 12" strokeWidth={1.2} />
        <path d="M36 34 L30 26" strokeWidth={1.2} />
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

type Placement = {
  node: React.ReactElement
  kind: 'plant' | 'mark'
  className: string
  rotate: number
  opacity: number
  /** Safe in a phone's corners too, rather than over the content column. */
  phone?: boolean
}

/** Each doodle pinned to a margin, well away from the content column. */
const PLACED: Placement[] = [
  { node: <Fern />, kind: 'plant', className: 'left-2 top-4', rotate: -5, opacity: 0.35 },
  { node: <Sparkles />, kind: 'mark', className: 'left-4 top-36', rotate: -8, opacity: 0.5 },
  {
    node: <MonsteraLeaf />,
    kind: 'plant',
    className: 'left-3 top-[38%]',
    rotate: 8,
    opacity: 0.32,
  },
  { node: <Sprig />, kind: 'plant', className: 'left-5 top-[56%]', rotate: 6, opacity: 0.4 },
  { node: <Daisy />, kind: 'plant', className: 'left-2 top-[72%]', rotate: -6, opacity: 0.38 },
  {
    node: <DottedFlourish />,
    kind: 'mark',
    className: 'left-2 bottom-28',
    rotate: -4,
    opacity: 0.45,
  },
  {
    node: <Banner />,
    kind: 'mark',
    className: 'left-2 bottom-4 sm:left-6 sm:bottom-8',
    rotate: -3,
    opacity: 0.35,
    phone: true,
  },
  { node: <LeafVine />, kind: 'plant', className: 'right-2 top-2', rotate: 4, opacity: 0.34 },
  { node: <CurlyArrow />, kind: 'mark', className: 'right-5 top-[30%]', rotate: 10, opacity: 0.4 },
  {
    node: <PottedPlant />,
    kind: 'plant',
    className: 'right-3 top-[45%]',
    rotate: -4,
    opacity: 0.35,
  },
  { node: <Paperclip />, kind: 'mark', className: 'right-6 top-[62%]', rotate: -14, opacity: 0.45 },
  { node: <Berries />, kind: 'plant', className: 'right-2 top-[76%]', rotate: 7, opacity: 0.36 },
  {
    node: <CoffeeRing />,
    kind: 'mark',
    className: 'right-2 top-24 sm:right-8 sm:top-auto sm:bottom-32',
    rotate: 0,
    opacity: 0.22,
    phone: true,
  },
  {
    node: <Cactus />,
    kind: 'plant',
    className: 'right-2 bottom-3 sm:right-3 sm:bottom-6',
    rotate: -3,
    opacity: 0.35,
    phone: true,
  },
  {
    node: <Fern />,
    kind: 'plant',
    className: 'left-1 bottom-24 sm:hidden',
    rotate: 5,
    opacity: 0.3,
    phone: true,
  },
]

export default function Doodles({ set, onPhone }: { set: DoodleSet; onPhone: boolean }) {
  if (set === 'none') return null
  const shown = PLACED.filter((d) => set === 'all' || d.kind === (set === 'plants' ? 'plant' : 'mark'))

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-0 select-none text-ink-faint ${
        onPhone ? 'block opacity-60 xl:opacity-100' : 'hidden xl:block'
      }`}
    >
      {shown.map((d, i) => (
        <div
          key={i}
          className={`absolute ${d.className} ${onPhone && !d.phone ? 'hidden xl:block' : ''}`}
          style={{ transform: `rotate(${d.rotate}deg)`, opacity: d.opacity }}
        >
          {d.node}
        </div>
      ))}
    </div>
  )
}
