'use client';

import { ReactLenis } from 'lenis/react';
import React, { forwardRef } from 'react';

// Default component as provided in specifications
const Component = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>((props, ref) => {
  return (
    <ReactLenis root>
      <main ref={ref} {...props}>
        <article>
          <section className='text-white h-screen w-full bg-slate-950 grid place-content-center sticky top-0'>
            <div className='absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]'></div>

            <h1 className='2xl:text-7xl text-6xl px-8 font-semibold text-center tracking-tight leading-[120%]'>
              I Know What Exactly you're <br /> Looking For! Scroll Please 👇
            </h1>
          </section>

          <section className='bg-gray-300 text-black grid place-content-center h-screen sticky top-0 rounded-tr-2xl rounded-tl-2xl overflow-hidden'>
            <div className='absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]'></div>
            <h1 className='2xl:text-7xl text-4xl px-8 font-semibold text-center tracking-tight leading-[120%]'>
              here is it<br /> enjoy it!
            </h1>
          </section>
          <section className='text-white h-screen w-full bg-slate-950 grid place-content-center sticky top-0'>
            <div className='absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]'></div>
            <h1 className='2xl:text-7xl text-5xl px-8 font-semibold text-center tracking-tight leading-[120%]'>
              Thanks To Scroll.
              <br /> Now Scroll Up Again☝️🏿
            </h1>
          </section>
        </article>
      </main>
    </ReactLenis>
  );
});

Component.displayName = 'Component';

export default Component;

// Project Card interface for Marcus Vane's 4 core projects
export interface ProjectItem {
  id: string;
  index: string;
  title: string;
  category: string;
  year: string;
  award: string;
  description: string;
  image: string;
  tags: string[];
  statLabel: string;
  statValue: string;
  href: string;
  bgColor: string;
}

export const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'helix-os',
    index: '01 / 04',
    title: 'Helix OS',
    category: 'Enterprise UX & Spatial Control',
    year: '2024',
    award: 'Red Dot: Best of Best',
    description: 'Real-time autonomous robotics interface and spatial telemetry dashboard deployed across 40 countries.',
    image: 'https://api.getlayers.ai/storage/v1/object/public/public/assets/marcus-vane-6799bd1fb6/ventures/venture-01.webp',
    tags: ['Spatial UI', 'Autonomous Robotics', 'Telemetry', 'Three.js'],
    statLabel: 'Deployment Reach',
    statValue: '40+ Countries',
    href: '#ventures',
    bgColor: '#0a0a0d',
  },
  {
    id: 'northwind-cloud',
    index: '02 / 04',
    title: 'Northwind Cloud',
    category: 'Energy Analytics & Mobile UI',
    year: '2023',
    award: '4.9★ Store Rating',
    description: 'Data-dense energy telemetry platform turning millions of sensor streams into effortless operational decisions.',
    image: 'https://api.getlayers.ai/storage/v1/object/public/public/assets/marcus-vane-6799bd1fb6/ventures/venture-02.webp',
    tags: ['Energy Grid', 'Real-time Telemetry', 'Design Tokens', 'iOS & Android'],
    statLabel: 'Stream Capacity',
    statValue: '1.8M Sensors',
    href: '#ventures',
    bgColor: '#111116',
  },
  {
    id: 'cadence-health',
    index: '03 / 04',
    title: 'Cadence Health',
    category: 'Healthcare UI & Accessibility',
    year: '2022',
    award: 'UX Design Award',
    description: 'Accessible patient-clinician telemedicine experience reducing remote consultation onboarding friction by 64%.',
    image: 'https://api.getlayers.ai/storage/v1/object/public/public/assets/marcus-vane-6799bd1fb6/ventures/venture-03.webp',
    tags: ['Telehealth', 'WCAG AAA', 'Clinical Care', 'Encrypted Video'],
    statLabel: 'Onboarding Friction',
    statValue: '-64% Time',
    href: '#ventures',
    bgColor: '#0c0c10',
  },
  {
    id: 'aura-design-system',
    index: '04 / 04',
    title: 'Aura Design System',
    category: 'Design Tokens & Component Kit',
    year: '2025',
    award: 'Enterprise System',
    description: 'Comprehensive multi-brand token library, accessible component set, and motion guidelines powering 12+ SaaS products.',
    image: 'https://api.getlayers.ai/storage/v1/object/public/public/assets/marcus-vane-6799bd1fb6/ventures/venture-04.webp',
    tags: ['Design Systems', 'Multi-Brand', 'WCAG 2.2', 'Motion Specs'],
    statLabel: 'Ecosystem Scale',
    statValue: '12+ SaaS Apps',
    href: '#ventures',
    bgColor: '#15151c',
  },
];

export interface ProjectsStackedCardsProps {
  projects?: ProjectItem[];
  withLenis?: boolean;
}

export function ProjectsStackedCards({
  projects = DEFAULT_PROJECTS,
  withLenis = false,
}: ProjectsStackedCardsProps) {
  const content = (
    <div className="relative w-full">
      <article className="relative w-full">
        {projects.map((project, index) => {
          return (
            <section
              key={project.id}
              id={`project-card-${index + 1}`}
              className="h-screen w-full sticky top-0 overflow-hidden rounded-t-[28px] md:rounded-t-[36px] shadow-[0_-30px_80px_rgba(0,0,0,0.95)] border-t border-white/15 bg-[#08080a]"
            >
              <img
                src={project.image}
                alt={project.title}
                loading="lazy"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
              />
            </section>
          );
        })}
      </article>
    </div>
  );

  if (withLenis) {
    return <ReactLenis root>{content}</ReactLenis>;
  }

  return content;
}
