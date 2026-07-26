import type { DoodleSet } from '../lib/theme'

/**
 * Pen marks down both margins, the way a journal page collects them.
 *
 * SVG rather than background images: the strokes inherit the theme's ink
 * colour through currentColor, so one set works across every palette in both
 * light and dark. Images would need one variant per palette and would still be
 * wrong the moment a colour changed.
 *
 * Overlap is prevented by construction, not by arithmetic: each margin is a
 * full-height flex column with `justify-between`, so the browser spaces
 * whatever it is given evenly from top to bottom of the screen and two
 * drawings can never land on each other. Fewer drawings simply means bigger
 * gaps -- which is exactly what the minimalist set wants.
 *
 * Each set mixes small marks with larger ones. Small drawings sit in a 2.5rem
 * box, large ones in 4rem to 5rem, so a margin reads as a hand filling space
 * rather than a row of identical stamps.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/* ============================================================= small marks ==
   All on a 40x40 grid, drawn in a 2.5rem box. Simple enough to read at that
   size -- anything with more than a few strokes turns to mush. */

const sm = 'h-10 w-10'

function Leaf() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 37 L20 22" />
        <path d="M20 22 C 8 18, 8 8, 20 3 C 32 8, 32 18, 20 22 Z" />
        <path d="M20 21 L20 5" />
      </g>
    </svg>
  )
}

function Star() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 4 L24.5 15.5 L37 16.5 L27.5 24.5 L30.5 36.5 L20 30 L9.5 36.5 L12.5 24.5 L3 16.5 L15.5 15.5 Z" />
      </g>
    </svg>
  )
}

function Sparkle() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 3 C 21.5 13, 27 18.5, 37 20 C 27 21.5, 21.5 27, 20 37 C 18.5 27, 13 21.5, 3 20 C 13 18.5, 18.5 13, 20 3 Z" />
      </g>
    </svg>
  )
}

function BerryTrio() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 38 C 20 31, 18 28, 15 26" />
        <path d="M20 38 C 20 30, 22 27, 25 25" />
        <path d="M20 38 L20 17" />
        <circle cx="13" cy="23" r="4.5" />
        <circle cx="27" cy="22" r="4.5" />
        <circle cx="20" cy="11" r="4.5" />
      </g>
    </svg>
  )
}

function TinyFlower() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <circle cx="20" cy="20" r="3.5" />
        <ellipse cx="20" cy="10" rx="4.5" ry="6" />
        <ellipse cx="20" cy="10" rx="4.5" ry="6" transform="rotate(72 20 20)" />
        <ellipse cx="20" cy="10" rx="4.5" ry="6" transform="rotate(144 20 20)" />
        <ellipse cx="20" cy="10" rx="4.5" ry="6" transform="rotate(216 20 20)" />
        <ellipse cx="20" cy="10" rx="4.5" ry="6" transform="rotate(288 20 20)" />
      </g>
    </svg>
  )
}

function Heart() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 35 C 7 26, 3 16, 10 9 C 15 4.5, 20 8, 20 12.5 C 20 8, 25 4.5, 30 9 C 37 16, 33 26, 20 35 Z" />
      </g>
    </svg>
  )
}

function Curl() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M22 20 C 22 17, 18 17, 18 21 C 18 26, 24 26, 26 21 C 29 13, 20 7, 13 11 C 4 16, 4 29, 13 34 C 20 38, 29 36, 34 30" />
      </g>
    </svg>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M7 5 C 24 8, 12 23, 29 29" />
        <path d="M21 26 L30 30 L27 21" />
      </g>
    </svg>
  )
}

function Asterisk() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 7 L20 33" />
        <path d="M9 13 L31 27" />
        <path d="M31 13 L9 27" />
      </g>
    </svg>
  )
}

function Ripples() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M4 13 C 10 7, 16 19, 22 13 C 27 8, 33 14, 36 11" />
        <path d="M4 22 C 10 16, 16 28, 22 22 C 27 17, 33 23, 36 20" />
        <path d="M9 31 C 14 27, 19 35, 25 31" />
      </g>
    </svg>
  )
}

function Dots() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <circle cx="12" cy="27" r="2.6" />
        <circle cx="20" cy="14" r="2.6" />
        <circle cx="28" cy="27" r="2.6" />
      </g>
    </svg>
  )
}

function SmallShell() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 34 C 7 30, 4 16, 11 8 C 17 3, 23 3, 29 8 C 36 16, 33 30, 20 34 Z" />
        <path d="M20 34 L12 10" />
        <path d="M20 34 L20 5" />
        <path d="M20 34 L28 10" />
      </g>
    </svg>
  )
}

function Cherries() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M13 25 C 15 18, 18 11, 21 6" />
        <path d="M27 27 C 25 19, 23 12, 21 6" />
        <circle cx="12" cy="30" r="6" />
        <circle cx="28" cy="32" r="6" />
        <path d="M21 7 C 27 3, 33 5, 35 9 C 30 13, 23 11, 21 7 Z" />
      </g>
    </svg>
  )
}

function Dashes() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M5 12 L35 12" strokeDasharray="4 5" />
        <path d="M5 20 L27 20" strokeDasharray="4 5" />
        <path d="M5 28 L31 28" strokeDasharray="4 5" />
      </g>
    </svg>
  )
}

function Paperclip() {
  return (
    <svg viewBox="0 0 30 44" className="h-10 w-7" aria-hidden>
      <g {...stroke} strokeWidth={2}>
        <path d="M20 7 L20 31 C 20 38, 9 38, 9 31 L9 12 C 9 7, 16 7, 16 12 L16 30" />
      </g>
    </svg>
  )
}

/* ============================================================ large marks ==
   Taller drawings, 4rem to 5rem, with room for real detail. */

const lg = 'h-20 w-14'

function Fern() {
  return (
    <svg viewBox="0 0 60 110" className={lg} aria-hidden>
      <g {...stroke}>
        <path d="M30 106 C 29 76, 29 40, 33 6" />
        <path d="M30 95 C 20 93, 13 87, 12 80" />
        <path d="M30 95 C 40 92, 47 86, 48 79" />
        <path d="M30 82 C 21 80, 15 74, 14 68" />
        <path d="M30 82 C 39 79, 45 73, 46 67" />
        <path d="M30 69 C 22 67, 17 62, 16 56" />
        <path d="M30 69 C 38 66, 43 61, 44 55" />
        <path d="M31 56 C 24 54, 20 50, 19 45" />
        <path d="M31 56 C 38 53, 42 49, 43 44" />
        <path d="M31 43 C 25 41, 22 37, 21 33" />
        <path d="M31 43 C 37 41, 40 37, 41 33" />
        <path d="M32 30 C 27 29, 25 25, 24 22" />
        <path d="M32 30 C 36 28, 38 25, 39 21" />
      </g>
    </svg>
  )
}

function Monstera() {
  return (
    <svg viewBox="0 0 80 100" className="h-20 w-16" aria-hidden>
      <g {...stroke}>
        <path d="M40 96 C 40 82, 40 68, 40 58" />
        <path d="M40 58 C 14 55, 5 36, 12 18 C 26 8, 54 8, 68 18 C 75 36, 66 55, 40 58 Z" />
        <path d="M40 58 C 33 46, 26 36, 14 28" />
        <path d="M40 55 C 47 44, 54 35, 66 27" />
        <path d="M25 53 C 26 43, 29 33, 34 25" />
        <path d="M55 51 C 54 41, 51 32, 46 24" />
      </g>
    </svg>
  )
}

function PottedPlant() {
  return (
    <svg viewBox="0 0 60 110" className={lg} aria-hidden>
      <g {...stroke}>
        <path d="M18 74 L42 74 L38 104 L22 104 Z" />
        <path d="M15 66 L45 66 L45 74 L15 74 Z" />
        <path d="M30 66 C 30 52, 30 40, 30 28" />
        <path d="M30 56 C 18 54, 12 45, 13 37 C 23 38, 30 47, 30 56 Z" />
        <path d="M31 49 C 43 46, 48 38, 47 30 C 37 31, 31 41, 31 49 Z" />
        <path d="M30 37 C 24 31, 23 21, 27 15 C 33 20, 34 31, 30 37 Z" />
      </g>
    </svg>
  )
}

function Daisy() {
  return (
    <svg viewBox="0 0 60 110" className={lg} aria-hidden>
      <g {...stroke}>
        <path d="M30 106 C 29 84, 30 62, 30 46" />
        <path d="M30 86 C 19 84, 13 76, 14 68 C 23 70, 29 78, 30 86 Z" />
        <path d="M31 72 C 42 69, 47 61, 46 54 C 37 55, 31 64, 31 72 Z" />
        <circle cx="30" cy="30" r="6" />
        <ellipse cx="30" cy="15" rx="5" ry="9" />
        <ellipse cx="30" cy="15" rx="5" ry="9" transform="rotate(60 30 30)" />
        <ellipse cx="30" cy="15" rx="5" ry="9" transform="rotate(120 30 30)" />
        <ellipse cx="30" cy="15" rx="5" ry="9" transform="rotate(180 30 30)" />
        <ellipse cx="30" cy="15" rx="5" ry="9" transform="rotate(240 30 30)" />
        <ellipse cx="30" cy="15" rx="5" ry="9" transform="rotate(300 30 30)" />
      </g>
    </svg>
  )
}

function Blossom() {
  return (
    <svg viewBox="0 0 60 110" className={lg} aria-hidden>
      <g {...stroke}>
        <path d="M30 106 C 30 84, 30 64, 30 48" />
        <path d="M30 82 C 20 80, 14 72, 15 65 C 24 66, 30 74, 30 82 Z" />
        <path d="M31 68 C 41 65, 46 58, 45 51 C 36 52, 31 60, 31 68 Z" />
        <circle cx="30" cy="32" r="5" />
        <ellipse cx="30" cy="18" rx="7.5" ry="9.5" />
        <ellipse cx="30" cy="18" rx="7.5" ry="9.5" transform="rotate(72 30 32)" />
        <ellipse cx="30" cy="18" rx="7.5" ry="9.5" transform="rotate(144 30 32)" />
        <ellipse cx="30" cy="18" rx="7.5" ry="9.5" transform="rotate(216 30 32)" />
        <ellipse cx="30" cy="18" rx="7.5" ry="9.5" transform="rotate(288 30 32)" />
      </g>
    </svg>
  )
}

function Cactus() {
  return (
    <svg viewBox="0 0 60 110" className={lg} aria-hidden>
      <g {...stroke}>
        <path d="M24 88 C 20 78, 20 44, 22 33 C 24 22, 38 22, 40 33 C 42 44, 42 78, 38 88 Z" />
        <path d="M22 58 C 12 58, 9 51, 9 43 C 9 38, 15 38, 15 43 C 15 50, 17 53, 22 53" />
        <path d="M40 50 C 49 50, 52 44, 52 37 C 52 33, 47 33, 47 37 C 47 43, 45 46, 40 46" />
        <path d="M18 88 L44 88 L41 104 L21 104 Z" />
        <circle cx="31" cy="18" r="4" />
      </g>
    </svg>
  )
}

function PalmFrond() {
  return (
    <svg viewBox="0 0 60 110" className={lg} aria-hidden>
      <g {...stroke}>
        <path d="M28 106 C 29 78, 31 42, 36 8" />
        <path d="M29 92 C 18 88, 12 78, 12 68 C 23 72, 29 82, 29 92 Z" />
        <path d="M30 92 C 41 87, 47 77, 46 67 C 36 72, 30 82, 30 92 Z" />
        <path d="M31 74 C 21 70, 16 60, 17 51 C 27 56, 31 65, 31 74 Z" />
        <path d="M32 74 C 42 69, 46 60, 45 51 C 36 56, 32 65, 32 74 Z" />
        <path d="M33 56 C 25 52, 22 44, 23 36 C 31 41, 34 49, 33 56 Z" />
        <path d="M34 56 C 42 51, 45 43, 44 36 C 36 41, 33 49, 34 56 Z" />
        <path d="M35 38 C 30 34, 28 27, 29 21 C 35 26, 37 33, 35 38 Z" />
      </g>
    </svg>
  )
}

function Seaweed() {
  return (
    <svg viewBox="0 0 60 110" className={lg} aria-hidden>
      <g {...stroke}>
        <path d="M21 106 C 11 88, 29 74, 19 56 C 11 40, 27 26, 23 8" />
        <path d="M39 106 C 47 90, 33 76, 43 60 C 51 46, 39 32, 43 14" />
        <circle cx="13" cy="52" r="2.6" />
        <circle cx="50" cy="42" r="2.6" />
        <circle cx="15" cy="26" r="2.2" />
      </g>
    </svg>
  )
}

function BerryBranch() {
  return (
    <svg viewBox="0 0 60 110" className={lg} aria-hidden>
      <g {...stroke}>
        <path d="M28 106 C 27 80, 29 46, 34 8" />
        <path d="M28 88 C 17 85, 12 77, 13 69 C 22 71, 28 80, 28 88 Z" />
        <path d="M30 66 C 41 63, 46 55, 45 47 C 36 49, 30 58, 30 66 Z" />
        <path d="M32 44 C 23 41, 19 34, 20 27 C 28 29, 33 37, 32 44 Z" />
        <circle cx="42" cy="78" r="4.5" />
        <circle cx="20" cy="56" r="4.5" />
        <circle cx="40" cy="34" r="4.5" />
        <circle cx="33" cy="16" r="4.5" />
      </g>
    </svg>
  )
}

function Wildflowers() {
  return (
    <svg viewBox="0 0 80 110" className="h-20 w-16" aria-hidden>
      <g {...stroke}>
        <path d="M40 106 C 35 84, 28 66, 21 51" />
        <path d="M40 106 C 40 80, 40 60, 40 40" />
        <path d="M40 106 C 45 84, 53 66, 60 53" />
        <path d="M36 78 C 27 76, 22 69, 23 62 C 31 64, 36 71, 36 78 Z" />
        <path d="M44 68 C 53 66, 58 59, 57 52 C 49 54, 44 61, 44 68 Z" />
        <circle cx="17" cy="46" r="3.4" />
        <circle cx="24" cy="43" r="3.4" />
        <circle cx="20" cy="36" r="3.4" />
        <circle cx="40" cy="33" r="3.6" />
        <ellipse cx="40" cy="24" rx="4" ry="6" />
        <ellipse cx="40" cy="24" rx="4" ry="6" transform="rotate(72 40 33)" />
        <ellipse cx="40" cy="24" rx="4" ry="6" transform="rotate(144 40 33)" />
        <ellipse cx="40" cy="24" rx="4" ry="6" transform="rotate(216 40 33)" />
        <ellipse cx="40" cy="24" rx="4" ry="6" transform="rotate(288 40 33)" />
        <circle cx="62" cy="47" r="3.2" />
        <circle cx="57" cy="41" r="3.2" />
        <circle cx="64" cy="38" r="3.2" />
      </g>
    </svg>
  )
}

function BigShell() {
  return (
    <svg viewBox="0 0 80 70" className="h-16 w-16" aria-hidden>
      <g {...stroke}>
        <path d="M40 64 C 10 56, 4 28, 15 12 C 27 3, 53 3, 65 12 C 76 28, 70 56, 40 64 Z" />
        <path d="M40 64 L16 16" />
        <path d="M40 64 L27 8" />
        <path d="M40 64 L40 5" />
        <path d="M40 64 L53 8" />
        <path d="M40 64 L64 16" />
      </g>
    </svg>
  )
}

function Starfish() {
  return (
    <svg viewBox="0 0 80 80" className="h-16 w-16" aria-hidden>
      <g {...stroke}>
        <path d="M40 6 L51 30 L77 33 L58 50 L63 76 L40 63 L17 76 L22 50 L3 33 L29 30 Z" />
        <circle cx="40" cy="38" r="2" />
        <circle cx="33" cy="48" r="1.8" />
        <circle cx="47" cy="48" r="1.8" />
      </g>
    </svg>
  )
}

function Teacup() {
  return (
    <svg viewBox="0 0 80 70" className="h-16 w-16" aria-hidden>
      <g {...stroke}>
        <path d="M14 26 L58 26 C 56 46, 50 57, 36 57 C 22 57, 16 46, 14 26 Z" />
        <path d="M58 31 C 69 29, 71 42, 60 46" />
        <path d="M8 63 L68 63" />
        <path d="M28 19 C 32 14, 24 10, 28 4" />
        <path d="M42 19 C 46 14, 38 10, 42 4" />
      </g>
    </svg>
  )
}

function StarBurst() {
  return (
    <svg viewBox="0 0 80 80" className="h-16 w-16" aria-hidden>
      <g {...stroke}>
        <circle cx="40" cy="40" r="9" />
        <path d="M40 4 L40 20" />
        <path d="M40 60 L40 76" />
        <path d="M4 40 L20 40" />
        <path d="M60 40 L76 40" />
        <path d="M15 15 L26 26" />
        <path d="M54 54 L65 65" />
        <path d="M65 15 L54 26" />
        <path d="M26 54 L15 65" />
      </g>
    </svg>
  )
}

function Loops() {
  return (
    <svg viewBox="0 0 60 110" className={lg} aria-hidden>
      <g {...stroke}>
        <path d="M30 6 C 12 18, 12 36, 30 34 C 47 32, 47 53, 30 57 C 13 61, 13 81, 30 85 C 41 87, 43 97, 34 104" />
      </g>
    </svg>
  )
}

function Banner() {
  return (
    <svg viewBox="0 0 120 40" className="h-10 w-24" aria-hidden>
      <g {...stroke}>
        <path d="M10 8 L110 8 L100 22 L110 36 L10 36 L20 22 Z" />
        <path d="M34 22 L88 22" strokeDasharray="2 6" />
      </g>
    </svg>
  )
}

function SpeechBubble() {
  return (
    <svg viewBox="0 0 120 72" className="h-14 w-24" aria-hidden>
      <g {...stroke}>
        <path d="M18 8 L102 8 C 110 8, 114 12, 114 20 L114 44 C 114 52, 110 56, 102 56 L42 56 L22 70 L28 56 L18 56 C 10 56, 6 52, 6 44 L6 20 C 6 12, 10 8, 18 8 Z" />
        <circle cx="42" cy="32" r="2.4" />
        <circle cx="60" cy="32" r="2.4" />
        <circle cx="78" cy="32" r="2.4" />
      </g>
    </svg>
  )
}

function NoteCard() {
  return (
    <svg viewBox="0 0 120 80" className="h-14 w-24" aria-hidden>
      <g {...stroke}>
        <path d="M8 10 L96 10 L112 26 L112 70 L8 70 Z" />
        <path d="M96 10 L96 26 L112 26" />
        <path d="M20 40 L96 40" strokeDasharray="3 5" />
        <path d="M20 50 L88 50" strokeDasharray="3 5" />
        <path d="M20 60 L66 60" strokeDasharray="3 5" />
      </g>
    </svg>
  )
}

/* ========================================================================== */

type Mark = { node: React.ReactElement; rotate: number; phone?: boolean }

const mark = (node: React.ReactElement, rotate: number, phone?: boolean): Mark => ({
  node,
  rotate,
  phone,
})

/**
 * Each set is two columns, left and right, read top to bottom. Sizes are meant
 * to alternate: a big drawing, a small one, a big one. The first and last of
 * each column are the phone-safe ones -- they sit in the corners.
 */
const SETS: Record<Exclude<DoodleSet, 'none'>, { left: Mark[]; right: Mark[] }> = {
  // Deliberately bare: two small marks a side, so the gaps are enormous.
  minimalist: {
    left: [mark(<Leaf />, -6, true), mark(<Dots />, 0, true)],
    right: [mark(<TinyFlower />, 5, true), mark(<Leaf />, 8, true)],
  },
  cozy: {
    left: [
      mark(<Teacup />, -4, true),
      mark(<Heart />, 6),
      mark(<Daisy />, -3),
      mark(<Sparkle />, 10),
      mark(<Banner />, -2),
      mark(<TinyFlower />, 7, true),
    ],
    right: [
      mark(<Heart />, -8, true),
      mark(<PottedPlant />, 4),
      mark(<Dots />, 0),
      mark(<Blossom />, -5),
      mark(<Sparkle />, 12),
      mark(<Cherries />, -6, true),
    ],
  },
  whimsical: {
    left: [
      mark(<StarBurst />, 6, true),
      mark(<Star />, -10),
      mark(<Loops />, 3),
      mark(<Sparkle />, 14),
      mark(<SpeechBubble />, -3),
      mark(<Dots />, 0, true),
    ],
    right: [
      mark(<Sparkle />, -12, true),
      mark(<Loops />, -4),
      mark(<Arrow />, 8),
      mark(<StarBurst />, -6),
      mark(<Curl />, 10),
      mark(<Banner />, 3, true),
    ],
  },
  botanical: {
    left: [
      mark(<Fern />, -4, true),
      mark(<Leaf />, 8),
      mark(<Monstera />, 5),
      mark(<BerryTrio />, -6),
      mark(<PottedPlant />, -3),
      mark(<Dots />, 0, true),
    ],
    right: [
      mark(<Leaf />, -9, true),
      mark(<Wildflowers />, 4),
      mark(<TinyFlower />, 7),
      mark(<Fern />, 6),
      mark(<BerryTrio />, -5),
      mark(<Cactus />, -2, true),
    ],
  },
  seaside: {
    left: [
      mark(<PalmFrond />, -5, true),
      mark(<SmallShell />, 8),
      mark(<Starfish />, -7),
      mark(<Ripples />, 0),
      mark(<Seaweed />, 4),
      mark(<SmallShell />, -10, true),
    ],
    right: [
      mark(<Ripples />, 0, true),
      mark(<BigShell />, 6),
      mark(<Dots />, 0),
      mark(<Seaweed />, -4),
      mark(<SmallShell />, 9),
      mark(<Starfish />, 5, true),
    ],
  },
  berry: {
    left: [
      mark(<BerryBranch />, -4, true),
      mark(<Cherries />, 7),
      mark(<Blossom />, 3),
      mark(<BerryTrio />, -8),
      mark(<Wildflowers />, 5),
      mark(<Leaf />, 10, true),
    ],
    right: [
      mark(<Cherries />, -9, true),
      mark(<Daisy />, 4),
      mark(<TinyFlower />, 6),
      mark(<BerryBranch />, -3),
      mark(<Heart />, 8),
      mark(<Blossom />, -5, true),
    ],
  },
  typewriter: {
    left: [
      mark(<NoteCard />, -3, true),
      mark(<Asterisk />, 0),
      mark(<Dots />, 0),
      mark(<Dashes />, 2),
      mark(<Paperclip />, -12),
      mark(<Asterisk />, 0, true),
    ],
    right: [
      mark(<Dashes />, -2, true),
      mark(<Paperclip />, 9),
      mark(<Asterisk />, 0),
      mark(<NoteCard />, 4),
      mark(<Dots />, 0),
      mark(<Dashes />, 3, true),
    ],
  },
}

/**
 * One margin. `justify-between` does the spacing, so nothing can overlap and a
 * short set simply spreads further apart.
 */
function Margin({
  side,
  marks,
  onPhone,
}: {
  side: 'left' | 'right'
  marks: Mark[]
  onPhone: boolean
}) {
  return (
    <div
      className={`absolute inset-y-0 ${side === 'left' ? 'left-0' : 'right-0'} w-24
        flex-col items-center justify-between py-6 ${onPhone ? 'flex' : 'hidden xl:flex'}`}
    >
      {marks.map((m, i) => (
        <div
          key={i}
          className={onPhone && !m.phone ? 'hidden xl:block' : undefined}
          style={{ transform: `rotate(${m.rotate}deg)` }}
        >
          {m.node}
        </div>
      ))}
    </div>
  )
}

export default function Doodles({ set, onPhone }: { set: DoodleSet; onPhone: boolean }) {
  if (set === 'none') return null
  const columns = SETS[set]
  if (!columns) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 select-none text-ink-faint opacity-40"
    >
      <Margin side="left" marks={columns.left} onPhone={onPhone} />
      <Margin side="right" marks={columns.right} onPhone={onPhone} />
    </div>
  )
}
