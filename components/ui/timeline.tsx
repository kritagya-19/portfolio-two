// Built using Hyperiux Vault: https://vault.hyperiux.com
"use client";

import {
  type CSSProperties,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function useGSAP(
  callback: () => void | (() => void),
  options?: {
    dependencies?: unknown[];
    scope?: { current: Element | null } | Element | null;
  }
) {
  const deps = options?.dependencies ?? [];
  const scope = options?.scope;
  const ctxRef = useRef<gsap.Context | null>(null);
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  useLayoutEffect(() => {
    const el =
      scope && typeof scope === "object" && "current" in scope
        ? scope.current
        : (scope as Element | null);
    ctxRef.current = gsap.context(() => {}, el ?? undefined);
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!ctxRef.current) return;
    cleanupRef.current?.();
    const ret = ctxRef.current.add(callback);
    cleanupRef.current = typeof ret === "function" ? ret : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const monthOrder = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
} as const;

type Month = keyof typeof monthOrder;

export type JourneyItem = {
  id: string;
  year: string;
  month: Month;
  content: string;
};

export type TimelineProps = {
  title?: string;
  periodLabel?: string;
  textColor?: string;
  mutedTextColor?: string;
  activeColor?: string;
  backgroundColor?: string;
  imageUrl?: string;
  imageAlt?: string;
  cardTitle?: string;
  cardSubtitle?: string;
  duration?: number;
  scrollDuration?: number;
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener("change", callback);

  return () => mediaQueryList.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;

  return window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false;
}

function getServerReducedMotionSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
}

const topJourneyData: JourneyItem[] = [
  {
    id: "2020-march",
    year: "2020",
    month: "March",
    content: "Signal research turns scattered notes into a clear product thesis",
  },
  {
    id: "2021-july",
    year: "2021",
    month: "July",
    content: "Founding release ships with the first live customer journeys",
  },
  {
    id: "2023-april",
    year: "2023",
    month: "April",
    content: "Automation layer connects insight, publishing, and sales motion",
  },
  {
    id: "2026-may",
    year: "2026",
    month: "May",
    content: "New markets open with localized launches and faster onboarding",
  },
];

const bottomJourneyData: JourneyItem[] = [
  {
    id: "2020-november",
    year: "2020",
    month: "November",
    content: "Prototype sprint validates the experience with real operators",
  },
  {
    id: "2022-october",
    year: "2022",
    month: "October",
    content: "Community feedback reshapes the roadmap into sharper releases",
  },
  {
    id: "2025-september",
    year: "2025",
    month: "September",
    content: "Companion mobile workflows make the timeline travel-ready",
  },
];

const allJourneyItems: JourneyItem[] = [
  ...topJourneyData,
  ...bottomJourneyData,
].sort((a, b) => {
  const yearDiff = Number(a.year) - Number(b.year);
  if (yearDiff !== 0) return yearDiff;
  return monthOrder[a.month] - monthOrder[b.month];
});

export default function Timeline({
  title = "Product Storyline",
  periodLabel = "2020 — 2026",
  textColor = "var(--foreground, #f3f1ea)",
  mutedTextColor = "var(--muted, #807f78)",
  activeColor = "#ff3b1d",
  backgroundColor = "var(--background, #08080a)",
  imageUrl = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop",
  imageAlt = "Aether IX Holographic HUD",
  cardTitle = "Aether IX Holographic HUD",
  cardSubtitle = "Selected 08 / 08 • Origin Anchor",
}: TimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const wholeSliderRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const headerBlockRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const sectionStyle: CSSProperties = {
    color: textColor,
    backgroundColor,
  };
  const activeStyle: CSSProperties = {
    backgroundColor: activeColor,
  };

  useGSAP(() => {
    const section = sectionRef.current;
    const slider = wholeSliderRef.current;
    const card = cardRef.current;
    const header = headerBlockRef.current;
    if (!section || !slider || !card) return;

    const isMobile = window.innerWidth < 600;
    const slidePercent = isMobile ? -70 : -62;
    const lineWidth = isMobile ? "70%" : "98%";
    const items = allJourneyItems;

    // Calculate center offset for the card so it starts dead center of the viewport,
    // exactly matching the position and proportions of the last card from WorksWheel!
    const paddingLeft = window.innerWidth * 0.06;
    const cardW = isMobile
      ? Math.min(window.innerWidth * 0.82, window.innerHeight * 0.42 * 1.45)
      : Math.min(window.innerHeight * 0.38 * 1.45, window.innerWidth * 0.34);
    const centerOffset = Math.max(0, (window.innerWidth / 2) - (paddingLeft + cardW / 2));

    if (reducedMotion) {
      gsap.set(card, { x: 0 });
      if (header) gsap.set(header, { opacity: 1, x: 0 });
      gsap.set(".journey-start-dot", { scale: 1, opacity: 1 });
      gsap.set(".journey-end-dot", { scale: 1, opacity: 1 });
      gsap.set(".journey-line-active", { width: lineWidth });
      items.forEach((item) => {
        gsap.set(`.jl-${item.id}`, { scaleY: 1, opacity: 1 });
        gsap.set(`.jd-${item.id}`, { scale: 1, opacity: 1 });
        gsap.set(`.title-${item.id}`, { opacity: 1, y: 0 });
        gsap.set(`.description-${item.id}`, { opacity: 1, y: 0 });
      });
      return;
    }

    // Initial state: Card starts in the exact horizontal and vertical center of viewport
    gsap.set(card, { x: centerOffset });
    if (header) {
      gsap.set(header, { opacity: 0, x: 24 });
    }

    gsap.set(".journey-start-dot", { scale: 0, opacity: 0 });
    gsap.set(".journey-end-dot", { scale: 0, opacity: 0 });
    gsap.set(".journey-line-active", { width: "0%" });
    items.forEach((item) => {
      const isTop = topJourneyData.some((topItem) => topItem.id === item.id);
      gsap.set(`.jl-${item.id}`, {
        scaleY: 0,
        opacity: 0,
        transformOrigin: isTop ? "bottom center" : "top center",
      });
      gsap.set(`.jd-${item.id}`, { scale: 0, opacity: 0 });
      gsap.set(`.title-${item.id}`, { y: isTop ? 25 : -25, opacity: 0 });
      gsap.set(`.description-${item.id}`, { y: isTop ? 20 : -20, opacity: 0 });
    });

    const TOTAL_DURATION = 12;
    const DOCK_DURATION = 1.6;

    // Master Timeline: Sticky frame locks to viewport.
    // The starting card glides seamlessly from center stage into the timeline starting dock!
    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        invalidateOnRefresh: true,
      },
      defaults: {
        ease: "none",
      },
    });

    // 1. Beginning Card glides smoothly from dead center to its docked starting position on the left
    masterTl.to(
      card,
      { x: 0, duration: DOCK_DURATION, ease: "power2.inOut" },
      0,
    );

    // 2. Milestone title header awakens and fades into position as the card docks
    if (header) {
      masterTl.to(
        header,
        { opacity: 1, x: 0, duration: DOCK_DURATION * 0.8, ease: "power2.out" },
        DOCK_DURATION * 0.25,
      );
    }

    // 3. Glowing start dot pops on the card's right edge as the card docks
    masterTl.fromTo(
      ".journey-start-dot",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" },
      DOCK_DURATION * 0.85,
    );

    // 4. Horizontal track slide across the screen
    masterTl.to(
      slider,
      { xPercent: slidePercent, duration: TOTAL_DURATION - DOCK_DURATION, ease: "none" },
      DOCK_DURATION,
    );

    // 5. Active glowing accent line shoots out and expands along the center track
    masterTl.to(
      ".journey-line-active",
      { width: lineWidth, duration: TOTAL_DURATION - DOCK_DURATION, ease: "none" },
      DOCK_DURATION,
    );

    // 6. Milestone pop-ins and reveals as each milestone is reached by the active red line
    const stepTimes = isMobile
      ? [2.6, 3.9, 5.3, 6.7, 8.1, 9.4, 10.6]
      : [2.8, 4.2, 5.6, 7.0, 8.4, 9.8, 11.0];

    items.forEach((item, index) => {
      const isTop = topJourneyData.some((topItem) => topItem.id === item.id);
      const t = stepTimes[index] ?? 2.8 + index * 1.3;
      const lineSelector = `.jl-${item.id}`;
      const dotSelector = `.jd-${item.id}`;
      const titleSelector = `.title-${item.id}`;
      const descSelector = `.description-${item.id}`;

      masterTl
        .fromTo(
          dotSelector,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" },
          t,
        )
        .fromTo(
          lineSelector,
          {
            scaleY: 0,
            opacity: 0,
            transformOrigin: isTop ? "bottom center" : "top center",
          },
          { scaleY: 1, opacity: 1, duration: 0.45, ease: "power2.out" },
          t + 0.05,
        )
        .fromTo(
          titleSelector,
          { y: isTop ? 25 : -25, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
          t + 0.12,
        )
        .fromTo(
          descSelector,
          { y: isTop ? 20 : -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
          t + 0.2,
        );
    });

    // 7. End dot pops when the line completes the journey
    masterTl.fromTo(
      ".journey-end-dot",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" },
      11.4,
    );

    const handleResize = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, { dependencies: [reducedMotion], scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="h-[320vh] max-[600px]:h-[420vh] w-full relative"
      style={sectionStyle}
    >
      {/* Sticky Viewport Frame: fills 100vh, vertically centers timeline content dead-center */}
      <div className="sticky top-0 h-screen h-[100svh] w-full max-w-full overflow-hidden flex items-center justify-start pointer-events-auto bg-[#08080a]">
        <div
          ref={wholeSliderRef}
          className="flex h-[38vh] min-h-[260px] max-h-[440px] w-[260vw] items-center gap-[4vw] px-[6vw] max-[600px]:h-[75vh] max-[600px]:w-[750vw] max-[600px]:px-[6vw] select-none"
        >
          {/* Beginning Card: Exact same card as the last card from WorksWheel (Aether IX Holographic HUD) */}
          <div
            ref={cardRef}
            className="group relative h-[38vh] min-h-[260px] max-h-[440px] aspect-[1.45/1] max-[600px]:h-[48vw] max-[600px]:aspect-[1.45/1] overflow-hidden rounded-2xl border border-white/10 ring-1 ring-white/5 shadow-2xl shadow-black/95 flex-shrink-0 bg-[#111114] will-change-transform"
          >
            <img
              src={imageUrl}
              alt={imageAlt}
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            
            {/* Top-right indicator tag */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08080a]/85 border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b1d] shadow-[0_0_8px_#ff3b1d]" />
              <span className="text-[0.68rem] font-mono uppercase tracking-wider text-white/90">08 / 08 • Origin</span>
            </div>

            {/* Bottom title block matching WorksWheel typography */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex flex-col justify-end p-5 sm:p-6 pointer-events-none select-none">
              <span className="text-[0.7rem] sm:text-xs font-mono tracking-[0.25em] text-[#ff3b1d] uppercase font-normal mb-1">
                {cardSubtitle}
              </span>
              <h3 className="font-['Anton',sans-serif] text-xl sm:text-2xl uppercase tracking-tight text-white leading-tight">
                {cardTitle}
              </h3>
            </div>
          </div>

          {/* Interactive Timeline Track */}
          <div className="relative h-full w-full flex-grow">
            {/* Center Horizontal Track Lines */}
            <div className="w-full absolute left-0 top-[50%] -translate-y-1/2 flex items-center h-fit z-0">
              {/* Start Dot - reveals right on the card edge as it docks */}
              <div
                className="journey-start-dot h-[.9vw] min-w-[10px] min-h-[10px] max-[600px]:h-[2.4vw] max-[600px]:w-[2.4vw] rounded-full flex-shrink-0 shadow-[0_0_12px_rgba(255,59,29,0.95)]"
                style={{ ...activeStyle, transform: "scale(0)", opacity: 0 }}
              />
              {/* Clean Track: transparent ahead so NO middle line is visible ahead of the active red line */}
              <div className="relative h-[2px] w-full bg-transparent overflow-hidden">
                {/* Active Glowing Line Scrubbed by Scroll */}
                <div
                  className="absolute left-0 top-0 h-full w-[0%] journey-line-active rounded-full shadow-[0_0_12px_rgba(255,59,29,0.9)]"
                  style={activeStyle}
                />
              </div>
              {/* End Dot - reveals when line reaches the end */}
              <div
                className="journey-end-dot h-[.9vw] min-w-[10px] min-h-[10px] max-[600px]:h-[2.4vw] max-[600px]:w-[2.4vw] rounded-full flex-shrink-0 shadow-[0_0_10px_rgba(255,59,29,0.8)]"
                style={{ ...activeStyle, transform: "scale(0)", opacity: 0 }}
              />
            </div>

            {/* Top Milestones Row */}
            <div className="flex h-1/2 w-full items-center justify-start gap-[1vw] relative z-10">
              {/* Title Header Block */}
              <div
                ref={headerBlockRef}
                className="h-full w-[24%] pt-[2.5vw] max-[600px]:h-fit max-[600px]:pt-[5vw] flex-shrink-0 pr-[2vw] flex flex-col justify-start gap-3 will-change-transform"
              >
                <div
                  className="eyebrow"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontFamily: 'var(--font-sans, "Onest", sans-serif)',
                    fontSize: "var(--text-eyebrow, 0.8125rem)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    color: "var(--muted, #807f78)",
                    lineHeight: "var(--lh-eyebrow, 1.2)",
                  }}
                >
                  <span
                    className="eyebrow-dot"
                    style={{
                      width: "0.5rem",
                      height: "0.5rem",
                      borderRadius: "9999px",
                      backgroundColor: "var(--accent, #ff3b1d)",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  Milestones
                </div>
                <h2
                  className="section-title text-white"
                  style={{
                    fontFamily: 'var(--font-display, "Anton", sans-serif)',
                    fontSize: "var(--text-h2, 3.25rem)",
                    textTransform: "uppercase",
                    lineHeight: "var(--lh-h2, 1)",
                    letterSpacing: "-0.01em",
                    color: "var(--foreground, #f3f1ea)",
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
              </div>

              {/* Milestones Top */}
              <div className="w-full flex h-full gap-x-[16vw] max-[600px]:gap-x-[42vw]">
                {topJourneyData.map((item) => (
                  <div
                    key={`top-${item.id}`}
                    className="relative h-full w-[30vw] max-[600px]:flex max-[600px]:w-[70vw] max-[600px]:flex-col flex-shrink-0"
                  >
                    {/* Vertical Stem & Dot */}
                    <div className="w-[20px] absolute left-0 bottom-0 top-0 h-full flex flex-col justify-end items-start pointer-events-none z-10">
                      <div
                        className={`h-[90%] w-[2px] origin-bottom rounded-full jl-${item.id}`}
                        style={{
                          ...activeStyle,
                          transform: "scaleY(0)",
                          transformOrigin: "bottom center",
                          opacity: 0,
                        }}
                      />
                      <div
                        className={`size-[1.1vw] min-w-[12px] min-h-[12px] max-[600px]:size-[2.6vw] -translate-x-[5px] relative aspect-square rounded-full jd-${item.id} shadow-[0_0_12px_rgba(255,59,29,0.9)]`}
                        style={{
                          ...activeStyle,
                          transform: "scale(0)",
                          opacity: 0,
                        }}
                      />
                    </div>

                    {/* Milestone Copy */}
                    <div
                      className="space-y-[0.75vw] max-[600px]:space-y-[1.5vw] pt-[1vw]"
                      style={{ paddingLeft: "3rem" }}
                    >
                      <h4
                        className={`title-${item.id}`}
                        style={{
                          fontFamily: 'var(--font-display, "Anton", sans-serif)',
                          fontSize: "var(--text-h3, 1.75rem)",
                          textTransform: "uppercase",
                          letterSpacing: "-0.01em",
                          lineHeight: "var(--lh-h3, 1.15)",
                          color: "var(--foreground, #f3f1ea)",
                          margin: 0,
                          opacity: 0,
                          transform: "translateY(25px)",
                        }}
                      >
                        {item.year} {item.month}
                      </h4>
                      <p
                        className={`description-${item.id}`}
                        style={{
                          fontFamily: 'var(--font-sans, "Onest", sans-serif)',
                          fontSize: "var(--text-body, 1.0625rem)",
                          lineHeight: "var(--lh-body, 1.6)",
                          color: "var(--muted, #807f78)",
                          margin: 0,
                          maxWidth: "34ch",
                          opacity: 0,
                          transform: "translateY(20px)",
                        }}
                      >
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Milestones Row */}
            <div className="h-1/2 flex items-center justify-start w-full relative z-10">
              {/* Period Label */}
              <div className="w-[24%] pt-[2.5vw] max-[600px]:pt-[5vw] max-[600px]:w-[28%] h-full flex-shrink-0">
                <p
                  className="eyebrow"
                  style={{
                    fontFamily: 'var(--font-sans, "Onest", sans-serif)',
                    fontSize: "var(--text-eyebrow, 0.8125rem)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    color: "var(--accent, #ff3b1d)",
                    lineHeight: "var(--lh-eyebrow, 1.2)",
                    margin: 0,
                  }}
                >
                  {periodLabel}
                </p>
              </div>

              {/* Milestones Bottom */}
              <div className="w-full flex h-full gap-x-[20vw] ml-[6vw] max-[600px]:gap-x-[42vw] max-[600px]:ml-[6vw]">
                {bottomJourneyData.map((item) => (
                  <div
                    key={`bottom-${item.id}`}
                    className="relative h-full w-[26vw] max-[600px]:w-[70vw] flex-shrink-0"
                  >
                    {/* Vertical Stem & Dot */}
                    <div className="w-[20px] absolute left-0 top-0 h-full flex flex-col justify-start items-start pointer-events-none z-10">
                      <div
                        className={`size-[1.1vw] min-w-[12px] min-h-[12px] max-[600px]:size-[2.6vw] -translate-x-[5px] relative aspect-square rounded-full jd-${item.id} shadow-[0_0_12px_rgba(255,59,29,0.9)]`}
                        style={{
                          ...activeStyle,
                          transform: "scale(0)",
                          opacity: 0,
                        }}
                      />
                      <div
                        className={`h-[90%] origin-top w-[2px] rounded-full jl-${item.id}`}
                        style={{
                          ...activeStyle,
                          transform: "scaleY(0)",
                          transformOrigin: "top center",
                          opacity: 0,
                        }}
                      />
                    </div>

                    {/* Milestone Copy */}
                    <div
                      className="flex h-full w-full flex-col justify-end space-y-[0.75vw] max-[600px]:space-y-[1.5vw] pb-[1vw]"
                      style={{ paddingLeft: "3rem" }}
                    >
                      <h4
                        className={`title-${item.id}`}
                        style={{
                          fontFamily: 'var(--font-display, "Anton", sans-serif)',
                          fontSize: "var(--text-h3, 1.75rem)",
                          textTransform: "uppercase",
                          letterSpacing: "-0.01em",
                          lineHeight: "var(--lh-h3, 1.15)",
                          color: "var(--foreground, #f3f1ea)",
                          margin: 0,
                          opacity: 0,
                          transform: "translateY(-25px)",
                        }}
                      >
                        {item.year} {item.month}
                      </h4>
                      <p
                        className={`description-${item.id}`}
                        style={{
                          fontFamily: 'var(--font-sans, "Onest", sans-serif)',
                          fontSize: "var(--text-body, 1.0625rem)",
                          lineHeight: "var(--lh-body, 1.6)",
                          color: "var(--muted, #807f78)",
                          margin: 0,
                          maxWidth: "34ch",
                          opacity: 0,
                          transform: "translateY(-20px)",
                        }}
                      >
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Mounting helper for index.html or vanilla DOM integrations
export function mountTimeline(container: HTMLElement, props?: TimelineProps) {
  const root = createRoot(container);
  root.render(<Timeline {...props} />);
  return {
    destroy: () => root.unmount(),
  };
}
