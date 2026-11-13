"use client";

import {
    motion,
    useTransform,
    useReducedMotion,
    useMotionValue,
    useSpring,
    MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import WorksWheel, { DEFAULT_WORKS, WorksWheelItem } from "./works-wheel";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const IMAGES = [
    { src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop", title: "Helix OS — Spatial" },
    { src: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop", title: "Aura Design System" },
    { src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop", title: "Northwind Cloud" },
    { src: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop", title: "Cadence Biosensing" },
    { src: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop", title: "Chroma I" },
    { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop", title: "Prism III" },
    { src: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop", title: "Quantum V" },
    { src: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop", title: "Cyber VII" },
    { src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop", title: "Aether IX" },
];

export interface JourneyMilestone {
    id: string;
    year: string;
    month: string;
    content: string;
    isTop: boolean;
}

const DEFAULT_MILESTONES: JourneyMilestone[] = [
    {
        id: "2020-march",
        year: "2020",
        month: "March",
        content: "Signal research turns scattered notes into a clear product thesis",
        isTop: true,
    },
    {
        id: "2020-november",
        year: "2020",
        month: "November",
        content: "Prototype sprint validates the experience with real operators",
        isTop: false,
    },
    {
        id: "2021-july",
        year: "2021",
        month: "July",
        content: "Founding release ships with the first live customer journeys",
        isTop: true,
    },
    {
        id: "2022-october",
        year: "2022",
        month: "October",
        content: "Community feedback reshapes the roadmap into sharper releases",
        isTop: false,
    },
    {
        id: "2023-april",
        year: "2023",
        month: "April",
        content: "Automation layer connects insight, publishing, and sales motion",
        isTop: true,
    },
    {
        id: "2025-september",
        year: "2025",
        month: "September",
        content: "Companion mobile workflows make the timeline travel-ready",
        isTop: false,
    },
    {
        id: "2026-may",
        year: "2026",
        month: "May",
        content: "New markets open with localized launches and faster onboarding",
        isTop: true,
    },
];

interface TunnelCardData {
    item: { src: string; title: string };
    angleCos: number;
    angleSin: number;
    radiusFactorX: number;
    radiusFactorY: number;
    rotationZ: number;
    index: number;
}

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

interface StageDimensions {
    width: number;
    height: number;
    isMobile: boolean;
}

function useCameraParallax(enabled: boolean) {
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const x = useSpring(rawX, SPRING_CONFIG);
    const y = useSpring(rawY, SPRING_CONFIG);

    useEffect(() => {
        if (!enabled) return;
        const onMove = (e: PointerEvent) => {
            rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
            rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
    }, [enabled, rawX, rawY]);

    return { x, y };
}

interface TunnelCardProps {
    card: TunnelCardData;
    progress: MotionValue<number>;
    pointer: { x: MotionValue<number>; y: MotionValue<number> };
    total: number;
    stage: StageDimensions;
}

function TunnelCard({ card, progress, pointer, total, stage }: TunnelCardProps) {
    const flightStart = 0.08;
    const flightEnd = 0.36;
    const windowSpan = flightEnd - flightStart;
    const staggerSpan = 0.18;

    const start = flightStart + (card.index / total) * (windowSpan - staggerSpan);
    const end = start + staggerSpan;

    const localProgress = useTransform(progress, [start, end], [0, 1]);

    const farZ = stage.isMobile ? -1400 : -1900;
    const nearZ = stage.isMobile ? 400 : 600;
    const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);

    const opacity = useTransform(localProgress, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);

    const cardWidth = stage.isMobile
        ? Math.max(130, Math.min(180, stage.width * 0.38))
        : Math.max(180, Math.min(270, stage.width * 0.18));

    const baseX = card.angleCos * (stage.width * card.radiusFactorX);
    const baseY = card.angleSin * (stage.height * card.radiusFactorY);
    const panStrength = stage.isMobile ? 20 : 45;

    const transform = useTransform(
        [z, pointer.x, pointer.y],
        ([currZ, px, py]: number[]) => {
            const offsetX = baseX - px * panStrength;
            const offsetY = baseY - py * panStrength;
            return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) rotateZ(${card.rotationZ}deg)`;
        }
    );

    return (
        <motion.div
            style={{
                width: cardWidth,
                transform,
                opacity,
                zIndex: card.index + 1,
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 aspect-[4/5] will-change-transform select-none"
        >
            <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-[#111114] shadow-2xl shadow-black/90 ring-1 ring-white/10 transition-all duration-500 hover:ring-[#ff3b1d]/80 hover:shadow-[#ff3b1d]/30">
                <img
                    src={card.item.src}
                    alt={card.item.title}
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex items-end p-4 sm:p-5">
                    <span className="text-xs sm:text-sm font-mono tracking-widest uppercase text-white/95 drop-shadow-md">
                        {card.item.title}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export interface PerspectiveTunnelHeroProps {
    images?: { src: string; title: string }[];
    worksItems?: WorksWheelItem[];
    wheelLabel?: string;
    title?: string;
    subtitle?: string;
    eyebrow?: string;
    scrollTrackHeight?: string;
    isPinned?: boolean;
    timelineTitle?: string;
    timelinePeriod?: string;
    milestones?: JourneyMilestone[];
}

export default function PerspectiveTunnelHero({
    images = IMAGES,
    worksItems = DEFAULT_WORKS,
    wheelLabel = "WORKS '26",
    eyebrow = "Spatial Interface Architecture",
    title = "INTO THE ETHER.",
    subtitle = "Scroll through the spatial works corridor.",
    scrollTrackHeight = "800vh",
    isPinned = true,
    timelineTitle = "Product Storyline",
    timelinePeriod = "2020 — 2026",
    milestones = DEFAULT_MILESTONES,
}: PerspectiveTunnelHeroProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const stickyRef = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();

    const tunnelCards: TunnelCardData[] = images.map((item, i) => {
        const goldenAngle = i * 137.5 * (Math.PI / 180);
        const radiusFactorX = 0.28 + (i % 3) * 0.08;
        const radiusFactorY = 0.26 + (i % 2) * 0.09;

        return {
            item,
            angleCos: Math.cos(goldenAngle),
            angleSin: Math.sin(goldenAngle),
            radiusFactorX,
            radiusFactorY,
            rotationZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
            index: i,
        };
    });

    const [stage, setStage] = useState<StageDimensions>({
        width: 1440,
        height: 900,
        isMobile: false,
    });

    useEffect(() => {
        const updateDimensions = () => {
            setStage({
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768,
            });
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Motion value driven by the pinned scroll track
    const rawProgress = useMotionValue(0);
    const smoothProgress = useSpring(rawProgress, {
        stiffness: 70,
        damping: 24,
        restDelta: 0.0001,
    });

    // Pinned ScrollTrigger sequence covering the entire unified journey
    useEffect(() => {
        if (!isPinned) return;
        const track = trackRef.current;
        if (!track) return;

        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: track,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.6,
                onUpdate: (self) => {
                    rawProgress.set(self.progress);
                },
            });
        }, track);

        return () => {
            ctx.revert();
        };
    }, [isPinned, rawProgress]);

    const pointer = useCameraParallax(!reduce);

    // 1. Ambient Background Grid & Crimson Glow
    const ambientOpacity = useTransform(smoothProgress, [0, 0.06, 0.14, 0.94, 0.98, 1.0], [0, 0, 1, 1, 0, 0]);

    // 2. Depth Ring Guides (Corridor flight phase)
    const ringOpacity = useTransform(smoothProgress, [0, 0.06, 0.14, 0.34, 0.38], [0, 0, 1, 1, 0]);

    // 3. Central Title (Corridor flight phase)
    const titleOpacity = useTransform(smoothProgress, [0, 0.06, 0.14, 0.32, 0.37], [0, 0, 1, 1, 0]);
    const titleScale = useTransform(smoothProgress, [0, 0.08, 0.25, 0.36], [0.8, 0.95, 1.15, 1.35]);

    // 4. Scroll Cue Prompt (start)
    const promptOpacity = useTransform(smoothProgress, [0, 0.06, 0.12, 0.18], [0, 1, 1, 0]);

    // 5. Works Wheel Layer (Active 0.36 to 0.62)
    const wheelOpacity = useTransform(smoothProgress, [0.35, 0.39, 0.61, 0.635], [0, 1, 1, 0]);
    const wheelScale = useTransform(smoothProgress, [0.35, 0.40], [0.94, 1.0]);
    const [wheelPointerActive, setWheelPointerActive] = useState(false);

    useEffect(() => {
        const unsub = smoothProgress.on("change", (p) => {
            const active = p >= 0.36 && p <= 0.61;
            setWheelPointerActive(active);
        });
        return () => unsub();
    }, [smoothProgress]);

    // --- TIMELINE CONTINUOUS INTEGRATION ---
    // The exact last card (Aether IX Holographic HUD) starts dead center of the screen
    // (exact same position where the WorksWheel left it at progress 0.60–0.62),
    // and seamlessly glides to the left dock position, sparking the timeline track!
    const cardRatio = 1.45;
    const cardW = stage.isMobile
        ? Math.min(stage.width * 0.72, stage.height * 0.40 * cardRatio)
        : Math.min(stage.height * 0.38 * cardRatio, stage.width * 0.34);
    const cardH = cardW / cardRatio;

    const paddingLeft = stage.width * 0.06;
    // Offset from screen center to docked left position
    const centerOffset = Math.max(0, (stage.width / 2) - (paddingLeft + cardW / 2));

    // Dynamic states driven by scroll progress for the timeline
    const [timelineState, setTimelineState] = useState({
        active: false,
        cardX: centerOffset,
        sliderX: 0,
        activeLineWidthPercent: 0,
        headerOpacity: 0,
        startDotScale: 0,
        endDotScale: 0,
        sliderProgress: 0,
    });

    // Milestone horizontal slide distances
    const maxSlideX = stage.isMobile ? -(stage.width * 4.2) : -(stage.width * 1.65);

    useEffect(() => {
        const unsub = smoothProgress.on("change", (p) => {
            if (p < 0.60) {
                setTimelineState({
                    active: false,
                    cardX: centerOffset,
                    sliderX: 0,
                    activeLineWidthPercent: 0,
                    headerOpacity: 0,
                    startDotScale: 0,
                    endDotScale: 0,
                    sliderProgress: 0,
                });
                return;
            }

            // Phase 4A: Card glides from center to left dock (0.62 -> 0.70)
            const dockT = Math.max(0, Math.min(1, (p - 0.62) / 0.08));
            // Power2 in-out curve for smooth gliding
            const easedDock = dockT < 0.5 ? 2 * dockT * dockT : -1 + (4 - 2 * dockT) * dockT;
            const cardX = centerOffset * (1 - easedDock);

            const headerOpacity = Math.max(0, Math.min(1, (p - 0.64) / 0.06));
            const startDotScale = Math.max(0, Math.min(1, (p - 0.68) / 0.03));

            // Phase 4B: Timeline horizontal track slides and line expands (0.70 -> 0.94)
            const sliderT = Math.max(0, Math.min(1, (p - 0.70) / 0.24));
            const sliderX = sliderT * maxSlideX;
            const activeLineWidthPercent = sliderT * 98;
            const endDotScale = Math.max(0, Math.min(1, (sliderT - 0.94) / 0.04));

            setTimelineState({
                active: p >= 0.60 && p <= 0.99,
                cardX,
                sliderX,
                activeLineWidthPercent,
                headerOpacity,
                startDotScale,
                endDotScale,
                sliderProgress: sliderT,
            });
        });
        return () => unsub();
    }, [smoothProgress, centerOffset, maxSlideX]);

    const timelineContainerOpacity = useTransform(
        smoothProgress,
        [0.605, 0.625, 0.95, 0.99],
        [0, 1, 1, 0]
    );

    // Milestone reveal thresholds along sliderProgress (0.0 to 1.0)
    const milestoneThresholds = useMemo(() => [0.06, 0.18, 0.32, 0.48, 0.63, 0.78, 0.90], []);

    return (
        <div
            ref={trackRef}
            className="relative w-full"
            style={{
                height: isPinned ? scrollTrackHeight : "100svh",
                background: "#08080a",
            }}
        >
            {/* Sticky 100vh Viewport Container that stays pinned across the complete continuous journey */}
            <div
                ref={stickyRef}
                className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#08080a] text-white select-none flex items-center justify-center"
                style={{
                    perspective: stage.isMobile ? "900px" : "1200px",
                    transformStyle: "preserve-3d",
                }}
            >
                {/* Immersive Background Grid & Crimson Glow (continuous across all phases) */}
                <motion.div
                    style={{ opacity: ambientOpacity }}
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(243,241,234,0.08)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]"
                />
                <motion.div
                    style={{ opacity: ambientOpacity }}
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,59,29,0.14)_0%,transparent_75%)]"
                />

                {/* Depth Ring Guides for the warp corridor */}
                <motion.div
                    style={{ opacity: ringOpacity }}
                    className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-[#ff3b1d]/20"
                />
                <motion.div
                    style={{ opacity: ringOpacity }}
                    className="pointer-events-none absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-white/10"
                />

                {/* Central Anchor Typography (Warp corridor flight) */}
                <motion.div
                    style={{ scale: titleScale, opacity: titleOpacity }}
                    className="pointer-events-none z-0 flex flex-col items-center text-center px-6 max-w-xl"
                >
                    <p className="text-xs font-mono uppercase tracking-[0.4em] text-[#ff3b1d] mb-4">
                        {eyebrow}
                    </p>
                    <h2 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter leading-[0.9] font-['Anton',sans-serif] uppercase bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
                        {title.includes("\n") ? (
                            title.split("\n").map((line, idx) => (
                                <span key={idx}>
                                    {line}
                                    <br />
                                </span>
                            ))
                        ) : (
                            title
                        )}
                    </h2>
                    <p className="mt-4 max-w-[36ch] text-sm sm:text-base font-light text-[#807f78]">
                        {subtitle}
                    </p>
                </motion.div>

                {/* Scroll Prompt during initial entry */}
                <motion.div
                    style={{ opacity: promptOpacity }}
                    className="pointer-events-none absolute bottom-8 z-20 flex flex-col items-center gap-2 text-xs font-mono uppercase tracking-[0.3em] text-[#807f78]"
                >
                    <span>Scroll to Warp</span>
                    <div className="h-6 w-px bg-gradient-to-b from-[#ff3b1d] to-transparent" />
                </motion.div>

                {/* 3D Z-Space Corridor Plane */}
                <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {tunnelCards.map((card, i) => (
                        <TunnelCard
                            key={i}
                            card={card}
                            progress={smoothProgress}
                            pointer={pointer}
                            total={tunnelCards.length}
                            stage={stage}
                        />
                    ))}
                </div>

                {/* Works Wheel Showcase (Phase 3: 0.36 -> 0.62) */}
                <motion.div
                    style={{
                        opacity: wheelOpacity,
                        scale: wheelScale,
                    }}
                    className={`absolute inset-0 z-20 flex items-center justify-center ${
                        wheelPointerActive ? "pointer-events-auto" : "pointer-events-none"
                    }`}
                >
                    <WorksWheel
                        items={worksItems}
                        label={wheelLabel}
                        action="Explore"
                        scrollProgress={smoothProgress}
                        scrollRange={[0.38, 0.60]}
                        className="w-full h-full"
                    />
                </motion.div>

                {/* CONTINUOUS TIMELINE JOURNEY (Phase 4: 0.62 -> 0.95)
                    Starts from the EXACT last card of the WorksWheel (Aether IX Holographic HUD).
                    No separate page, no page cut, zero unpinning! */}
                <motion.div
                    style={{
                        opacity: timelineContainerOpacity,
                    }}
                    className={`absolute inset-0 z-30 flex items-center justify-start overflow-hidden ${
                        timelineState.active ? "pointer-events-auto" : "pointer-events-none"
                    }`}
                >
                    {/* Horizontal sliding track that moves across as user scrolls */}
                    <div
                        style={{
                            transform: `translate3d(${timelineState.sliderX}px, 0, 0)`,
                            paddingLeft: `${paddingLeft}px`,
                        }}
                        className="flex h-[38vh] min-h-[260px] max-h-[440px] items-center gap-[4vw] max-[768px]:gap-[6vw] select-none will-change-transform flex-shrink-0"
                    >
                        {/* THE EXACT LAST CARD: Aether IX Holographic HUD
                            Glides smoothly from dead center (timelineState.cardX = centerOffset)
                            to its left dock position (timelineState.cardX = 0) */}
                        <div
                            style={{
                                width: cardW,
                                height: cardH,
                                transform: `translate3d(${timelineState.cardX}px, 0, 0)`,
                            }}
                            className="group relative aspect-[1.45/1] overflow-hidden rounded-2xl border border-white/10 ring-1 ring-white/5 shadow-2xl shadow-black/95 flex-shrink-0 bg-[#111114] will-change-transform z-20 cursor-pointer"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop"
                                alt="Aether IX Holographic HUD"
                                draggable={false}
                                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />

                            {/* Top-right Origin Indicator Tag */}
                            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08080a]/85 border border-white/10 backdrop-blur-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b1d] shadow-[0_0_8px_#ff3b1d]" />
                                <span className="text-[0.68rem] font-mono uppercase tracking-wider text-white/90">08 / 08 • Origin</span>
                            </div>

                            {/* Bottom typography overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex flex-col justify-end p-5 sm:p-6 pointer-events-none select-none">
                                <span className="text-[0.7rem] sm:text-xs font-mono tracking-[0.25em] text-[#ff3b1d] uppercase font-normal mb-1">
                                    Selected 08 / 08 • Spatial Architecture
                                </span>
                                <h3 className="font-['Anton',sans-serif] text-xl sm:text-2xl uppercase tracking-tight text-white leading-tight">
                                    Aether IX Holographic HUD
                                </h3>
                            </div>
                        </div>

                        {/* Interactive Timeline Track connected directly to the right edge of the card */}
                        <div className="relative h-full flex-grow flex items-center w-[220vw] max-[768px]:w-[580vw]">
                            {/* Center Horizontal Track Lines */}
                            <div className="w-full absolute left-0 top-[50%] -translate-y-1/2 flex items-center h-fit z-0">
                                {/* Start Dot: Pops onto the card's right edge as the card docks */}
                                <div
                                    style={{
                                        transform: `scale(${timelineState.startDotScale})`,
                                        opacity: timelineState.startDotScale,
                                    }}
                                    className="h-[.9vw] min-w-[10px] min-h-[10px] max-[768px]:h-[2.4vw] max-[768px]:w-[2.4vw] rounded-full flex-shrink-0 bg-[#ff3b1d] shadow-[0_0_12px_rgba(255,59,29,0.95)] transition-transform duration-300"
                                />

                                {/* Transparent Track with Glowing Expanding Active Red Line */}
                                <div className="relative h-[2px] w-full bg-transparent overflow-hidden">
                                    <div
                                        style={{
                                            width: `${timelineState.activeLineWidthPercent}%`,
                                        }}
                                        className="absolute left-0 top-0 h-full rounded-full bg-[#ff3b1d] shadow-[0_0_12px_rgba(255,59,29,0.95)]"
                                    />
                                </div>

                                {/* End Dot: Pops when timeline completes */}
                                <div
                                    style={{
                                        transform: `scale(${timelineState.endDotScale})`,
                                        opacity: timelineState.endDotScale,
                                    }}
                                    className="h-[.9vw] min-w-[10px] min-h-[10px] max-[768px]:h-[2.4vw] max-[768px]:w-[2.4vw] rounded-full flex-shrink-0 bg-[#ff3b1d] shadow-[0_0_12px_rgba(255,59,29,0.9)] transition-transform duration-300"
                                />
                            </div>

                            {/* Top Milestones Row */}
                            <div className="flex h-1/2 w-full items-center justify-start gap-[1vw] absolute top-0 left-0 z-10">
                                {/* Title Header Block */}
                                <div
                                    style={{
                                        opacity: timelineState.headerOpacity,
                                        transform: `translate3d(${(1 - timelineState.headerOpacity) * 20}px, 0, 0)`,
                                    }}
                                    className="h-full w-[24%] pt-[2.5vw] max-[768px]:h-fit max-[768px]:pt-[4vw] flex-shrink-0 pr-[2vw] flex flex-col justify-start gap-2.5 transition-all duration-300"
                                >
                                    <div className="inline-flex items-center gap-2 font-mono text-[0.75rem] uppercase tracking-[0.22em] text-[#807f78]">
                                        <span className="w-2 h-2 rounded-full bg-[#ff3b1d] inline-block shadow-[0_0_6px_#ff3b1d]" />
                                        Milestones
                                    </div>
                                    <h2 className="font-['Anton',sans-serif] text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-white leading-none m-0">
                                        {timelineTitle}
                                    </h2>
                                </div>

                                {/* Top Milestone Cards */}
                                <div className="w-full flex h-full gap-x-[16vw] max-[768px]:gap-x-[42vw]">
                                    {milestones.filter((m) => m.isTop).map((item) => {
                                        const globalIdx = milestones.findIndex((m) => m.id === item.id);
                                        const threshold = milestoneThresholds[globalIdx] ?? 0.1;
                                        const reached = timelineState.sliderProgress >= threshold;

                                        return (
                                            <div
                                                key={`top-${item.id}`}
                                                className="relative h-full w-[30vw] max-[768px]:w-[70vw] flex-shrink-0"
                                            >
                                                {/* Vertical Stem & Dot */}
                                                <div className="w-[20px] absolute left-0 bottom-0 top-0 h-full flex flex-col justify-end items-start pointer-events-none z-10">
                                                    <div
                                                        style={{
                                                            transform: reached ? "scaleY(1)" : "scaleY(0)",
                                                            opacity: reached ? 1 : 0,
                                                        }}
                                                        className="h-[90%] w-[2px] origin-bottom rounded-full bg-[#ff3b1d] transition-all duration-500 ease-out"
                                                    />
                                                    <div
                                                        style={{
                                                            transform: reached ? "scale(1)" : "scale(0)",
                                                            opacity: reached ? 1 : 0,
                                                        }}
                                                        className="size-[1.1vw] min-w-[12px] min-h-[12px] max-[768px]:size-[2.6vw] -translate-x-[5px] relative aspect-square rounded-full bg-[#ff3b1d] shadow-[0_0_12px_rgba(255,59,29,0.9)] transition-all duration-300 ease-out"
                                                    />
                                                </div>

                                                {/* Milestone Copy */}
                                                <div
                                                    style={{
                                                        paddingLeft: "3rem",
                                                        opacity: reached ? 1 : 0,
                                                        transform: `translate3d(0, ${reached ? 0 : 20}px, 0)`,
                                                    }}
                                                    className="space-y-[0.75vw] max-[768px]:space-y-[1.5vw] pt-[1vw] transition-all duration-500 ease-out"
                                                >
                                                    <h4 className="font-['Anton',sans-serif] text-xl sm:text-2xl uppercase tracking-tight text-white leading-tight m-0">
                                                        {item.year} {item.month}
                                                    </h4>
                                                    <p className="font-sans text-sm sm:text-base text-[#807f78] leading-relaxed max-w-[34ch] m-0">
                                                        {item.content}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Bottom Milestones Row */}
                            <div className="h-1/2 flex items-center justify-start w-full absolute bottom-0 left-0 z-10">
                                {/* Period Label */}
                                <div
                                    style={{
                                        opacity: timelineState.headerOpacity,
                                    }}
                                    className="w-[24%] pt-[2.5vw] max-[768px]:pt-[4vw] max-[768px]:w-[28%] h-full flex-shrink-0 transition-opacity duration-300"
                                >
                                    <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.22em] text-[#ff3b1d] m-0 font-medium">
                                        {timelinePeriod}
                                    </p>
                                </div>

                                {/* Bottom Milestone Cards */}
                                <div className="w-full flex h-full gap-x-[20vw] ml-[6vw] max-[768px]:gap-x-[42vw]">
                                    {milestones.filter((m) => !m.isTop).map((item) => {
                                        const globalIdx = milestones.findIndex((m) => m.id === item.id);
                                        const threshold = milestoneThresholds[globalIdx] ?? 0.2;
                                        const reached = timelineState.sliderProgress >= threshold;

                                        return (
                                            <div
                                                key={`bottom-${item.id}`}
                                                className="relative h-full w-[26vw] max-[768px]:w-[70vw] flex-shrink-0"
                                            >
                                                {/* Vertical Stem & Dot */}
                                                <div className="w-[20px] absolute left-0 top-0 h-full flex flex-col justify-start items-start pointer-events-none z-10">
                                                    <div
                                                        style={{
                                                            transform: reached ? "scale(1)" : "scale(0)",
                                                            opacity: reached ? 1 : 0,
                                                        }}
                                                        className="size-[1.1vw] min-w-[12px] min-h-[12px] max-[768px]:size-[2.6vw] -translate-x-[5px] relative aspect-square rounded-full bg-[#ff3b1d] shadow-[0_0_12px_rgba(255,59,29,0.9)] transition-all duration-300 ease-out"
                                                    />
                                                    <div
                                                        style={{
                                                            transform: reached ? "scaleY(1)" : "scaleY(0)",
                                                            opacity: reached ? 1 : 0,
                                                        }}
                                                        className="h-[90%] origin-top w-[2px] rounded-full bg-[#ff3b1d] transition-all duration-500 ease-out"
                                                    />
                                                </div>

                                                {/* Milestone Copy */}
                                                <div
                                                    style={{
                                                        paddingLeft: "3rem",
                                                        opacity: reached ? 1 : 0,
                                                        transform: `translate3d(0, ${reached ? 0 : -20}px, 0)`,
                                                    }}
                                                    className="flex h-full w-full flex-col justify-end space-y-[0.75vw] max-[768px]:space-y-[1.5vw] pb-[1vw] transition-all duration-500 ease-out"
                                                >
                                                    <h4 className="font-['Anton',sans-serif] text-xl sm:text-2xl uppercase tracking-tight text-white leading-tight m-0">
                                                        {item.year} {item.month}
                                                    </h4>
                                                    <p className="font-sans text-sm sm:text-base text-[#807f78] leading-relaxed max-w-[34ch] m-0">
                                                        {item.content}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

/** Mount helper for HTML / vanilla integration */
export function mountPerspectiveTunnelHero(container: HTMLElement, props?: PerspectiveTunnelHeroProps) {
    const root = createRoot(container);
    root.render(<PerspectiveTunnelHero {...props} />);
    return {
        destroy: () => root.unmount(),
    };
}
