'use client';
import { useRef, useEffect, forwardRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
} from 'motion/react';
import { wrap } from '@motionone/utils';
import { cn } from '@/lib/utils';

export interface ComponentProps {
  children: string;
  baseVelocity: number;
  clasname?: string;
  scrollDependent?: boolean;
  delay?: number;
}

  const Component = forwardRef<HTMLDivElement, ComponentProps>(({
  children,
  baseVelocity = -1.75,
  clasname,
  scrollDependent = false,
  delay = 0,
}, ref) => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 2], {
    clamp: false,
  });

  // 4 identical spans in motion.div = each span is exactly 25% of total width.
  // Wrapping within [-25%, 0%] creates a mathematically seamless, gapless infinite loop!
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);

  const directionFactor = useRef<number>(1);
  const hasStarted = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      hasStarted.current = true;
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useAnimationFrame((t, delta) => {
    if (!hasStarted.current) return;

    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (scrollDependent) {
      if (velocityFactor.get() < 0) {
        directionFactor.current = -1;
      } else if (velocityFactor.get() > 0) {
        directionFactor.current = 1;
      }
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div ref={ref} className='overflow-hidden whitespace-nowrap flex flex-nowrap select-none w-full py-1'>
      <motion.div
        className='flex whitespace-nowrap flex-nowrap will-change-transform'
        style={{ x }}
      >
        {/* 4 duplicated spans ensure the screen is 100% full on all screen widths with zero empty space */}
        <span className={cn(`shrink-0 whitespace-nowrap block text-[3.8vw] md:text-[4.5vw] lg:text-[5vw] xl:text-[5.5vw] uppercase font-display leading-[105%] tracking-[-0.025em] pr-8 md:pr-14`, clasname)}>
          {children}
        </span>
        <span className={cn(`shrink-0 whitespace-nowrap block text-[3.8vw] md:text-[4.5vw] lg:text-[5vw] xl:text-[5.5vw] uppercase font-display leading-[105%] tracking-[-0.025em] pr-8 md:pr-14`, clasname)}>
          {children}
        </span>
        <span className={cn(`shrink-0 whitespace-nowrap block text-[3.8vw] md:text-[4.5vw] lg:text-[5vw] xl:text-[5.5vw] uppercase font-display leading-[105%] tracking-[-0.025em] pr-8 md:pr-14`, clasname)}>
          {children}
        </span>
        <span className={cn(`shrink-0 whitespace-nowrap block text-[3.8vw] md:text-[4.5vw] lg:text-[5vw] xl:text-[5.5vw] uppercase font-display leading-[105%] tracking-[-0.025em] pr-8 md:pr-14`, clasname)}>
          {children}
        </span>
      </motion.div>
    </div>
  );
});

Component.displayName = 'Component';

export default Component;

// Portfolio dual-direction velocity-aware marquee filling the full screen
export interface TextMarqueeSectionProps {
  row1?: string;
  row2?: string;
  className?: string;
}

export function TextMarqueeSection({
  row1 = "User-Centered   Design Systems   Micro-Interactions   Pixel Perfection   Purposeful Motion   ",
  row2 = "Clarity Over Noise   Spatial Systems   Interface Architecture   Tactile Craft   ",
  className,
}: TextMarqueeSectionProps = {}) {
  return (
    <div className={cn("w-full py-10 md:py-16 my-4 md:my-6 flex flex-col justify-center items-center gap-3 md:gap-5 overflow-hidden bg-[#08080a] text-[#f3f1ea] select-none", className)}>
      {/* Line 1 - moving left at reduced speed */}
      <Component
        delay={100}
        baseVelocity={-1.05}
        scrollDependent={true}
        clasname="text-white hover:text-[#ff3b1d] transition-colors"
      >
        {row1}
      </Component>

      {/* Line 2 - moving right at reduced speed */}
      <Component
        delay={100}
        baseVelocity={1.05}
        scrollDependent={true}
        clasname="text-[#64635d] hover:text-[#f3f1ea] transition-colors"
      >
        {row2}
      </Component>
    </div>
  );
}

// Mounting function for index.html or vanilla DOM integration
export function mountTextMarquee(container: HTMLElement, options?: TextMarqueeSectionProps) {
  const root = createRoot(container);
  root.render(<TextMarqueeSection {...options} />);
  return {
    destroy: () => root.unmount(),
  };
}

// Backward-compatibility aliases
export const mountDesignToolsMarquee = mountTextMarquee;
export const mountMarqueeAlongSvgPath = mountTextMarquee;
