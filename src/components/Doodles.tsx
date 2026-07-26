import type { DoodleSet } from '../lib/theme'

/**
 * Pen marks down both margins, the way a journal page collects them.
 *
 * SVG rather than background images: the strokes inherit the theme's ink
 * colour through currentColor, so one drawing works across every palette in
 * both light and dark. Images would need one variant per palette and would
 * still be wrong the moment a colour changed.
 *
 * Every theme has its own drawings -- nothing is shared between sets, so
 * choosing Seaside gets you shells and nothing that also turns up in Berry.
 * Each set is four small marks and four large ones, arranged down two columns
 * so a margin alternates between them.
 *
 * Overlap is prevented by construction, not by arithmetic: a margin is a
 * full-height flex column with `justify-between`, so the browser spaces
 * whatever it is given from the top of the screen to the bottom and two
 * drawings can never land on each other. Fewer drawings simply means bigger
 * gaps -- which is exactly what the minimalist set wants.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Small marks are all on a 40x40 grid, drawn in a 2.5rem box. */
const sm = 'h-10 w-10'
/** Tall drawings: a 60x110 grid in a 5rem box. */
const tall = 'h-20 w-14'
/** Square drawings: an 80x80 grid in a 4rem box. */
const sq = 'h-16 w-16'

/* ========================================================== 1. MINIMALIST ==
   Four small marks and nothing else. */

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

function Tick() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke} strokeWidth={2}>
        <path d="M8 21 L17 31 L33 9" />
      </g>
    </svg>
  )
}

function Flourish() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M4 26 C 12 13, 20 29, 28 17 C 31 12, 34 12, 37 11" strokeDasharray="1 6" />
      </g>
    </svg>
  )
}

/* ================================================================ 2. COZY ==
   The kitchen table: tea, books, candlelight, a jar of flowers. */

function Heart() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 35 C 7 26, 3 16, 10 9 C 15 4.5, 20 8, 20 12.5 C 20 8, 25 4.5, 30 9 C 37 16, 33 26, 20 35 Z" />
      </g>
    </svg>
  )
}

function Bow() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 18 L23 21 L20 24 L17 21 Z" />
        <path d="M18 20 C 11 11, 3 14, 5 21 C 7 27, 15 26, 18 21" />
        <path d="M22 20 C 29 11, 37 14, 35 21 C 33 27, 25 26, 22 21" />
        <path d="M18 24 C 15 30, 13 33, 10 36" />
        <path d="M22 24 C 25 30, 27 33, 30 36" />
      </g>
    </svg>
  )
}

function TeaBag() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M22 4 L34 4 L34 12 L22 12 Z" />
        <path d="M28 12 C 28 18, 17 18, 17 23" />
        <path d="M9 23 L25 23 L23 35 L11 35 Z" />
      </g>
    </svg>
  )
}

function SmallDaisy() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <circle cx="20" cy="20" r="3.2" />
        <ellipse cx="20" cy="10" rx="3.6" ry="6" />
        <ellipse cx="20" cy="10" rx="3.6" ry="6" transform="rotate(60 20 20)" />
        <ellipse cx="20" cy="10" rx="3.6" ry="6" transform="rotate(120 20 20)" />
        <ellipse cx="20" cy="10" rx="3.6" ry="6" transform="rotate(180 20 20)" />
        <ellipse cx="20" cy="10" rx="3.6" ry="6" transform="rotate(240 20 20)" />
        <ellipse cx="20" cy="10" rx="3.6" ry="6" transform="rotate(300 20 20)" />
      </g>
    </svg>
  )
}

function Teapot() {
  return (
    <svg viewBox="0 0 80 80" className={sq} aria-hidden>
      <g {...stroke}>
        <path d="M16 34 C 16 56, 26 66, 40 66 C 54 66, 64 56, 64 34 Z" />
        <path d="M28 34 C 29 26, 51 26, 52 34" />
        <path d="M40 26 L40 21" />
        <path d="M16 40 C 8 41, 4 49, 6 57" />
        <path d="M64 38 C 74 36, 76 52, 65 56" />
        <path d="M32 20 C 36 15, 28 11, 32 5" />
        <path d="M48 20 C 52 15, 44 11, 48 5" />
      </g>
    </svg>
  )
}

function BookStack() {
  return (
    <svg viewBox="0 0 80 70" className="h-14 w-16" aria-hidden>
      <g {...stroke}>
        <path d="M10 46 L70 46 L70 58 L10 58 Z" />
        <path d="M15 52 L65 52" strokeDasharray="3 5" />
        <path d="M14 34 L66 34 L66 46 L14 46 Z" />
        <path d="M19 40 L61 40" strokeDasharray="3 5" />
        <path d="M8 22 L62 22 L62 34 L8 34 Z" />
        <path d="M54 22 L54 31 L50 28 L46 31 L46 22" />
      </g>
    </svg>
  )
}

function Candle() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
      <g {...stroke}>
        <path d="M22 40 L38 40 L38 92 L22 92 Z" />
        <path d="M30 40 L30 34" />
        <path d="M30 34 C 24 28, 26 18, 30 11 C 34 18, 36 28, 30 34 Z" />
        <path d="M14 92 L46 92 L42 103 L18 103 Z" />
        <path d="M25 46 C 23 52, 23 57, 25 62" />
      </g>
    </svg>
  )
}

function FlowerJar() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
      <g {...stroke}>
        <path d="M18 62 L42 62 L40 101 L20 101 Z" />
        <path d="M16 56 L44 56 L44 62 L16 62 Z" />
        <path d="M21 79 L39 79" strokeDasharray="3 4" />
        <path d="M30 62 C 29 48, 27 38, 24 29" />
        <path d="M30 62 C 32 50, 36 40, 40 32" />
        <path d="M30 62 C 30 52, 30 44, 30 36" />
        <circle cx="23" cy="24" r="2.4" />
        <ellipse cx="23" cy="17" rx="2.8" ry="4.6" />
        <ellipse cx="23" cy="17" rx="2.8" ry="4.6" transform="rotate(72 23 24)" />
        <ellipse cx="23" cy="17" rx="2.8" ry="4.6" transform="rotate(144 23 24)" />
        <ellipse cx="23" cy="17" rx="2.8" ry="4.6" transform="rotate(216 23 24)" />
        <ellipse cx="23" cy="17" rx="2.8" ry="4.6" transform="rotate(288 23 24)" />
        <circle cx="41" cy="28" r="2.2" />
        <ellipse cx="41" cy="22" rx="2.6" ry="4.2" />
        <ellipse cx="41" cy="22" rx="2.6" ry="4.2" transform="rotate(72 41 28)" />
        <ellipse cx="41" cy="22" rx="2.6" ry="4.2" transform="rotate(144 41 28)" />
        <ellipse cx="41" cy="22" rx="2.6" ry="4.2" transform="rotate(216 41 28)" />
        <ellipse cx="41" cy="22" rx="2.6" ry="4.2" transform="rotate(288 41 28)" />
        <path d="M30 36 C 26 32, 26 25, 30 21 C 34 25, 34 32, 30 36 Z" />
        <path d="M30 54 C 22 52, 18 46, 19 41 C 25 43, 29 49, 30 54 Z" />
      </g>
    </svg>
  )
}

/* =========================================================== 3. WHIMSICAL ==
   Loud and bouncy: bursts, loops, bunting. */

function Sparkle() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 3 C 21.5 13, 27 18.5, 37 20 C 27 21.5, 21.5 27, 20 37 C 18.5 27, 13 21.5, 3 20 C 13 18.5, 18.5 13, 20 3 Z" />
      </g>
    </svg>
  )
}

function Squiggle() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M4 20 C 8 9, 14 9, 16 20 C 18 31, 24 31, 26 20 C 28 11, 34 11, 36 20" />
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

function Confetti() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M8 9 L13 15" />
        <path d="M21 5 L21 13" />
        <path d="M32 11 L27 17" />
        <path d="M11 27 L16 33" />
        <path d="M30 26 L25 33" />
        <path d="M19 24 L19 30" />
      </g>
    </svg>
  )
}

function StarBurst() {
  return (
    <svg viewBox="0 0 80 80" className={sq} aria-hidden>
      <g {...stroke}>
        <path d="M40 26 L46 36 L58 38 L49 47 L51 59 L40 53 L29 59 L31 47 L22 38 L34 36 Z" />
        <path d="M40 4 L40 14" />
        <path d="M40 66 L40 76" />
        <path d="M4 40 L14 40" />
        <path d="M66 40 L76 40" />
        <path d="M14 14 L21 21" />
        <path d="M59 59 L66 66" />
        <path d="M66 14 L59 21" />
        <path d="M21 59 L14 66" />
      </g>
    </svg>
  )
}

function Loops() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
      <g {...stroke}>
        <path d="M30 6 C 12 18, 12 36, 30 34 C 47 32, 47 53, 30 57 C 13 61, 13 81, 30 85 C 41 87, 43 97, 34 104" />
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

function Bunting() {
  return (
    <svg viewBox="0 0 120 50" className="h-12 w-24" aria-hidden>
      <g {...stroke}>
        <path d="M4 10 C 32 24, 88 24, 116 10" />
        <path d="M20 15 L38 19 L28 34 Z" />
        <path d="M46 20 L64 21 L55 36 Z" />
        <path d="M72 20 L90 16 L82 32 Z" />
      </g>
    </svg>
  )
}

/* =========================================================== 4. BOTANICAL ==
   Houseplants and hedgerow. */

function LeafPair() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 37 C 20 26, 20 16, 22 6" />
        <path d="M20 27 C 12 25, 8 19, 9 14 C 16 15, 20 21, 20 27 Z" />
        <path d="M21 20 C 29 18, 33 12, 32 7 C 25 8, 21 14, 21 20 Z" />
      </g>
    </svg>
  )
}

function Sprout() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 36 L20 20" />
        <path d="M20 22 C 12 22, 7 17, 8 11 C 15 11, 20 16, 20 22 Z" />
        <path d="M20 22 C 28 22, 33 17, 32 11 C 25 11, 20 16, 20 22 Z" />
        <path d="M8 36 L32 36" strokeDasharray="3 4" />
      </g>
    </svg>
  )
}

function Bud() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 37 L20 22" />
        <path d="M20 22 C 13 18, 12 10, 16 4 C 20 8, 22 15, 20 22 Z" />
        <path d="M20 22 C 27 18, 28 10, 24 4 C 20 8, 18 15, 20 22 Z" />
        <path d="M20 31 C 14 30, 11 26, 12 22 C 17 23, 20 27, 20 31 Z" />
      </g>
    </svg>
  )
}

function Acorn() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M12 19 C 12 30, 16 36, 20 36 C 24 36, 28 30, 28 19 Z" />
        <path d="M10 19 C 10 13, 30 13, 30 19 Z" />
        <path d="M12 16 L28 16" strokeDasharray="2 3" />
        <path d="M20 13 L20 6" />
      </g>
    </svg>
  )
}

function Fern() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
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
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
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

function Eucalyptus() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
      <g {...stroke}>
        <path d="M30 106 C 29 78, 30 44, 34 8" />
        <ellipse cx="17" cy="91" rx="8" ry="6" transform="rotate(-25 17 91)" />
        <ellipse cx="43" cy="85" rx="8" ry="6" transform="rotate(25 43 85)" />
        <ellipse cx="18" cy="72" rx="7.5" ry="5.5" transform="rotate(-25 18 72)" />
        <ellipse cx="43" cy="66" rx="7.5" ry="5.5" transform="rotate(25 43 66)" />
        <ellipse cx="20" cy="53" rx="7" ry="5" transform="rotate(-25 20 53)" />
        <ellipse cx="42" cy="47" rx="7" ry="5" transform="rotate(25 42 47)" />
        <ellipse cx="24" cy="34" rx="6" ry="4.5" transform="rotate(-25 24 34)" />
        <ellipse cx="40" cy="28" rx="6" ry="4.5" transform="rotate(25 40 28)" />
      </g>
    </svg>
  )
}

/* ============================================================= 5. SEASIDE ==
   Shells, water and a boat. */

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

function Pebbles() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <ellipse cx="21" cy="17" rx="7" ry="5" transform="rotate(-12 21 17)" />
        <ellipse cx="13" cy="29" rx="8" ry="5.5" transform="rotate(8 13 29)" />
        <ellipse cx="28" cy="30" rx="6" ry="4.5" transform="rotate(-6 28 30)" />
      </g>
    </svg>
  )
}

function SmallStarfish() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M20 4 L25 16 L38 17 L28 25 L31 37 L20 30 L9 37 L12 25 L2 17 L15 16 Z" />
        <circle cx="20" cy="21" r="1.4" />
      </g>
    </svg>
  )
}

function Conch() {
  return (
    <svg viewBox="0 0 80 80" className={sq} aria-hidden>
      <g {...stroke}>
        <path d="M14 46 C 10 26, 30 10, 50 16 C 66 21, 73 40, 62 56 C 54 68, 34 73, 24 64" />
        <path d="M24 64 C 16 58, 13 52, 14 46" />
        <path d="M40 57 C 28 57, 22 47, 26 39 C 30 31, 42 31, 46 39" />
        <path d="M22 31 L17 25" />
        <path d="M34 19 L32 12" />
        <path d="M50 20 L53 13" />
      </g>
    </svg>
  )
}

function PalmFrond() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
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
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
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

function Sailboat() {
  return (
    <svg viewBox="0 0 80 80" className={sq} aria-hidden>
      <g {...stroke}>
        <path d="M40 54 L40 8" />
        <path d="M42 13 C 55 24, 59 40, 59 52 L42 52 Z" />
        <path d="M38 18 C 28 28, 24 40, 24 52 L38 52 Z" />
        <path d="M10 54 L70 54 L60 67 L20 67 Z" />
        <path d="M6 74 C 14 70, 22 78, 30 74 C 38 70, 46 78, 54 74 C 62 70, 68 76, 74 72" />
      </g>
    </svg>
  )
}

/* =============================================================== 6. BERRY ==
   Fruit, blossom and vine. */

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

function SingleBerry() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M21 5 C 20 11, 20 15, 20 20" />
        <circle cx="20" cy="28" r="8" />
        <path d="M21 11 C 27 6, 34 8, 35 13 C 29 18, 23 16, 21 11 Z" />
      </g>
    </svg>
  )
}

function SmallBlossom() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <circle cx="20" cy="20" r="3" />
        <ellipse cx="20" cy="11" rx="5" ry="5.5" />
        <ellipse cx="20" cy="11" rx="5" ry="5.5" transform="rotate(72 20 20)" />
        <ellipse cx="20" cy="11" rx="5" ry="5.5" transform="rotate(144 20 20)" />
        <ellipse cx="20" cy="11" rx="5" ry="5.5" transform="rotate(216 20 20)" />
        <ellipse cx="20" cy="11" rx="5" ry="5.5" transform="rotate(288 20 20)" />
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

function BerryBranch() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
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

function BlossomStem() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
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

function GrapeCluster() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
      <g {...stroke}>
        <path d="M30 34 C 30 24, 32 16, 35 8" />
        <path d="M35 14 C 44 8, 53 11, 54 17 C 46 23, 37 20, 35 14 Z" />
        <circle cx="30" cy="42" r="7" />
        <circle cx="20" cy="53" r="7" />
        <circle cx="40" cy="53" r="7" />
        <circle cx="14" cy="65" r="7" />
        <circle cx="30" cy="65" r="7" />
        <circle cx="46" cy="65" r="7" />
        <circle cx="21" cy="77" r="7" />
        <circle cx="38" cy="77" r="7" />
        <circle cx="29" cy="89" r="7" />
      </g>
    </svg>
  )
}

function Vine() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
      <g {...stroke}>
        <path d="M30 4 C 45 20, 15 34, 30 50 C 45 66, 15 80, 30 96 C 36 103, 33 106, 30 108" />
        <path d="M38 13 C 47 10, 52 15, 51 21 C 43 24, 37 20, 38 13 Z" />
        <path d="M20 32 C 11 30, 7 35, 9 41 C 17 42, 22 38, 20 32 Z" />
        <path d="M39 60 C 48 57, 53 62, 52 68 C 44 70, 38 66, 39 60 Z" />
        <path d="M20 78 C 11 76, 7 81, 9 87 C 17 88, 22 84, 20 78 Z" />
      </g>
    </svg>
  )
}

/* ========================================================== 7. TYPEWRITER ==
   The desk: typed marks, clips, cards, a pencil. */

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

function Ellipsis() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <circle cx="9" cy="20" r="2.4" />
        <circle cx="20" cy="20" r="2.4" />
        <circle cx="31" cy="20" r="2.4" />
      </g>
    </svg>
  )
}

function QuoteMarks() {
  return (
    <svg viewBox="0 0 40 40" className={sm} aria-hidden>
      <g {...stroke}>
        <path d="M11 27 C 5 25, 5 15, 13 12 C 10 17, 9 21, 13 22 C 16 23, 16 27, 11 27 Z" />
        <path d="M27 27 C 21 25, 21 15, 29 12 C 26 17, 25 21, 29 22 C 32 23, 32 27, 27 27 Z" />
      </g>
    </svg>
  )
}

function IndexCard() {
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

function Paperclip() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
      <g {...stroke} strokeWidth={2.2}>
        <path d="M40 16 L40 78 C 40 93, 18 93, 18 78 L18 30 C 18 19, 31 19, 31 30 L31 76" />
      </g>
    </svg>
  )
}

function TypedPage() {
  return (
    <svg viewBox="0 0 80 110" className={tall} aria-hidden>
      <g {...stroke}>
        <path d="M10 8 L58 8 L70 20 L70 102 L10 102 Z" />
        <path d="M58 8 L58 20 L70 20" />
        <path d="M20 34 L60 34" strokeDasharray="3 4" />
        <path d="M20 46 L60 46" strokeDasharray="3 4" />
        <path d="M20 58 L52 58" strokeDasharray="3 4" />
        <path d="M20 70 L60 70" strokeDasharray="3 4" />
        <path d="M20 82 L44 82" strokeDasharray="3 4" />
      </g>
    </svg>
  )
}

function Pencil() {
  return (
    <svg viewBox="0 0 60 110" className={tall} aria-hidden>
      <g {...stroke}>
        <path d="M22 12 L38 12 L38 84 L30 98 L22 84 Z" />
        <path d="M22 20 L38 20" />
        <path d="M22 84 L38 84" />
        <path d="M27 91 L33 91" />
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
 * Each set is two columns, read top to bottom, alternating large and small.
 * The first and last of each column are the phone-safe ones -- they sit in the
 * corners, clear of the content.
 */
const SETS: Record<Exclude<DoodleSet, 'none'>, { left: Mark[]; right: Mark[] }> = {
  // Deliberately bare: two small marks a side, so the gaps are enormous.
  minimalist: {
    left: [mark(<Leaf />, -6, true), mark(<Dots />, 0, true)],
    right: [mark(<Tick />, 5, true), mark(<Flourish />, -3, true)],
  },
  cozy: {
    left: [
      mark(<Teapot />, -4, true),
      mark(<Heart />, 7),
      mark(<BookStack />, 3),
      mark(<Bow />, -8),
      mark(<FlowerJar />, -2),
      mark(<TeaBag />, 6, true),
    ],
    right: [
      mark(<SmallDaisy />, 5, true),
      mark(<Candle />, -3),
      mark(<TeaBag />, -7),
      mark(<Teapot />, 4),
      mark(<Heart />, -6),
      mark(<BookStack />, -2, true),
    ],
  },
  whimsical: {
    left: [
      mark(<StarBurst />, 8, true),
      mark(<Sparkle />, -10),
      mark(<Loops />, 3),
      mark(<Squiggle />, 12),
      mark(<Bunting />, -3),
      mark(<Confetti />, 0, true),
    ],
    right: [
      mark(<Arrow />, -12, true),
      mark(<SpeechBubble />, 4),
      mark(<Confetti />, 0),
      mark(<Loops />, -5),
      mark(<Sparkle />, 14),
      mark(<StarBurst />, -6, true),
    ],
  },
  botanical: {
    left: [
      mark(<Fern />, -4, true),
      mark(<LeafPair />, 8),
      mark(<Monstera />, 5),
      mark(<Sprout />, -6),
      mark(<Eucalyptus />, -3),
      mark(<Acorn />, 9, true),
    ],
    right: [
      mark(<Bud />, -9, true),
      mark(<PottedPlant />, 4),
      mark(<Acorn />, 6),
      mark(<Eucalyptus />, 3),
      mark(<LeafPair />, -5),
      mark(<Fern />, 6, true),
    ],
  },
  seaside: {
    left: [
      mark(<Conch />, -5, true),
      mark(<Ripples />, 0),
      mark(<PalmFrond />, 4),
      mark(<Pebbles />, 0),
      mark(<Seaweed />, -3),
      mark(<SmallShell />, 8, true),
    ],
    right: [
      mark(<SmallStarfish />, -7, true),
      mark(<Sailboat />, 3),
      mark(<SmallShell />, -9),
      mark(<Seaweed />, 5),
      mark(<Ripples />, 0),
      mark(<PalmFrond />, -4, true),
    ],
  },
  berry: {
    left: [
      mark(<BerryBranch />, -4, true),
      mark(<Cherries />, 7),
      mark(<GrapeCluster />, 3),
      mark(<SmallBlossom />, -8),
      mark(<Vine />, 2),
      mark(<BerryTrio />, 9, true),
    ],
    right: [
      mark(<SingleBerry />, -6, true),
      mark(<BlossomStem />, 4),
      mark(<BerryTrio />, -7),
      mark(<GrapeCluster />, -3),
      mark(<Cherries />, 8),
      mark(<BerryBranch />, 5, true),
    ],
  },
  typewriter: {
    left: [
      mark(<IndexCard />, -3, true),
      mark(<Asterisk />, 0),
      mark(<Paperclip />, -10),
      mark(<Dashes />, 2),
      mark(<TypedPage />, 3),
      mark(<Ellipsis />, 0, true),
    ],
    right: [
      mark(<QuoteMarks />, 0, true),
      mark(<Pencil />, 8),
      mark(<Ellipsis />, 0),
      mark(<IndexCard />, 4),
      mark(<Dashes />, -2),
      mark(<Paperclip />, 11, true),
    ],
  },
}

/**
 * One margin. `justify-between` does the spacing, so nothing can overlap and a
 * short set simply spreads further apart.
 *
 * The column stops short of both ends of the screen on purpose: the sticky
 * header covers the top and the totals bar covers the bottom, and a sparse set
 * puts its only two marks exactly there -- where they were invisible.
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
      // Inline rather than a Tailwind arbitrary value: the class doesn't
      // survive the scanner inside a template literal, and silently not
      // compiling is worse than being verbose.
      style={{ top: 'calc(var(--header-h, 3.25rem) + 1rem)', bottom: '5.5rem' }}
      className={`absolute ${side === 'left' ? 'left-0' : 'right-0'} w-24 flex-col
        items-center justify-between ${onPhone ? 'flex' : 'hidden xl:flex'}`}
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
