"use client"

import * as React from "react"
import { createRoot } from "react-dom/client"

/**
 * Shutter Glyph Footer — luxury brutalist closing section with monumental
 * single-line display typography with elevated letter height (line-height).
 * Features an interactive cursor-tracking shutter blade, hover waist-split
 * and 3D flip on glyphs, clean metadata bar, and zero clutter.
 */

// #region glyphs
export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)

/** Base cap height of every glyph in unscaled SVG units. */
export const CAP = 100
const S = 19 // stem
const B = 17 // bar

const f = (n: number): string => String(Math.round(n * 100) / 100)

/** Axis-aligned box. */
export const rect = (x: number, y: number, w: number, h: number): string =>
  "M" + f(x) + " " + f(y) + "H" + f(x + w) + "V" + f(y + h) + "H" + f(x) + "Z"

/** A slanted stroke `t` wide measured horizontally. */
export const slant = (x1: number, y1: number, x2: number, y2: number, t: number): string =>
  "M" + f(x1) + " " + f(y1) + "H" + f(x1 + t) + "L" + f(x2 + t) + " " + f(y2) + "H" + f(x2) + "Z"

/** Closed polygon from [x, y, x, y, …]. */
export const poly = (pts: number[]): string => {
  let d = ""
  for (let i = 0; i + 1 < pts.length; i += 2) d += (i ? "L" : "M") + f(pts[i]) + " " + f(pts[i + 1])
  return d + "Z"
}

const at = (cx: number, cy: number, rx: number, ry: number, deg: number): string => {
  const a = (deg * Math.PI) / 180
  return f(cx + rx * Math.cos(a)) + " " + f(cy + ry * Math.sin(a))
}

/**
 * A band between an outer ellipse (rx, ry) and an inner one (rx - tx, ry - ty).
 */
export const band = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tx: number,
  ty: number,
  a0: number,
  a1: number
): string => {
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  const cw = a1 > a0 ? 1 : 0
  const irx = rx - tx
  const iry = ry - ty
  return (
    "M" +
    at(cx, cy, rx, ry, a0) +
    "A" +
    f(rx) +
    " " +
    f(ry) +
    " 0 " +
    large +
    " " +
    cw +
    " " +
    at(cx, cy, rx, ry, a1) +
    "L" +
    at(cx, cy, irx, iry, a1) +
    "A" +
    f(irx) +
    " " +
    f(iry) +
    " 0 " +
    large +
    " " +
    (1 - cw) +
    " " +
    at(cx, cy, irx, iry, a0) +
    "Z"
  )
}

/** A full elliptical ring. */
export const ring = (cx: number, cy: number, rx: number, ry: number, tx: number, ty: number): string => {
  const e = (r1: number, r2: number) =>
    "M" +
    f(cx - r1) +
    " " +
    f(cy) +
    "A" +
    f(r1) +
    " " +
    f(r2) +
    " 0 1 1 " +
    f(cx + r1) +
    " " +
    f(cy) +
    "A" +
    f(r1) +
    " " +
    f(r2) +
    " 0 1 1 " +
    f(cx - r1) +
    " " +
    f(cy) +
    "Z"
  return e(rx, ry) + e(rx - tx, ry - ty)
}

/** A D-shaped bowl. */
export const bowl = (x: number, y: number, w: number, h: number, t: number, tb: number): string => {
  const ry = h / 2
  const rx = Math.min(w - t, ry * 0.95)
  const sx = x + w - rx
  return (
    "M" +
    f(x) +
    " " +
    f(y) +
    "H" +
    f(sx) +
    "A" +
    f(rx) +
    " " +
    f(ry) +
    " 0 0 1 " +
    f(sx) +
    " " +
    f(y + h) +
    "H" +
    f(x) +
    "Z" +
    "M" +
    f(x + t) +
    " " +
    f(y + tb) +
    "H" +
    f(sx) +
    "A" +
    f(rx - t) +
    " " +
    f(ry - tb) +
    " 0 0 1 " +
    f(sx) +
    " " +
    f(y + h - tb) +
    "H" +
    f(x + t) +
    "Z"
  )
}

export type Glyph = { w: number; d: string[] }

const SPACE: Glyph = { w: 26, d: [] }

/** The display alphabet, A–Z. */
export const GLYPHS: Record<string, Glyph> = {
  A: { w: 96, d: [slant(37, 0, 0, 100, 23), slant(37, 0, 73, 100, 23), rect(18, 60, 60, 16)] },
  B: { w: 84, d: [rect(0, 0, S, 100), bowl(0, 0, 78, 52, S, B), bowl(0, 52 - B, 84, 100 - 52 + B, S, B)] },
  C: { w: 90, d: [band(45, 50, 45, 50, S + 2, B, -40, -320)] },
  D: { w: 90, d: [rect(0, 0, S + 1, 100), bowl(0, 0, 90, 100, S + 2, B)] },
  E: { w: 72, d: [rect(0, 0, S, 100), rect(0, 0, 72, B), rect(0, 41.5, 64, B), rect(0, 100 - B, 72, B)] },
  F: { w: 70, d: [rect(0, 0, S, 100), rect(0, 0, 70, B), rect(0, 43, 62, B)] },
  G: { w: 94, d: [band(47, 50, 47, 50, S + 2, B, -38, -360), rect(48, 46, 46, B)] },
  H: { w: 86, d: [rect(0, 0, S, 100), rect(86 - S, 0, S, 100), rect(0, 42, 86, B)] },
  I: { w: S + 2, d: [rect(0, 0, S + 2, 100)] },
  J: { w: 72, d: [rect(72 - S, 0, S, 64), band(36, 62, 36, 38, S, B, 0, 180)] },
  K: { w: 86, d: [rect(0, 0, S, 100), slant(62, 0, 10, 62, 24), slant(30, 42, 62, 100, 24)] },
  L: { w: 68, d: [rect(0, 0, S, 100), rect(0, 100 - B, 68, B)] },
  M: {
    w: 112,
    d: [
      rect(0, 0, S + 3, 100),
      slant(0, 0, 46, 100, 9),
      slant(68, 0, 40, 100, 22),
      rect(112 - S - 3, 0, S + 3, 100),
    ],
  },
  N: { w: 88, d: [rect(0, 0, S, 100), rect(88 - S, 0, S, 100), slant(0, 0, 63, 100, 25)] },
  O: { w: 100, d: [ring(50, 50, 50, 50, S + 2, B)] },
  P: { w: 80, d: [rect(0, 0, S, 100), bowl(0, 0, 80, 60, S, B)] },
  Q: { w: 100, d: [ring(50, 50, 50, 50, S + 2, B), slant(50, 62, 78, 100, 22)] },
  R: { w: 84, d: [rect(0, 0, S, 100), bowl(0, 0, 82, 58, S, B), slant(34, 50, 62, 100, 22)] },
  S: { w: 80, d: [band(40, 29.25, 40, 29.25, S, B, -22, -273), band(40, 70.75, 40, 29.25, S, B, -93, 158)] },
  T: { w: 82, d: [rect(0, 0, 82, B), rect(41 - S / 2 - 1, 0, S + 2, 100)] },
  U: { w: 86, d: [rect(0, 0, S, 60), rect(86 - S, 0, S, 60), band(43, 58, 43, 42, S, B, 0, 180)] },
  V: { w: 94, d: [slant(0, 0, 36, 100, 22), slant(72, 0, 36, 100, 22)] },
  W: {
    w: 132,
    d: [
      slant(0, 0, 26, 100, 20),
      slant(56, 0, 26, 100, 20),
      slant(56, 0, 86, 100, 20),
      slant(112, 0, 86, 100, 20),
    ],
  },
  X: { w: 92, d: [slant(0, 0, 68, 100, 24), slant(68, 0, 0, 100, 24)] },
  Y: { w: 92, d: [slant(0, 0, 35, 56, 22), slant(70, 0, 35, 56, 22), rect(35, 50, 22, 50)] },
  Z: { w: 80, d: [rect(0, 0, 80, B), rect(0, 100 - B, 80, B), slant(56, B - 1, 0, 100 - B + 1, 24)] },
}

export const glyphOf = (ch: string): Glyph => GLYPHS[ch.toUpperCase()] ?? SPACE

export const SHUTTER = 100
const K = 21
export const REST = 77

export const turn = (x: number, y: number, turns: number): [number, number] => {
  const n = ((turns % 4) + 4) % 4
  let a = x
  let b = y
  for (let i = 0; i < n; i++) {
    const t = a
    a = SHUTTER - b
    b = t
  }
  return [a, b]
}

export const restPivot = (turns: number): [number, number] => turn(REST, REST, turns)

export const blades = (px: number, py: number, turns: number): number[][] => {
  const [qx, qy] = turn(clamp(px, 8, 92), clamp(py, 8, 92), -turns)
  const shapes = [
    [0, 0, K, 0, qx, qy, 0, K],
    [qx, 0, SHUTTER, 0, SHUTTER, K, qx, qy],
    [0, qy, qx, qy, K, SHUTTER, 0, SHUTTER],
  ]
  return shapes.map((s) => {
    const out: number[] = []
    for (let i = 0; i < s.length; i += 2) out.push(...turn(s[i], s[i + 1], turns))
    return out
  })
}

export type Placed = {
  ch: string
  x: number
  y: number
  w: number
  rawW: number
  shutter: boolean
  row: number
}

/**
 * Lays out the wordmark on 1 single continuous line with elevated letter height.
 * scaleX: compact width ratio (condensed grotesque like Anton)
 * scaleY: vertical scaling multiplier (increases line-height & letter height by ~2x)
 */
export const layout = (
  word: string,
  shutterAt: number = 2,
  gap: number = 6,
  scaleX: number = 0.82,
  scaleY: number = 2.05
): {
  items: Placed[]
  width: number
  height: number
  scaleX: number
  scaleY: number
  shutter?: Placed
} => {
  // Always 1 continuous single line
  const singleLine = word.replace(/\s+/g, " ").trim()
  const chars = Array.from(singleLine)
  const items: Placed[] = []
  let currentX = 0
  let shutterItem: Placed | undefined

  const effectiveCap = CAP * scaleY // e.g. 100 * 2.05 = 205 tall

  chars.forEach((ch, i) => {
    const isSpace = ch === " "
    const isShutter = i === shutterAt && !isSpace
    const baseW = isSpace ? 26 : isShutter ? SHUTTER : glyphOf(ch).w
    const scaledW = baseW * scaleX

    const placed: Placed = {
      ch,
      x: currentX,
      y: 0,
      w: scaledW,
      rawW: baseW,
      shutter: isShutter,
      row: 0,
    }

    items.push(placed)
    if (isShutter) shutterItem = placed
    currentX += scaledW + (i < chars.length - 1 ? (isSpace ? gap * 0.4 : gap) : 0)
  })

  return {
    items,
    width: Math.max(1, currentX),
    height: effectiveCap,
    scaleX,
    scaleY,
    shutter: shutterItem,
  }
}

export const approach = (from: number, to: number, k: number, dt: number): number =>
  to + (from - to) * Math.pow(1 - clamp(k, 0, 1), clamp(dt, 0, 0.1) * 60)

const NOISE = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=/<>"

export const scramble = (text: string, progress: number, seed: number): string => {
  const chars = Array.from(text)
  const settled = Math.floor(clamp(Number.isFinite(progress) ? progress : 1, 0, 1) * chars.length)
  return chars
    .map((ch, i) => {
      if (i < settled || !/[a-z0-9]/i.test(ch)) return ch
      const r = Math.abs(Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453) % 1
      return NOISE[Math.floor(r * NOISE.length)]
    })
    .join("")
}
// #endregion

export type FooterLink = { label: string; href?: string }

export type ShutterGlyphFooterProps = {
  brand?: string
  wordmark?: string
  shutterAt?: number
  company?: string
  since?: number
  year?: number
  signupLabel?: string
  placeholder?: string
  onSubscribe?: (email: string) => void | boolean | Promise<void | boolean>
  socials?: FooterLink[]
  legal?: FooterLink[]
  onLinkClick?: (label: string, href?: string) => void
  background?: string
  ink?: string
  fontMono?: string
  animate?: boolean
  className?: string
  scaleX?: number
  scaleY?: number
}

const DEFAULT_SOCIALS: FooterLink[] = [
  { label: "Dribbble", href: "https://dribbble.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Figma", href: "https://figma.com" },
  { label: "X / Twitter", href: "https://x.com" },
]

const MONO =
  '"JetBrains Mono", "IBM Plex Mono", "Space Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'

const CSS =
  ".sgf{position:relative;isolation:isolate;overflow:hidden;color:var(--sgf-ink);background:var(--sgf-bg);box-shadow:none;font-family:var(--font-sans,'Onest',sans-serif);-webkit-font-smoothing:antialiased}" +
  ".sgf ::selection{background:var(--accent,#ff3b1d);color:#ffffff}" +
  ":where(.sgf) a{color:inherit;text-decoration:none}" +
  ":where(.sgf) button{font:inherit;color:inherit;letter-spacing:inherit;text-transform:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}" +
  ":where(.sgf) ul{list-style:none;margin:0;padding:0}" +
  ":where(.sgf) p{margin:0}" +
  ".sgf svg{max-width:none}" +
  ".sgf .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
  // Meta bar styles (uncluttered, brutalist, refined)
  ".sgf-meta-bar{box-sizing:border-box;display:flex;flex-direction:row;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:clamp(18px,2.5vw,36px);padding:clamp(28px,3.8vw,48px) clamp(16px,2.5vw,36px) clamp(20px,2.5vw,30px);border-bottom:1px solid rgba(243,241,234,0.08)}" +
  ".sgf-meta-left{display:flex;flex-direction:column;gap:8px;min-width:240px}" +
  ".sgf-status-pill{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-sans,'Onest',sans-serif);font-size:0.75rem;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--foreground,#f3f1ea)}" +
  ".sgf-status-dot{width:7px;height:7px;border-radius:9999px;background-color:var(--accent,#ff3b1d);box-shadow:0 0 10px rgba(255,59,29,0.7);animation:sgf-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite}" +
  "@keyframes sgf-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.35;transform:scale(0.85)}}" +
  ".sgf-meta-title{font-family:var(--font-sans,'Onest',sans-serif);font-size:0.8125rem;letter-spacing:0.12em;color:var(--muted,#807f78);text-transform:uppercase}" +
  ".sgf-meta-copy{font-family:var(--font-sans,'Onest',sans-serif);font-size:0.75rem;letter-spacing:0.08em;color:var(--muted,#807f78)}" +
  ".sgf-meta-center{display:flex;flex-direction:column;gap:6px}" +
  ".sgf-meta-label{font-family:var(--font-sans,'Onest',sans-serif);font-size:0.6875rem;font-weight:600;letter-spacing:0.22em;color:var(--muted,#807f78);text-transform:uppercase}" +
  ".sgf-email-link{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-display,'Anton',sans-serif);font-size:clamp(1.15rem,1.8vw,1.65rem);letter-spacing:0.04em;color:var(--foreground,#f3f1ea);text-transform:uppercase;transition:color .2s ease}" +
  ".sgf-email-link:hover{color:var(--accent,#ff3b1d)}" +
  ".sgf-email-link svg{width:14px;height:14px;color:var(--accent,#ff3b1d);transition:transform .3s cubic-bezier(.16,1,.3,1)}" +
  ".sgf-email-link:hover svg{transform:translate(4px,-2px)}" +
  ".sgf-meta-right{display:flex;flex-direction:column;gap:10px;align-items:flex-end}" +
  ".sgf-social-list{display:flex;flex-direction:row;flex-wrap:wrap;gap:clamp(12px,1.5vw,22px)}" +
  ".sgf-back-top{display:inline-flex;align-items:center;gap:6px;margin-top:2px;font-family:var(--font-sans,'Onest',sans-serif);font-size:0.75rem;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted,#807f78);transition:color .2s ease;cursor:pointer}" +
  ".sgf-back-top:hover{color:var(--accent,#ff3b1d)}" +
  ".sgf-fade{transition:opacity .8s ease var(--sgf-d,0ms),translate .8s cubic-bezier(.2,.7,.1,1) var(--sgf-d,0ms)}" +
  ".sgf[data-in='false'] .sgf-fade{opacity:0;translate:0 10px}" +
  // Links
  ".sgf-link{position:relative;display:inline-flex;align-items:center;gap:.5em;white-space:nowrap;padding:2px 0;font-family:var(--font-sans,'Onest',sans-serif);font-size:var(--text-eyebrow,0.8125rem);font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted,#807f78);transition:color .2s ease}" +
  ".sgf-link:hover{color:var(--foreground,#f3f1ea)}" +
  ".sgf-link::after{content:'';position:absolute;left:0;right:1.6em;bottom:-2px;height:1px;background:var(--accent,#ff3b1d);transform:scaleX(0);transform-origin:100% 50%;transition:transform .4s cubic-bezier(.2,.8,.2,1)}" +
  ".sgf-link:hover::after,.sgf-link:focus-visible::after{transform:scaleX(1);transform-origin:0 50%}" +
  ".sgf-link svg{width:.8em;height:.8em;flex:none;transition:translate .35s cubic-bezier(.2,.8,.2,1);color:var(--accent,#ff3b1d)}" +
  ".sgf-link:hover svg,.sgf-link:focus-visible svg{translate:4px -2px}" +
  // Massive single-line wordmark with towering letter height
  ".sgf-mark{box-sizing:border-box;padding:clamp(24px,3.5vw,48px) clamp(6px,1.2vw,20px) clamp(20px,3vw,44px);width:100%;overflow:hidden}" +
  ".sgf-svg{display:block;width:100%;height:auto;overflow:hidden;fill:var(--sgf-ink)}" +
  ".sgf-rise{transition:transform 1.15s cubic-bezier(.16,.84,.2,1) var(--sgf-d,0ms)}" +
  ".sgf[data-in='false'] .sgf-rise{transform:translateY(112px)}" +
  ".sgf-g{cursor:pointer}" +
  ".sgf-flip{transform-box:fill-box;transform-origin:50% 50%}" +
  ".sgf-flip.is-flip{animation:sgf-flip .7s cubic-bezier(.2,.8,.2,1)}" +
  "@keyframes sgf-flip{0%{transform:scaleY(1)}45%{transform:scaleY(-1)}100%{transform:scaleY(1)}}" +
  ".sgf-half{transition:transform .45s cubic-bezier(.2,.9,.25,1.15)}" +
  ".sgf-g:hover .sgf-up{transform:translate(4px,-1.5px)}" +
  ".sgf-g:hover .sgf-dn{transform:translate(-4px,1.5px)}" +
  ".sgf-sh polygon{transition:none}" +
  "@media (max-width: 768px){.sgf-meta-bar{flex-direction:column;gap:20px;align-items:flex-start}.sgf-meta-right{align-items:flex-start}}" +
  "@media (prefers-reduced-motion: reduce){.sgf .sgf-rise,.sgf .sgf-fade,.sgf .sgf-half,.sgf .sgf-link svg,.sgf .sgf-link::after,.sgf .sgf-status-dot{transition:none!important;animation:none!important}.sgf .sgf-flip{animation:none!important}.sgf[data-in='false'] .sgf-rise{transform:none}.sgf[data-in='false'] .sgf-fade{opacity:1;translate:none}}"

const Arrow = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M1 6h9.2M6.4 2.2 10.2 6l-3.8 3.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="square"
    />
  </svg>
)

const external = (href?: string) =>
  href && /^https?:/.test(href) ? { target: "_blank", rel: "noreferrer" } : {}

function ScrambleLink({
  link,
  still,
  onFollow,
  style,
  className = "sgf-link",
}: {
  link: FooterLink
  still: boolean
  onFollow: (e: React.MouseEvent<HTMLAnchorElement>, l: FooterLink) => void
  style?: React.CSSProperties
  className?: string
}) {
  const textRef = React.useRef<HTMLSpanElement>(null)
  const raf = React.useRef(0)
  const text = link.label

  const run = () => {
    const el = textRef.current
    if (still || !el) return
    cancelAnimationFrame(raf.current)
    const t0 = performance.now()
    const seed = Math.random() * 100
    let n = 0
    const step = (now: number) => {
      const p = (now - t0) / 420
      if (p >= 1) {
        el.textContent = text
        return
      }
      if (n++ % 2 === 0) el.textContent = scramble(text, p, seed + Math.floor(n / 2))
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  React.useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return (
    <li className="sgf-fade" style={style}>
      <a
        className={className}
        href={link.href || "#"}
        aria-label={text}
        onPointerEnter={run}
        onFocus={run}
        onClick={(e) => onFollow(e, link)}
        {...external(link.href)}
      >
        <span ref={textRef} aria-hidden="true">
          {text}
        </span>
        <Arrow />
      </a>
    </li>
  )
}

export function ShutterGlyphFooter({
  brand = "MARCUS VANE",
  wordmark = "MARCUS VANE",
  shutterAt = 2, // The 'R' in MARCUS is the interactive shutter
  company = "Marcus Vane Studio — Systems & Architecture",
  since = 2016,
  year = new Date().getFullYear(),
  socials = DEFAULT_SOCIALS,
  onLinkClick,
  background = "#08080a",
  ink = "#ffffff",
  fontMono = MONO,
  animate = true,
  className = "",
  scaleX = 0.82,
  scaleY = 2.05,
}: ShutterGlyphFooterProps) {
  const word = ((wordmark ?? brand).trim() || brand).toUpperCase()
  const { items, width, height, shutter } = React.useMemo(
    () => layout(word, shutterAt, 6, scaleX, scaleY),
    [word, shutterAt, scaleX, scaleY]
  )

  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const upId = "sgf-up-" + uid
  const dnId = "sgf-dn-" + uid

  const rootRef = React.useRef<HTMLElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const bladeRefs = React.useRef<(SVGPolygonElement | null)[]>([])
  const ptr = React.useRef({ x: 0, y: 0, inside: false })
  const [turns, setTurns] = React.useState(0)
  const pivot = React.useRef<[number, number]>(restPivot(0))

  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => setReduced(mq.matches)
    onMq()
    mq.addEventListener("change", onMq)
    return () => mq.removeEventListener("change", onMq)
  }, [])
  const still = reduced || !animate

  const [seen, setSeen] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting)
        if (e.isIntersecting) setSeen(true)
      },
      { threshold: 0.1 }
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  // Smooth pivot tracking
  React.useEffect(() => {
    if (!shutter) return
    const paint = (x: number, y: number) => {
      blades(x, y, turns).forEach((pts, i) => {
        bladeRefs.current[i]?.setAttribute("points", pts.map(f).join(" "))
      })
    }
    const rest = restPivot(turns)
    if (still || !visible) {
      pivot.current = rest
      paint(rest[0], rest[1])
      return
    }
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const p = ptr.current
      const tx = p.inside ? clamp(p.x, 8, 92) : rest[0]
      const ty = p.inside ? clamp(p.y, 8, 92) : rest[1]
      const [x, y] = pivot.current
      pivot.current = [approach(x, tx, 0.12, dt), approach(y, ty, 0.12, dt)]
      paint(pivot.current[0], pivot.current[1])
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [shutter, still, visible, turns])

  const onPointer = (e: React.PointerEvent<HTMLElement>) => {
    const svg = svgRef.current
    const p = ptr.current
    p.inside = e.type !== "pointerleave"
    if (!svg || !shutter) return
    const r = svg.getBoundingClientRect()
    const scale = r.width / width || 1
    const svgX = (e.clientX - r.left) / scale
    const svgY = (e.clientY - r.top) / scale
    // Map directly into shutter's local [0..100, 0..100] coordinates
    p.x = (svgX - shutter.x) / scaleX
    p.y = (svgY - shutter.y) / scaleY
  }

  const flip = (e: React.MouseEvent<SVGGElement>) => {
    if (still) return
    const el = e.currentTarget
    el.classList.remove("is-flip")
    void el.getBoundingClientRect()
    el.classList.add("is-flip")
  }

  const follow = (e: React.MouseEvent<HTMLAnchorElement>, l: FooterLink) => {
    if (!l.href || l.href === "#") e.preventDefault()
    onLinkClick?.(l.label, l.href)
  }

  const emailRef = React.useRef<HTMLSpanElement>(null)
  const emailRaf = React.useRef(0)
  const emailText = "HELLO@MARCUSVANE.COM"
  const onEmailHover = () => {
    const el = emailRef.current
    if (still || !el) return
    cancelAnimationFrame(emailRaf.current)
    const t0 = performance.now()
    const seed = Math.random() * 100
    let n = 0
    const step = (now: number) => {
      const p = (now - t0) / 420
      if (p >= 1) {
        el.textContent = emailText
        return
      }
      if (n++ % 2 === 0) el.textContent = scramble(emailText, p, seed + Math.floor(n / 2))
      emailRaf.current = requestAnimationFrame(step)
    }
    emailRaf.current = requestAnimationFrame(step)
  }

  const vars = {
    "--sgf-bg": background,
    "--sgf-ink": ink,
    "--sgf-mono": fontMono,
  } as React.CSSProperties

  let d = 0
  const delay = () => ({ "--sgf-d": (d += 60) + "ms" }) as React.CSSProperties
  const years = since && since < year ? since + "—" + year : String(year)

  return (
    <footer
      ref={rootRef}
      className={"sgf " + className}
      style={vars}
      data-in={seen || still ? "true" : "false"}
      onPointerMove={onPointer}
      onPointerEnter={onPointer}
      onPointerLeave={onPointer}
    >
      <style>{CSS}</style>

      {/* Clean, refined metadata bar (uncluttered, brutalist) */}
      <div className="sgf-meta-bar">
        {/* Left column: Availability & studio info */}
        <div className="sgf-meta-left sgf-fade" style={delay()}>
          <div className="sgf-status-pill">
            <span className="sgf-status-dot" aria-hidden="true" />
            <span>AVAILABLE FOR SELECT COMMISSIONS</span>
          </div>
          <div className="sgf-meta-title">UI/UX DESIGNER &amp; PRODUCT ARCHITECT</div>
          <div className="sgf-meta-copy">© {years} {company || "MARCUS VANE STUDIO"}</div>
        </div>

        {/* Center column: Direct inquiries */}
        <div className="sgf-meta-center sgf-fade" style={delay()}>
          <div className="sgf-meta-label">DIRECT INQUIRIES</div>
          <a
            href="mailto:hello@marcusvane.com"
            className="sgf-email-link"
            onPointerEnter={onEmailHover}
            onFocus={onEmailHover}
            aria-label="Email hello@marcusvane.com"
          >
            <span ref={emailRef}>HELLO@MARCUSVANE.COM</span>
            <Arrow />
          </a>
        </div>

        {/* Right column: Socials & Back to Top */}
        <div className="sgf-meta-right sgf-fade" style={delay()}>
          <div className="sgf-meta-label">CONNECT</div>
          {socials.length > 0 && (
            <nav aria-label="Social Profiles">
              <ul className="sgf-social-list">
                {socials.map((l, i) => (
                  <ScrambleLink
                    key={l.label + i}
                    link={l}
                    still={still}
                    onFollow={follow}
                    style={delay()}
                  />
                ))}
              </ul>
            </nav>
          )}
          <button
            type="button"
            className="sgf-back-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll back to top"
          >
            <span>BACK TO TOP</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 9V1M1 5l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
          </button>
        </div>
      </div>

      {/* Monumental single-line brand wordmark with towering letter height */}
      <div className="sgf-mark">
        <p className="sr-only">{word}</p>
        <svg
          ref={svgRef}
          className="sgf-svg"
          viewBox={"0 0 " + f(width) + " " + f(height)}
          style={{ aspectRatio: width + " / " + height }}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <clipPath id={upId} clipPathUnits="userSpaceOnUse">
              <rect x={-40} y={-200} width={400} height={252.6} />
            </clipPath>
            <clipPath id={dnId} clipPathUnits="userSpaceOnUse">
              <rect x={-40} y={51.4} width={400} height={250} />
            </clipPath>
          </defs>
          {items.map((it, i) => {
            if (it.ch.trim() === "") return null
            const rise = { "--sgf-d": 120 + i * 45 + "ms" } as React.CSSProperties
            if (it.shutter) {
              const rest = restPivot(turns)
              return (
                <g
                  key={i}
                  transform={"translate(" + f(it.x) + " 0) scale(" + f(scaleX) + " " + f(scaleY) + ")"}
                >
                  <g className="sgf-rise" style={rise}>
                    <g
                      className="sgf-g sgf-sh"
                      onClick={() => setTurns((t) => t + 1)}
                      role="button"
                      aria-label="Rotate shutter blade"
                    >
                      <title>Click to rotate shutter</title>
                      <rect width={it.rawW} height={CAP} fill="transparent" />
                      {blades(rest[0], rest[1], turns).map((pts, b) => (
                        <polygon
                          key={b}
                          ref={(el) => {
                            bladeRefs.current[b] = el
                          }}
                          points={pts.map(f).join(" ")}
                        />
                      ))}
                    </g>
                  </g>
                </g>
              )
            }
            const g = glyphOf(it.ch)
            const paths = g.d.map((p, k) => <path key={k} d={p} fillRule="evenodd" />)
            return (
              <g
                key={i}
                transform={"translate(" + f(it.x) + " 0) scale(" + f(scaleX) + " " + f(scaleY) + ")"}
              >
                <g className="sgf-rise" style={rise}>
                  <g
                    className="sgf-g sgf-flip"
                    onClick={flip}
                    onAnimationEnd={(e) => e.currentTarget.classList.remove("is-flip")}
                    role="button"
                    aria-label={`Letter ${it.ch}`}
                  >
                    <title>Click to flip letter</title>
                    <rect width={it.rawW} height={CAP} fill="transparent" />
                    <g clipPath={"url(#" + upId + ")"}>
                      <g className="sgf-half sgf-up">{paths}</g>
                    </g>
                    <g clipPath={"url(#" + dnId + ")"}>
                      <g className="sgf-half sgf-dn">{paths}</g>
                    </g>
                  </g>
                </g>
              </g>
            )
          })}
        </svg>
      </div>
    </footer>
  )
}

export default ShutterGlyphFooter

export function mountShutterGlyphFooter(container: HTMLElement, props?: ShutterGlyphFooterProps) {
  const root = createRoot(container)
  root.render(<ShutterGlyphFooter {...props} />)
  return {
    destroy: () => root.unmount(),
  }
}
