import type { DoodleSet } from '../lib/theme'

/**
 * Pen marks in the margins, the way a journal page collects them.
 *
 * SVG rather than background images: the strokes inherit the theme's ink
 * colour through currentColor, so one set works across every palette in both
 * light and dark. Images would need one variant per palette and would still be
 * wrong the moment a colour changed.
 *
 * One set per preset — botanical, seaside, berry and so on — chosen in
 * Settings. Wide screens only by default, since a phone has no margins to
 * spare; the slots marked `phone` sit far enough into the corners to be shown
 * anyway if she asks for them. Never interactive.
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

function Heart() {
  return (
    <svg viewBox="0 0 60 56" className="h-14 w-14" aria-hidden>
      <g {...stroke}>
        <path d="M30 50 C 6 34, 4 18, 14 10 C 22 4, 29 9, 30 16 C 31 9, 38 4, 46 10 C 56 18, 54 34, 30 50 Z" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ seaside */

function Shell() {
  return (
    <svg viewBox="0 0 70 62" className="h-16 w-20" aria-hidden>
      <g {...stroke}>
        <path d="M35 56 C 10 50, 4 26, 14 12 C 26 2, 44 2, 56 12 C 66 26, 60 50, 35 56 Z" />
        <path d="M35 56 L14 15" />
        <path d="M35 56 L24 8" />
        <path d="M35 56 L35 5" />
        <path d="M35 56 L46 8" />
        <path d="M35 56 L56 15" />
      </g>
    </svg>
  )
}

function Waves() {
  return (
    <svg viewBox="0 0 120 52" className="h-12 w-32" aria-hidden>
      <g {...stroke}>
        <path d="M4 14 C 20 2, 32 26, 48 14 C 62 4, 74 26, 90 14 C 100 7, 110 12, 116 10" />
        <path d="M4 30 C 20 18, 32 42, 48 30 C 62 20, 74 42, 90 30 C 100 23, 110 28, 116 26" />
        <path d="M18 46 C 32 38, 44 54, 58 46" />
      </g>
    </svg>
  )
}

function PalmLeaf() {
  return (
    <svg viewBox="0 0 80 92" className="h-24 w-20" aria-hidden>
      <g {...stroke}>
        <path d="M40 88 C 40 62, 40 32, 43 6" />
        <path d="M40 74 C 26 72, 18 62, 17 52 C 30 54, 39 64, 40 74 Z" />
        <path d="M41 74 C 55 71, 63 61, 63 51 C 50 54, 42 64, 41 74 Z" />
        <path d="M41 58 C 28 55, 21 45, 21 36 C 33 39, 41 48, 41 58 Z" />
        <path d="M42 58 C 54 54, 60 45, 60 36 C 48 39, 42 48, 42 58 Z" />
        <path d="M42 40 C 32 37, 27 29, 27 21 C 37 24, 42 32, 42 40 Z" />
        <path d="M43 40 C 52 36, 56 28, 55 21 C 46 24, 42 32, 43 40 Z" />
      </g>
    </svg>
  )
}

function Starfish() {
  return (
    <svg viewBox="0 0 70 70" className="h-[4.5rem] w-[4.5rem]" aria-hidden>
      <g {...stroke}>
        <path d="M35 5 L45 26 L67 29 L51 44 L55 66 L35 55 L15 66 L19 44 L3 29 L25 26 Z" />
        <circle cx="35" cy="34" r="2" />
        <circle cx="29" cy="42" r="1.6" />
        <circle cx="41" cy="42" r="1.6" />
      </g>
    </svg>
  )
}

/* -------------------------------------------------------------------- berry */

function Cherries() {
  return (
    <svg viewBox="0 0 62 82" className="h-20 w-16" aria-hidden>
      <g {...stroke}>
        <path d="M18 52 C 20 36, 25 22, 31 10" />
        <path d="M43 58 C 40 40, 36 24, 31 10" />
        <circle cx="18" cy="62" r="10" />
        <circle cx="43" cy="68" r="10" />
        <path d="M31 12 C 41 5, 52 8, 55 15 C 47 22, 36 20, 31 12 Z" />
      </g>
    </svg>
  )
}

function Blossom() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden>
      <g {...stroke}>
        <circle cx="32" cy="32" r="5" />
        <ellipse cx="32" cy="16" rx="7" ry="10" />
        <ellipse cx="32" cy="16" rx="7" ry="10" transform="rotate(72 32 32)" />
        <ellipse cx="32" cy="16" rx="7" ry="10" transform="rotate(144 32 32)" />
        <ellipse cx="32" cy="16" rx="7" ry="10" transform="rotate(216 32 32)" />
        <ellipse cx="32" cy="16" rx="7" ry="10" transform="rotate(288 32 32)" />
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------- whimsical */

function StarBurst() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden>
      <g {...stroke}>
        <circle cx="32" cy="32" r="7" />
        <path d="M32 4 L32 16" />
        <path d="M32 48 L32 60" />
        <path d="M4 32 L16 32" />
        <path d="M48 32 L60 32" />
        <path d="M12 12 L21 21" />
        <path d="M43 43 L52 52" />
        <path d="M52 12 L43 21" />
        <path d="M21 43 L12 52" />
      </g>
    </svg>
  )
}

function Spiral() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden>
      <g {...stroke}>
        <path d="M34 32 C 34 27, 27 27, 27 33 C 27 41, 37 42, 41 35 C 46 26, 36 15, 25 18 C 11 22, 8 40, 19 51 C 30 62, 52 58, 58 43" />
      </g>
    </svg>
  )
}

function SpeechBubble() {
  return (
    <svg viewBox="0 0 92 62" className="h-14 w-24" aria-hidden>
      <g {...stroke}>
        <path d="M14 6 L78 6 C 84 6, 88 10, 88 16 L88 38 C 88 44, 84 48, 78 48 L32 48 L16 60 L20 48 L14 48 C 8 48, 4 44, 4 38 L4 16 C 4 10, 8 6, 14 6 Z" />
        <circle cx="30" cy="27" r="2" />
        <circle cx="46" cy="27" r="2" />
        <circle cx="62" cy="27" r="2" />
      </g>
    </svg>
  )
}

/* --------------------------------------------------------------- typewriter */

function Asterisks() {
  return (
    <svg viewBox="0 0 54 72" className="h-[4.5rem] w-14" aria-hidden>
      <g {...stroke}>
        <path d="M16 6 L16 26" />
        <path d="M7 11 L25 21" />
        <path d="M25 11 L7 21" />
        <path d="M38 40 L38 58" />
        <path d="M30 44 L46 54" />
        <path d="M46 44 L30 54" />
      </g>
    </svg>
  )
}

function NoteCard() {
  return (
    <svg viewBox="0 0 92 66" className="h-16 w-24" aria-hidden>
      <g {...stroke}>
        <path d="M6 8 L74 8 L86 22 L86 58 L6 58 Z" />
        <path d="M74 8 L74 22 L86 22" />
        <path d="M16 32 L70 32" strokeDasharray="3 5" />
        <path d="M16 42 L64 42" strokeDasharray="3 5" />
        <path d="M16 50 L48 50" strokeDasharray="3 5" />
      </g>
    </svg>
  )
}

/* ========================================================================== */

type Slot = {
  className: string
  rotate: number
  opacity: number
  /** Safe in a phone's corners too, rather than over the content column. */
  phone?: boolean
}

/**
 * Where doodles go: both margins, top to bottom, alternating sides at close
 * intervals. A set doesn't fill these in order -- it spreads itself across the
 * whole list (see `spread` below), so even a sparse set reaches the bottom of
 * the page instead of clumping at the top.
 */
const SLOTS: Slot[] = [
  { className: 'left-2 top-2', rotate: -6, opacity: 0.4 },
  { className: 'right-2 top-3', rotate: 5, opacity: 0.38, phone: true },
  { className: 'left-5 top-[11%]', rotate: 7, opacity: 0.34 },
  { className: 'right-5 top-[12%]', rotate: -8, opacity: 0.36 },
  { className: 'left-1 top-[21%]', rotate: -3, opacity: 0.38 },
  { className: 'right-1 top-[22%]', rotate: 9, opacity: 0.34 },
  { className: 'left-4 top-[31%]', rotate: 6, opacity: 0.36 },
  { className: 'right-4 top-[32%]', rotate: -5, opacity: 0.38 },
  { className: 'left-2 top-[41%]', rotate: -9, opacity: 0.34 },
  { className: 'right-2 top-[42%]', rotate: 4, opacity: 0.36 },
  { className: 'left-5 top-[51%]', rotate: 3, opacity: 0.38 },
  { className: 'right-5 top-[52%]', rotate: -7, opacity: 0.34 },
  { className: 'left-1 top-[61%]', rotate: -4, opacity: 0.36 },
  { className: 'right-1 top-[62%]', rotate: 8, opacity: 0.38 },
  { className: 'left-4 top-[71%]', rotate: 5, opacity: 0.34 },
  { className: 'right-4 top-[72%]', rotate: -6, opacity: 0.36 },
  { className: 'left-2 top-[81%]', rotate: -7, opacity: 0.38 },
  { className: 'right-2 top-[82%]', rotate: 3, opacity: 0.34 },
  { className: 'left-2 bottom-4 sm:left-5 sm:bottom-6', rotate: 4, opacity: 0.36, phone: true },
  { className: 'right-2 bottom-3 sm:right-3 sm:bottom-5', rotate: -4, opacity: 0.36, phone: true },
]

/**
 * Spread n doodles evenly over the slots, rather than filling the first n. A
 * set of four then runs top to bottom of the page instead of sitting in a
 * huddle at the top.
 */
function spread(count: number): Slot[] {
  if (count >= SLOTS.length)
    return Array.from({ length: count }, (_, i) => SLOTS[i % SLOTS.length])
  if (count === 1) return [SLOTS[0]]
  const step = (SLOTS.length - 1) / (count - 1)
  return Array.from({ length: count }, (_, i) => SLOTS[Math.round(i * step)])
}

/**
 * One set per preset, so choosing Botanical gets botanical margins. The names
 * match `PRESETS` in theme.ts on purpose -- a set and a look are chosen
 * separately, but they are the same vocabulary.
 */
const SETS: Record<Exclude<DoodleSet, 'none'>, React.ReactElement[]> = {
  // The quiet one: half a margin, and a lot of white paper left.
  minimalist: [<Sprig />, <DottedFlourish />, <Fern />, <Sprig />, <DottedFlourish />, <Sprig />],
  cozy: [
    <CoffeeRing />,
    <Heart />,
    <Banner />,
    <Sparkles />,
    <Daisy />,
    <PottedPlant />,
    <Paperclip />,
    <DottedFlourish />,
    <Heart />,
    <Sparkles />,
    <CoffeeRing />,
    <Daisy />,
    <Banner />,
    <PottedPlant />,
    <DottedFlourish />,
    <Sparkles />,
  ],
  whimsical: [
    <StarBurst />,
    <Sparkles />,
    <Banner />,
    <Spiral />,
    <SpeechBubble />,
    <CurlyArrow />,
    <DottedFlourish />,
    <StarBurst />,
    <Sparkles />,
    <Spiral />,
    <CurlyArrow />,
    <Banner />,
    <SpeechBubble />,
    <StarBurst />,
    <DottedFlourish />,
    <Sparkles />,
  ],
  botanical: [
    <Fern />,
    <Cactus />,
    <MonsteraLeaf />,
    <LeafVine />,
    <Sprig />,
    <Daisy />,
    <Berries />,
    <PottedPlant />,
    <Fern />,
    <LeafVine />,
    <MonsteraLeaf />,
    <Sprig />,
    <Daisy />,
    <Berries />,
    <Cactus />,
    <Fern />,
  ],
  seaside: [
    <Shell />,
    <Starfish />,
    <Waves />,
    <PalmLeaf />,
    <Shell />,
    <Waves />,
    <Starfish />,
    <PalmLeaf />,
    <Waves />,
    <Shell />,
    <Starfish />,
    <Waves />,
    <PalmLeaf />,
    <Shell />,
  ],
  berry: [
    <Cherries />,
    <Berries />,
    <Blossom />,
    <LeafVine />,
    <Heart />,
    <Daisy />,
    <Cherries />,
    <Blossom />,
    <Berries />,
    <LeafVine />,
    <Blossom />,
    <Cherries />,
    <Daisy />,
    <Berries />,
  ],
  typewriter: [
    <Asterisks />,
    <Paperclip />,
    <NoteCard />,
    <CoffeeRing />,
    <DottedFlourish />,
    <Asterisks />,
    <NoteCard />,
    <Paperclip />,
    <DottedFlourish />,
    <CoffeeRing />,
    <Asterisks />,
    <NoteCard />,
  ],
}

export default function Doodles({ set, onPhone }: { set: DoodleSet; onPhone: boolean }) {
  if (set === 'none') return null
  const drawings = SETS[set] ?? []
  const slots = spread(drawings.length)

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-0 select-none text-ink-faint ${
        onPhone ? 'block opacity-60 xl:opacity-100' : 'hidden xl:block'
      }`}
    >
      {drawings.map((node, i) => {
        const slot = slots[i]
        return (
          <div
            key={i}
            className={`absolute ${slot.className} ${
              onPhone && !slot.phone ? 'hidden xl:block' : ''
            }`}
            style={{ transform: `rotate(${slot.rotate}deg)`, opacity: slot.opacity }}
          >
            {node}
          </div>
        )
      })}
    </div>
  )
}

