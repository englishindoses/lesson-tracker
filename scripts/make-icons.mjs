// Generates the PWA icons as PNGs with no image library: we build the raw
// pixels, deflate them, and write the three PNG chunks by hand.
// Run with:  node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const PAPER = [0xf6, 0xf2, 0xe7]
const GRID = [0xd9, 0xd0, 0xba]
const INK = [0x2b, 0x2a, 0x26]

/** Distance from point p to the segment ab, used to draw thick round lines. */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function render(size) {
  const s = size / 64 // the favicon.svg is authored on a 64x64 grid
  const px = Buffer.alloc(size * size * 3)

  const dots = [16, 32, 48]
  const stroke = [
    [14, 34, 27, 46],
    [27, 46, 50, 17],
  ]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const ux = x / s
      const uy = y / s
      let colour = PAPER

      for (const cx of dots) {
        for (const cy of dots) {
          if (Math.hypot(ux - cx, uy - cy) <= 1.6) colour = GRID
        }
      }

      for (const [ax, ay, bx, by] of stroke) {
        if (distToSegment(ux, uy, ax, ay, bx, by) <= 3.5) colour = INK
      }

      const i = (y * size + x) * 3
      px[i] = colour[0]
      px[i + 1] = colour[1]
      px[i + 2] = colour[2]
    }
  }

  // PNG scanlines are prefixed with a filter byte (0 = none).
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3)
  }
  return raw
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(render(size), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(OUT, { recursive: true })
for (const size of [192, 512]) {
  writeFileSync(resolve(OUT, `icon-${size}.png`), png(size))
  console.log(`wrote public/icon-${size}.png`)
}
