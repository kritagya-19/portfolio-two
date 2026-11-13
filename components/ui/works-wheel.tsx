"use client";

// A portfolio index built as a wheel you turn.
//
// At rest the work sits in a ring around a title, each card tangent to the
// circle. The first notch of scroll blows the ring open into a vertical drum:
// the card at the front lies flat and full size, the ones above and below
// rotate away into hard perspective and run off the top and bottom of the
// frame. Keep turning and the drum carries the next piece round to the front.
//
// The whole thing is one number - turn - read by a single rAF pass that writes
// transforms straight to the DOM. 0 is the ring, 1 is the drum with item 0 at
// the front, and every whole number after that is one more item turned past.
import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { type MotionValue } from "framer-motion";
import { createRoot } from "react-dom/client";

import { cn } from "@/lib/utils";

export interface WorksWheelItem {
  /** Project name. Shown beside the front card and in the index. */
  title: string;
  /** Cover art. Any src an <img> takes. */
  image: string;
  /** Where the card links to. Omit for a wheel that only browses. */
  href?: string;
}

export interface WorksWheelProps extends Omit<
  React.ComponentPropsWithoutRef<"section">,
  "children"
> {
  items: WorksWheelItem[];
  /** Sits in the middle of the ring. @default undefined */
  label?: string;
  /** Label on the card's hover affordance. Omit to drop it. @default undefined */
  action?: string;
  /** Optional external motion value from scroll trigger */
  scrollProgress?: MotionValue<number>;
  /** Range of scrollProgress when wheel active [start, end] */
  scrollRange?: [number, number];
}

/* Geometry. The card is measured against the stage; everything else is measured
   against the card, so a narrow stage - where the card is capped by width, not
   height - scales the whole wheel down with it instead of leaving a small card
   swinging on a huge drum. The three that matter are tuned together: STEP
   against DRUM sets how hard the neighbours rotate away, and DRUM against LENS
   decides whether they land inside the frame or run off it. */
const CARD_H = 0.38; // front card height, of the stage
const CARD_MAX_W = 0.34; // ... but never wider than this much of the stage
const CARD_RATIO = 1.45; // card width / height
const STEP = 40; // degrees between cards on the drum
const DRUM = 2.22; // drum radius, in card heights - and everything below likewise
const LENS = 2.7; // perspective distance
const RING_R = 1.14; // ring radius
/* The drum alone hangs the work on a plumb line. It isn't one: the strip curves
   away round an arc whose centre sits off to the LEFT, so the piece at the front
   is at the arc's near point - dead centre - and its neighbours have already
   swung back left as well as up and down. BOW is that arc's radius; nothing else
   makes the difference between a stack of cards and a wheel seen side on. */
const BOW = 1.82;
const TITLE = 0.118; // ring label and front-card title
const INDEX = 0.038; // the index down the right-hand side
/** Items either side of the front still worth drawing. Past this a card is
    edge-on, and further round it would stack up on the vanishing point. */
const CULL = 1.6;

/** How much of a wheel-notch or a dragged pixel counts as one item. */
const WHEEL_UNITS = 900;
const DRAG_UNITS = 420;
/** Quiet time after the last wheel event before the wheel settles on an item. */
const SETTLE = 140;
/** Fraction of the remaining distance closed each frame. 1 = no smoothing. */
const EASE = 0.12;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Stage = { w: number; h: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

/** How far left the arc has carried something that has turned `drumDeg` off the
    front. Zero at the front, so the piece being read stays centred. */
const bowAt = (drumDeg: number, bow: number) =>
  -bow * (1 - Math.cos(rad(drumDeg)));

/** Both states in one chain: the ring terms fall away as `m` reaches the drum,
    and the drum terms are still zero while the ring is up. The bow is applied
    first, in the wheel's own plane, so it slides the card sideways rather than
    turning with it - and perspective still shrinks it with distance. */
function place(
  ringDeg: number,
  drumDeg: number,
  ringR: number,
  drumR: number,
  bow: number,
  m: number,
) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

export const DEFAULT_WORKS: WorksWheelItem[] = [
  {
    title: "Helix OS — Spatial Interface",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
    href: "#",
  },
  {
    title: "Northwind Cloud Platform",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
    href: "#",
  },
  {
    title: "Aura Design System",
    image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop",
    href: "#",
  },
  {
    title: "Cadence Biosensing UX",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop",
    href: "#",
  },
  {
    title: "Quantum V Neural Canvas",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop",
    href: "#",
  },
  {
    title: "Prism III Generative Studio",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
    href: "#",
  },
  {
    title: "Cyber VII Spatial Runtime",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
    href: "#",
  },
  {
    title: "Aether IX Holographic HUD",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop",
    href: "#",
  },
];

export function WorksWheel({
  items = DEFAULT_WORKS,
  label = "WORKS '26",
  action = "Explore",
  className,
  scrollProgress,
  scrollRange = [0.58, 0.94],
  ...props
}: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);

  // The wheel's position, and where it is heading. Only `active` is state -
  // everything else is written to the DOM, so turning the wheel is not a render.
  const turn = React.useRef(0);
  const target = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>({ w: 0, h: 0 });

  const count = items.length;
  const last = Math.max(count - 1, 0);
  const isInteracting = React.useRef(false);
  const interactionTimer = React.useRef<number | null>(null);
  const [isEnding, setIsEnding] = React.useState(false);

  React.useEffect(() => {
    if (!scrollProgress) return;
    const [, end] = scrollRange;
    const unsub = scrollProgress.on("change", (p) => {
      setIsEnding(p >= end - 0.02);
    });
    return () => unsub();
  }, [scrollProgress, scrollRange]);

  // Read after mount, not during render: reduced motion drops easing
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    const isMobile = w > 0 && w < 768;
    const cardW = isMobile
      ? Math.min(w * 0.68, h * 0.42 * CARD_RATIO)
      : Math.min(h * CARD_H * CARD_RATIO, w * CARD_MAX_W);
    const cardH = cardW / CARD_RATIO;
    const drumR = cardH * DRUM;
    const ringR = cardH * RING_R;
    // Shrink the ring's cards until the circle reads as a closed loop
    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1), 0.18, 1)
      : 1;
    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow: cardH * BOW,
      depth: cardH * LENS,
      title: cardH * TITLE,
      index: cardH * INDEX,
    };
  }, [stage, count]);

  // Sync scrollProgress if passed from pinned parent
  React.useEffect(() => {
    if (!scrollProgress) return;
    const [start, end] = scrollRange;
    const unsubscribe = scrollProgress.on("change", (p) => {
      if (isInteracting.current) return;
      if (p < start) {
        target.current = 0;
      } else if (p > end) {
        target.current = last + 1;
      } else {
        const norm = (p - start) / (end - start);
        target.current = norm * (last + 1);
      }
    });
    return () => unsubscribe();
  }, [scrollProgress, scrollRange, last]);

  // One pass per frame: ease toward the target, then write every transform.
  React.useEffect(() => {
    if (!stage.h) return;
    let frame = 0;
    const { ringR, ringScale, drumR, bow } = metrics;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (reduced ? 1 : EASE);

      const t = turn.current;
      const m = clamp(t, 0, 1);
      const pos = Math.max(0, t - 1);

      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-m * drumR}px)`;
      }

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = d * STEP;
        const card = cardRefs.current[i];
        if (card) {
          card.style.transform = place(
            d * (360 / count),
            drumDeg,
            ringR,
            drumR,
            bow,
            m,
          );
          card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? "0" : "1";
          card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }
        const face = card?.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
      }

      if (labelRef.current) labelRef.current.style.opacity = String(1 - m);
      if (titleRef.current) titleRef.current.style.opacity = String(m);
      const near = clamp(Math.round(pos), 0, last);
      setActive((prev) => (prev === near ? prev : near));
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, count, last, reduced]);

  const to = React.useCallback(
    (next: number) => {
      target.current = clamp(next, 0, last + 1);
    },
    [last],
  );

  // Wheel listener when standalone
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el || scrollProgress) return;
    const onWheel = (event: WheelEvent) => {
      const next = target.current + event.deltaY / WHEEL_UNITS;
      if (next > 0 && next < last + 1) event.preventDefault();
      to(next);
      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(
        () => to(Math.round(target.current)),
        SETTLE,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(settling.current);
    };
  }, [to, last, scrollProgress]);

  const drag = React.useRef<number | null>(null);
  const settling = React.useRef(0);

  return (
    <section
      aria-label={label}
      className={cn(
        "relative h-full min-h-[24rem] w-full overflow-hidden select-none bg-transparent text-[#f3f1ea]",
        className,
      )}
      {...props}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`works-wheel-${active}`}
        className="focus-visible:outline-[#ff3b1d] absolute inset-0 cursor-grab touch-pan-x outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 active:cursor-grabbing"
        style={{ perspective: `${metrics.depth}px` }}
        onPointerDown={(event) => {
          isInteracting.current = true;
          drag.current = event.clientY;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current === null) return;
          to(target.current + (drag.current - event.clientY) / DRAG_UNITS);
          drag.current = event.clientY;
        }}
        onPointerUp={() => {
          drag.current = null;
          if (target.current > 1) to(Math.round(target.current));
          if (interactionTimer.current) window.clearTimeout(interactionTimer.current);
          interactionTimer.current = window.setTimeout(() => {
            isInteracting.current = false;
          }, 2000);
        }}
        onKeyDown={(event) => {
          isInteracting.current = true;
          if (event.key === "ArrowDown") to(Math.round(target.current) + 1);
          else if (event.key === "ArrowUp") to(Math.round(target.current) - 1);
          else return;
          event.preventDefault();
          if (interactionTimer.current) window.clearTimeout(interactionTimer.current);
          interactionTimer.current = window.setTimeout(() => {
            isInteracting.current = false;
          }, 2000);
        }}
      >
        <div
          ref={wheelRef}
          className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
        >
          {items.map((item, i) => {
            const Tag = (item.href ? "a" : "div") as "a";
            return (
              <React.Fragment key={item.title}>
                <Tag
                  id={`works-wheel-${i}`}
                  role="option"
                  aria-selected={i === active}
                  href={item.href}
                  ref={(node: HTMLElement | null) => {
                    cardRefs.current[i] = node;
                  }}
                  className="group absolute [backface-visibility:hidden]"
                  style={{
                    width: metrics.cardW,
                    height: metrics.cardH,
                    marginLeft: -metrics.cardW / 2,
                    marginTop: -metrics.cardH / 2,
                  }}
                >
                  <span className="relative block size-full overflow-hidden rounded-2xl bg-[#111114] border border-white/10 ring-1 ring-white/5 shadow-2xl shadow-black/90 transition-all duration-500 group-hover:border-[#ff3b1d]/80 group-hover:shadow-[#ff3b1d]/20">
                    <img
                      src={item.image}
                      alt={item.title}
                      draggable={false}
                      className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                    {action ? (
                      <span className="pointer-events-none absolute right-3 bottom-3 flex translate-y-1 items-center gap-1.5 rounded-full border border-white/15 bg-[#08080a]/90 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:border-[#ff3b1d]/80">
                        <ArrowUpRight className="size-3 text-[#ff3b1d]" aria-hidden="true" />
                        {action}
                      </span>
                    ) : null}
                  </span>
                </Tag>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Ring title sitting in the center of the unblown circle */}
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 grid place-items-center font-['Anton',sans-serif] uppercase tracking-tight text-white/90 drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
        style={{ fontSize: metrics.title }}
      >
        <span>{label}</span>
      </div>

      {/* Front-card project title on the left side of the drum */}
      <div
        ref={titleRef}
        className="pointer-events-none absolute top-1/2 left-[5%] sm:left-[8%] -translate-y-1/2 opacity-0 flex flex-col font-['Anton',sans-serif] uppercase text-white max-w-[14ch] sm:max-w-[20ch] leading-[0.92] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] select-none"
        style={{ fontSize: metrics.title }}
      >
        <span className="text-[0.75rem] sm:text-xs font-mono tracking-[0.3em] text-[#ff3b1d] uppercase mb-2 font-normal">
          Selected 0{active + 1} / 0{items.length}
        </span>
        <span>{items[active]?.title}</span>
      </div>

      {/* Interactive Project Index down the right-hand side */}
      <ol
        className={cn(
          "text-[#807f78] absolute top-[8%] right-[3%] sm:right-[4%] text-right font-mono tracking-wider leading-[1.8] uppercase select-none z-30 transition-opacity duration-500",
          isEnding ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        style={{ fontSize: metrics.index }}
      >
        {items.map((item, i) => (
          <li key={item.title}>
            <button
              type="button"
              onClick={() => {
                isInteracting.current = true;
                to(i + 1);
                if (interactionTimer.current) window.clearTimeout(interactionTimer.current);
                interactionTimer.current = window.setTimeout(() => {
                  isInteracting.current = false;
                }, 2200);
              }}
              className={cn(
                "cursor-pointer transition-all duration-300 outline-none flex items-center justify-end gap-2 text-xs sm:text-sm hover:text-white",
                i === active
                  ? "text-[#ff3b1d] font-bold translate-x-[-4px]"
                  : "text-[#807f78]",
              )}
            >
              <span>{item.title}</span>
              {i === active && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b1d] inline-block shadow-[0_0_8px_#ff3b1d]" />
              )}
            </button>
          </li>
        ))}
      </ol>

      {/* Bottom affordance hint */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-[#807f78] transition-opacity duration-500",
          isEnding ? "opacity-0" : "opacity-100"
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b1d]/60" />
        <span>Drag or scroll to turn wheel</span>
      </div>
    </section>
  );
}

/** Mount helper for vanilla/HTML integration */
export function mountWorksWheel(
  container: HTMLElement,
  props?: Partial<WorksWheelProps>,
) {
  const root = createRoot(container);
  root.render(<WorksWheel items={DEFAULT_WORKS} {...props} />);
  return {
    destroy: () => root.unmount(),
  };
}

export default WorksWheel;
