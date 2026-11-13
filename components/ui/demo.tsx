"use client";

import WorksWheel, { DEFAULT_WORKS } from "@/components/ui/works-wheel";

export function WorksWheelDemo() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#08080a] p-0">
      <div className="w-full h-screen">
        <WorksWheel items={DEFAULT_WORKS} label="WORKS '26" action="Explore" />
      </div>
    </main>
  );
}

export default function Demo() {
  return <WorksWheelDemo />;
}
