import React, { RefObject, useCallback, useEffect, useRef } from "react"
import { createRoot } from "react-dom/client"
import {
  motion,
  SpringOptions,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react"

import { cn } from "@/lib/utils"

// Custom wrap function
const wrap = (min: number, max: number, value: number): number => {
  const range = max - min
  return ((((value - min) % range) + range) % range) + min
}

type PreserveAspectRatioAlign =
  | "none"
  | "xMinYMin"
  | "xMidYMin"
  | "xMaxYMin"
  | "xMinYMid"
  | "xMidYMid"
  | "xMaxYMid"
  | "xMinYMax"
  | "xMidYMax"
  | "xMaxYMax"

interface CSSVariableInterpolation {
  property: string
  from: number | string
  to: number | string
}

type PreserveAspectRatioMeetOrSlice = "meet" | "slice"

type PreserveAspectRatio =
  | PreserveAspectRatioAlign
  | `${Exclude<PreserveAspectRatioAlign, "none">} ${PreserveAspectRatioMeetOrSlice}`

export interface MarqueeAlongSvgPathProps {
  children: React.ReactNode
  className?: string

  // Path properties
  path: string
  pathId?: string
  preserveAspectRatio?: PreserveAspectRatio
  showPath?: boolean

  // SVG properties
  width?: string | number
  height?: string | number
  viewBox?: string

  // Marquee properties
  baseVelocity?: number
  direction?: "normal" | "reverse"
  easing?: (value: number) => number
  slowdownOnHover?: boolean
  slowDownFactor?: number
  slowDownSpringConfig?: SpringOptions

  // Scroll properties
  useScrollVelocity?: boolean
  scrollAwareDirection?: boolean
  scrollSpringConfig?: SpringOptions
  scrollContainer?: RefObject<HTMLElement | null> | HTMLElement | null

  // Item repetition
  repeat?: number

  // Drag properties
  draggable?: boolean
  dragSensitivity?: number
  dragVelocityDecay?: number
  dragAwareDirection?: boolean
  grabCursor?: boolean

  // Z-index properties
  enableRollingZIndex?: boolean
  zIndexBase?: number
  zIndexRange?: number

  cssVariableInterpolation?: CSSVariableInterpolation[]

  // Responsive properties
  responsive?: boolean
}

export const MarqueeAlongSvgPath = ({
  children,
  className,

  // Path defaults
  path,
  pathId,
  preserveAspectRatio = "xMidYMid meet",
  showPath = false,

  // SVG defaults
  width = "100%",
  height = "100%",
  viewBox = "0 0 100 100",

  // Marquee defaults
  baseVelocity = 5,
  direction = "normal",
  easing,
  slowdownOnHover = false,
  slowDownFactor = 0.3,
  slowDownSpringConfig = { damping: 50, stiffness: 400 },

  // Scroll defaults
  useScrollVelocity = false,
  scrollAwareDirection = false,
  scrollSpringConfig = { damping: 50, stiffness: 400 },
  scrollContainer,

  // Items repetition
  repeat = 3,

  // Drag defaults
  draggable = false,
  dragSensitivity = 0.2,
  dragVelocityDecay = 0.96,
  dragAwareDirection = false,
  grabCursor = false,

  // Z-index defaults
  enableRollingZIndex = true,
  zIndexBase = 1, // Base z-index value
  zIndexRange = 10, // Range of z-index values to use

  cssVariableInterpolation = [],

  // Responsive defaults
  responsive = false,
}: MarqueeAlongSvgPathProps) => {
  const container = useRef<HTMLDivElement>(null)
  const marqueeContainerRef = useRef<HTMLDivElement>(null)
  const baseOffset = useMotionValue(0)

  const pathRef = useRef<SVGPathElement>(null)

  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Responsive scaling using direct DOM manipulation (no re-renders)
  useEffect(() => {
    if (!responsive) return

    const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number)
    const originalWidth = vbWidth || 100
    const originalHeight = vbHeight || 100

    const updateScale = () => {
      const wrapper = container.current
      const marqueeContainer = marqueeContainerRef.current
      if (!wrapper || !marqueeContainer) return

      const wrapperWidth = wrapper.clientWidth
      const wrapperHeight = wrapper.clientHeight

      const scaleX = wrapperWidth / originalWidth
      const scaleY = wrapperHeight / originalHeight
      const scale = Math.min(scaleX, scaleY)

      // Calculate the scaled dimensions
      const scaledWidth = originalWidth * scale
      const scaledHeight = originalHeight * scale

      // Center the marquee container within the wrapper
      const offsetX = (wrapperWidth - scaledWidth) / 2
      const offsetY = (wrapperHeight - scaledHeight) / 2

      // Set fixed dimensions on the container
      marqueeContainer.style.width = `${originalWidth}px`
      marqueeContainer.style.height = `${originalHeight}px`

      // Apply scale and position to center
      marqueeContainer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
      marqueeContainer.style.transformOrigin = "top left"
    }

    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [responsive, viewBox])

  // Create an array of items outside of the render function
  const items = React.useMemo(() => {
    const childrenArray = React.Children.toArray(children)

    return childrenArray.flatMap((child, childIndex) =>
      Array.from({ length: repeat }, (_, repeatIndex) => {
        const itemIndex = repeatIndex * childrenArray.length + childIndex
        const key = `${childIndex}-${repeatIndex}`
        return {
          child,
          childIndex,
          repeatIndex,
          itemIndex,
          key,
        }
      })
    )
  }, [children, repeat])

  // Function to calculate z-index based on offset distance
  const calculateZIndex = useCallback(
    (offsetDistance: number) => {
      if (!enableRollingZIndex) {
        return undefined
      }

      // Simple progress-based z-index
      const normalizedDistance = offsetDistance / 100
      return Math.floor(zIndexBase + normalizedDistance * zIndexRange)
    },
    [enableRollingZIndex, zIndexBase, zIndexRange]
  )

  // Generate a random ID for the path if not provided
  const id = pathId || `marquee-path-${Math.random().toString(36).substring(7)}`

  // Scroll tracking
  const { scrollY } = useScroll({
    container: (scrollContainer as RefObject<HTMLDivElement | null>) || container,
  })

  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, scrollSpringConfig)

  // Hover and drag state tracking
  const isHovered = useRef(false)
  const isDragging = useRef(false)
  const dragVelocity = useRef(0)

  // Direction factor for changing direction based on scroll or drag
  const directionFactor = useRef(direction === "normal" ? 1 : -1)

  // Motion values for animation
  const hoverFactorValue = useMotionValue(1)
  const defaultVelocity = useMotionValue(1)
  const smoothHoverFactor = useSpring(hoverFactorValue, slowDownSpringConfig)

  // Transform scroll velocity into a factor that affects marquee speed
  const velocityFactor = useTransform(
    useScrollVelocity ? smoothVelocity : defaultVelocity,
    [0, 1000],
    [0, 5],
    { clamp: false }
  )

  // Animation frame handler
  useAnimationFrame((_, delta) => {
    if (isDragging.current && draggable) {
      baseOffset.set(baseOffset.get() + dragVelocity.current)

      // Add decay to dragVelocity
      dragVelocity.current *= 0.9

      // Stop completely if velocity is very small
      if (Math.abs(dragVelocity.current) < 0.01) {
        dragVelocity.current = 0
      }

      return
    }

    // Update hover factor
    if (isHovered.current) {
      hoverFactorValue.set(slowdownOnHover ? slowDownFactor : 1)
    } else {
      hoverFactorValue.set(1)
    }

    // Calculate regular movement
    let moveBy =
      directionFactor.current *
      baseVelocity *
      (delta / 1000) *
      smoothHoverFactor.get()

    // Adjust movement based on scroll velocity if scrollAwareDirection is enabled
    if (scrollAwareDirection && !isDragging.current) {
      if (velocityFactor.get() < 0) {
        directionFactor.current = -1
      } else if (velocityFactor.get() > 0) {
        directionFactor.current = 1
      }
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get()

    if (draggable) {
      moveBy += dragVelocity.current

      // Update direction based on drag direction if dragAwareDirection is true
      if (dragAwareDirection && Math.abs(dragVelocity.current) > 0.1) {
        directionFactor.current = Math.sign(dragVelocity.current)
      }

      // Gradually decay drag velocity back to zero
      if (!isDragging.current && Math.abs(dragVelocity.current) > 0.01) {
        dragVelocity.current *= dragVelocityDecay
      } else if (!isDragging.current) {
        dragVelocity.current = 0
      }
    }

    baseOffset.set(baseOffset.get() + moveBy)
  })

  // Pointer event handlers for dragging
  const lastPointerPosition = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!draggable) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

    if (grabCursor) {
      ;(e.currentTarget as HTMLElement).style.cursor = "grabbing"
    }

    isDragging.current = true
    lastPointerPosition.current = { x: e.clientX, y: e.clientY }

    // Pause automatic animation by setting velocity to 0
    dragVelocity.current = 0
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggable || !isDragging.current) return

    const currentPosition = { x: e.clientX, y: e.clientY }

    // Calculate movement delta - simplified for path movement
    const deltaX = currentPosition.x - lastPointerPosition.current.x
    const deltaY = currentPosition.y - lastPointerPosition.current.y

    // For path following, we use a simple magnitude of movement
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const projectedDelta = deltaX > 0 ? delta : -delta

    // Update drag velocity based on the projected movement
    dragVelocity.current = projectedDelta * dragSensitivity

    // Update last position
    lastPointerPosition.current = currentPosition
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggable) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    isDragging.current = false

    if (grabCursor) {
      ;(e.currentTarget as HTMLElement).style.cursor = "grab"
    }
  }

  return (
    <div
      ref={container}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn("relative", className)}
    >
      <div
        ref={marqueeContainerRef}
        className="relative"
        style={{ contain: "layout style" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height={height}
          viewBox={viewBox}
          preserveAspectRatio={preserveAspectRatio}
          className="w-full h-full"
        >
          <path
            id={id}
            d={path}
            stroke={showPath ? "currentColor" : "none"}
            fill="none"
            ref={pathRef}
          />
        </svg>

        {items.map(({ child, repeatIndex, itemIndex, key }) => {
          // Create a unique offset transform for each item
          const itemOffset = useTransform(baseOffset, (v) => {
            const position = (itemIndex * 100) / items.length
            const wrappedValue = wrap(0, 100, v + position)
            return `${easing ? easing(wrappedValue / 100) * 100 : wrappedValue}%`
          })

          // Create a motion value for the current offset distance
          const currentOffsetDistance = useMotionValue(0)

          // Update z-index when offset distance changes
          const zIndex = useTransform(currentOffsetDistance, (value) =>
            calculateZIndex(value)
          )

          // Update current offset distance value when animation runs
          useEffect(() => {
            const unsubscribe = itemOffset.on("change", (value: string) => {
              // Parse percentage string to get numerical value
              const match = value.match(/^([\d.]+)%$/)
              if (match && match[1]) {
                currentOffsetDistance.set(parseFloat(match[1]))
              }
            })
            return unsubscribe
          }, [itemOffset, currentOffsetDistance])

          const cssVariables = Object.fromEntries(
            (cssVariableInterpolation || []).map(({ property, from, to }) => [
              property,
              useTransform(currentOffsetDistance, [0, 100], [from, to]),
            ])
          )

          return (
            <motion.div
              key={key}
              ref={(el) => {
                if (el) itemRefs.current.set(key, el)
              }}
              className={cn(
                "absolute top-0 left-0",
                draggable && grabCursor && "cursor-grab"
              )}
              style={{
                offsetPath: `path('${path}')`,
                offsetDistance: itemOffset,
                offsetAnchor: "center center",
                transform: "translate(-50%, -50%)",
                zIndex: enableRollingZIndex ? zIndex : undefined,
                willChange: "offset-distance",
                backfaceVisibility: "hidden",
                ...cssVariables,
              }}
              aria-hidden={repeatIndex > 0}
              onMouseEnter={() => (isHovered.current = true)}
              onMouseLeave={() => (isHovered.current = false)}
            >
              {child}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default MarqueeAlongSvgPath

// The continuous organic curved SVG path
export const SVG_MARQUEE_PATH =
  "M1 209.434C58.5872 255.935 387.926 325.938 482.583 209.434C600.905 63.8051 525.516 -43.2211 427.332 19.9613C329.149 83.1436 352.902 242.723 515.041 267.302C644.752 286.966 943.56 181.94 995 156.5"

export interface ToolLogoItem {
  id: string
  name: string
  category: string
  color: string
}

export const TOOL_LOGOS: ToolLogoItem[] = [
  { id: "figma", name: "Figma", category: "Design", color: "#F24E1E" },
  { id: "react", name: "React", category: "Library", color: "#61DAFB" },
  { id: "typescript", name: "TypeScript", category: "Language", color: "#3178C6" },
  { id: "framer", name: "Framer", category: "Motion", color: "#0055FF" },
  { id: "tailwind", name: "Tailwind", category: "Styling", color: "#06B6D4" },
  { id: "nextjs", name: "Next.js", category: "Framework", color: "#FFFFFF" },
  { id: "spline", name: "Spline 3D", category: "Spatial UI", color: "#FF5E62" },
  { id: "javascript", name: "JavaScript", category: "Language", color: "#F7DF1E" },
  { id: "gsap", name: "GSAP", category: "Animation", color: "#0AE448" },
  { id: "html5", name: "HTML5", category: "Markup", color: "#E34F26" },
  { id: "css3", name: "CSS3", category: "Styling", color: "#1572B6" },
  { id: "webflow", name: "Webflow", category: "Visual Dev", color: "#146EF5" },
  { id: "github", name: "GitHub", category: "Workflow", color: "#FFFFFF" },
  { id: "nodejs", name: "Node.js", category: "Runtime", color: "#539E43" },
  { id: "python", name: "Python", category: "Language", color: "#387EB8" },
  { id: "system", name: "Design Tokens", category: "Tokens", color: "#A259FF" },
]

export function renderLogoIcon(id: string, color: string) {
  const iconStyle = {
    width: "30px",
    height: "30px",
    minWidth: "30px",
    minHeight: "30px",
    display: "block",
  }

  switch (id) {
    case "figma":
      return (
        <svg width="30" height="30" viewBox="0 0 38 57" fill="none" style={iconStyle}>
          <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE" />
          <path d="M0 47.5a9.5 9.5 0 0 0 9.5 9.5 9.5 9.5 0 0 0 9.5-9.5V38H9.5A9.5 9.5 0 0 0 0 47.5z" fill="#0ACF83" />
          <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#FF7262" />
          <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E" />
          <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF" />
        </svg>
      )
    case "react":
      return (
        <svg width="30" height="30" viewBox="-11.5 -10.23174 23 20.46348" fill="none" style={iconStyle}>
          <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
          <g stroke="#61DAFB" strokeWidth="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>
      )
    case "typescript":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <rect width="24" height="24" rx="5" fill="#3178C6" />
          <path d="M4 7h6v2H8v8H6V9H4V7zm7.5 7.2c.7.6 1.6.9 2.5.9 1.1 0 1.7-.5 1.7-1.2 0-.8-.7-1.1-1.9-1.5-1.7-.6-2.7-1.3-2.7-2.7 0-1.6 1.3-2.7 3.2-2.7 1.2 0 2.2.4 2.8.9l-.8 1.6c-.6-.4-1.3-.7-2-.7-.8 0-1.4.4-1.4 1 0 .7.6 1 1.8 1.4 1.8.6 2.8 1.4 2.8 2.8 0 1.7-1.4 2.8-3.5 2.8-1.4 0-2.6-.4-3.4-1.1l.7-1.5z" fill="#FFFFFF" />
        </svg>
      )
    case "javascript":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <rect width="24" height="24" rx="5" fill="#F7DF1E" />
          <path d="M7.5 16.8c.6.4 1.3.6 2 .6 1.2 0 1.9-.6 1.9-1.8V9h2.1v6.6c0 2.4-1.4 3.6-3.8 3.6-1.3 0-2.4-.4-3.1-.9l.9-1.5zm7.3-.1c.7.4 1.5.7 2.4.7 1 0 1.6-.4 1.6-1.1 0-.7-.6-1-1.7-1.4-1.6-.6-2.6-1.3-2.6-2.6 0-1.6 1.2-2.7 3.1-2.7 1.1 0 2 .3 2.6.7l-.8 1.5c-.5-.3-1.2-.5-1.8-.5-.7 0-1.3.3-1.3.9 0 .6.5.9 1.6 1.3 1.7.6 2.7 1.3 2.7 2.7 0 1.7-1.3 2.8-3.4 2.8-1.3 0-2.4-.4-3.2-1l.8-1.3z" fill="#000000" />
        </svg>
      )
    case "framer":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <path d="M4 2h16v7h-8zM4 9h8l8 7H4zM4 16h8v7z" fill="#0055FF" />
        </svg>
      )
    case "tailwind":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <path d="M12 6C9.33333 6 7.66667 7.33333 7 10C8 8.66667 9.16667 8.16667 10.5 8.5C11.3889 8.7963 12.0238 9.44197 12.7265 10.1565C13.8711 11.3204 15.2017 12.6735 18 12.6735C20.6667 12.6735 22.3333 11.3401 23 8.67347C22 10.0068 20.8333 10.5068 19.5 10.1735C18.6111 9.87717 17.9762 9.2315 17.2735 8.51703C16.1289 7.35307 14.7983 6 12 6ZM6 12C3.33333 12 1.66667 13.3333 1 16C2 14.6667 3.16667 14.1667 4.5 14.5C5.38889 14.7963 6.02381 15.442 6.72653 16.1565C7.87113 17.3204 9.2017 18.6735 12 18.6735C14.6667 18.6735 16.3333 17.3401 17 14.6735C16 16.0068 14.8333 16.5068 13.5 16.1735C12.6111 15.8772 11.9762 15.2315 11.2735 14.517C10.1289 13.3531 8.7983 12 6 12Z" fill="#06B6D4" />
        </svg>
      )
    case "nextjs":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <rect width="24" height="24" rx="12" fill="#000000" stroke="#38383e" strokeWidth="1" />
          <path d="M15.5 16.5L8.5 7H7v10h1.5V9.5l6.5 8.5h1.5v-1.5z" fill="#FFFFFF" />
          <rect x="14" y="7" width="1.5" height="5" fill="#FFFFFF" />
        </svg>
      )
    case "spline":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <rect width="24" height="24" rx="6" fill="#141419" />
          <path d="M12 3.5L4.5 7.8L12 12.1L19.5 7.8L12 3.5Z" fill="#FF5E62" />
          <path d="M4.5 8.2V15.8L12 20.1V12.5L4.5 8.2Z" fill="#9C27B0" />
          <path d="M19.5 8.2L12 12.5V20.1L19.5 15.8V8.2Z" fill="#00E5FF" />
        </svg>
      )
    case "html5":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <path d="M3 2L5 20L12 22L19 20L21 2H3Z" fill="#E44D26" />
          <path d="M12 3.8V20.2L17.5 18.7L19.2 3.8H12Z" fill="#F16529" />
          <path d="M7 6.5H17L16.7 9H9.3L9.6 12H16.4L16 16.5L12 17.6L8 16.5L7.7 13.5H9.8L10 14.8L12 15.3L14 14.8L14.2 12.8H7L6.7 6.5H7Z" fill="#FFFFFF" />
        </svg>
      )
    case "css3":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <path d="M3 2L5 20L12 22L19 20L21 2H3Z" fill="#1572B6" />
          <path d="M12 3.8V20.2L17.5 18.7L19.2 3.8H12Z" fill="#33A9DC" />
          <path d="M7 6.5H17L16.7 9H9.3L9.6 12H16.4L16 16.5L12 17.6L8 16.5L7.7 13.5H9.8L10 14.8L12 15.3L14 14.8L14.2 12.8H7L6.7 6.5H7Z" fill="#FFFFFF" />
        </svg>
      )
    case "gsap":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <rect width="24" height="24" rx="6" fill="#0AE448" />
          <circle cx="12" cy="12" r="5" fill="#000000" />
          <path d="M11 9L15 12L11 15V9Z" fill="#0AE448" />
        </svg>
      )
    case "webflow":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <path d="M21.5 5.5H17.8L15.3 12.8L12.7 5.5H8.7L6.2 12.8L3.7 5.5H0L4.3 18.5H8L10.5 11.2L13 18.5H16.7L21.5 5.5Z" fill="#146EF5" />
        </svg>
      )
    case "nodejs":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <polygon points="12 2 21 7.2 21 17.5 12 22.8 3 17.5 3 7.2" fill="#539E43" />
          <path d="M12 4.5L18.5 8.2V15.8L12 19.5L5.5 15.8V8.2L12 4.5Z" fill="#222226" />
          <text x="12" y="14.5" fill="#539E43" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">JS</text>
        </svg>
      )
    case "python":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <path d="M11.9 2c-3.1 0-2.9 1.3-2.9 1.3l.01 1.4h2.9v.4H6.3S4 5.3 4 8.5s2 3.1 2 3.1h1.2V9.9s-.1-1.9 1.9-1.9h3.2s1.8.03 1.8-1.7V4.5s.3-2.5-2.2-2.5zm-1.6 1.3a.7.7 0 1 1 0 1.4.7.7 0 0 1 0-1.4z" fill="#387EB8" />
          <path d="M12.1 22c3.1 0 2.9-1.3 2.9-1.3l-.01-1.4h-2.9v-.4h5.6s2.3-.2 2.3-3.4-2-3.1-2-3.1h-1.2v1.7s.1 1.9-1.9 1.9h-3.2s-1.8-.03-1.8 1.7v1.8s-.3 2.5 2.2 2.5zm1.6-1.3a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4z" fill="#FFE873" />
        </svg>
      )
    case "system":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <rect x="2.5" y="2.5" width="8" height="8" rx="2" fill="#FF5E62" />
          <rect x="13.5" y="2.5" width="8" height="8" rx="2" fill="#A259FF" />
          <rect x="2.5" y="13.5" width="8" height="8" rx="2" fill="#0ACF83" />
          <rect x="13.5" y="13.5" width="8" height="8" rx="2" fill="#1ABCFE" />
        </svg>
      )
    case "github":
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <rect width="24" height="24" rx="12" fill="#24292E" />
          <path fillRule="evenodd" clipRule="evenodd" d="M12 4C7.58 4 4 7.58 4 12c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0020 12c0-4.42-3.58-8-8-8z" fill="#FFFFFF" />
        </svg>
      )
    default:
      return (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
          <polyline points="16 18 22 12 16 6" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="8 6 2 12 8 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
  }
}

export interface MarqueeAlongSvgPathDemoProps {
  className?: string
  items?: ToolLogoItem[]
  baseVelocity?: number
}

export function MarqueeAlongSvgPathDemo({
  className,
  items = TOOL_LOGOS,
  baseVelocity = 8,
}: MarqueeAlongSvgPathDemoProps = {}) {
  return (
    <div className={cn("w-full h-full min-h-[380px] md:min-h-[440px] bg-transparent flex items-center justify-center relative overflow-hidden select-none", className)}>
      {/* Subtle guide line glow */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 996 330"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
      >
        <path
          d={SVG_MARQUEE_PATH}
          stroke="#ff3b1d"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          fill="none"
        />
      </svg>

      <MarqueeAlongSvgPath
        path={SVG_MARQUEE_PATH}
        viewBox="0 0 996 330"
        baseVelocity={baseVelocity}
        slowdownOnHover={true}
        draggable={true}
        repeat={2}
        dragSensitivity={0.1}
        className="w-full h-full scale-105"
        responsive={true}
        grabCursor={true}
        showPath={false}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="group/logo relative flex flex-col items-center justify-between w-[84px] h-[108px] md:w-[96px] md:h-[120px] rounded-2xl bg-[#0f0f15]/95 border border-white/12 shadow-[0_12px_30px_rgba(0,0,0,0.85)] backdrop-blur-md p-2.5 transition-all duration-300 ease-in-out hover:scale-135 hover:border-[#ff3b1d] hover:shadow-[0_16px_36px_rgba(255,59,29,0.35)] hover:z-50 cursor-grab active:cursor-grabbing select-none shrink-0"
          >
            {/* Brand top glow strip */}
            <div
              className="absolute top-0 inset-x-0 h-1 rounded-t-2xl opacity-60 group-hover/logo:opacity-100 transition-opacity"
              style={{ backgroundColor: item.color }}
            />

            {/* Category tag */}
            <span className="text-[8px] uppercase tracking-wider text-[#888882] font-semibold leading-none pt-0.5 truncate max-w-full">
              {item.category}
            </span>

            {/* Logo container */}
            <div
              className="w-12 h-12 md:w-13 md:h-13 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover/logo:scale-110 shadow-inner"
              style={{
                backgroundColor: `${item.color}15`,
                borderColor: `${item.color}45`,
              }}
            >
              {renderLogoIcon(item.id, item.color)}
            </div>

            {/* Tool / Language Name */}
            <span className="text-[11px] md:text-xs font-bold text-white tracking-tight leading-tight group-hover/logo:text-[#ff3b1d] transition-colors truncate max-w-full text-center">
              {item.name}
            </span>
          </div>
        ))}
      </MarqueeAlongSvgPath>
    </div>
  )
}

// Mounting function for direct DOM integration
export function mountMarqueeAlongSvgPath(container: HTMLElement) {
  const root = createRoot(container)
  root.render(<MarqueeAlongSvgPathDemo />)
  return {
    destroy: () => root.unmount(),
  }
}

// Backward-compatibility aliases
export const mountDesignToolsMarquee = mountMarqueeAlongSvgPath
export const DesignToolsMarquee = MarqueeAlongSvgPathDemo

