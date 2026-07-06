"use client";

import { useMemo, useState } from "react";
import { surfaceNodes } from "@/content/mirrornode/nodes";
import { SurfaceNodeInspector } from "./SurfaceNodeInspector";
import { MirrornodeProcessSequence } from "./MirrornodeProcessSequence";

const positionClass: Record<string, string> = {
  center: "left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2",
  "upper-left": "left-[18%] top-[22%] h-16 w-16",
  "upper-right": "right-[18%] top-[22%] h-16 w-16",
  "lower-left": "left-[20%] bottom-[24%] h-16 w-16",
  "lower-right": "right-[20%] bottom-[24%] h-16 w-16",
  bottom: "left-1/2 bottom-[10%] h-16 w-16 -translate-x-1/2",
};

const colorClass: Record<string, string> = {
  cyan: "border-cyan-200 bg-cyan-200/20 shadow-cyan-300/30",
  emerald: "border-emerald-200 bg-emerald-200/20 shadow-emerald-300/30",
  blue: "border-blue-200 bg-blue-200/20 shadow-blue-300/30",
  amber: "border-amber-200 bg-amber-200/20 shadow-amber-300/30",
  rose: "border-rose-200 bg-rose-200/20 shadow-rose-300/30",
  violet: "border-violet-200 bg-violet-200/20 shadow-violet-300/30",
};

export function MirrornodeVisualSurface() {
  const [selectedId, setSelectedId] = useState<(typeof surfaceNodes)[number]["id"]>("core-hub");
  const selectedNode = useMemo(
    () => surfaceNodes.find((node) => node.id === selectedId) ?? surfaceNodes[0],
    [selectedId],
  );

  return (
    <section id="surface" className="bg-[#05070a] px-6 py-12 text-white md:px-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="rounded-lg border border-cyan-300/15 bg-slate-950/55 p-4">
          <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_50%_45%,rgba(103,232,249,0.18),transparent_18rem)]">
            <div className="absolute inset-8 rounded-full border border-cyan-200/10" />
            <div className="absolute inset-20 rounded-full border border-cyan-200/10" />
            <div className="absolute left-1/2 top-1/2 h-px w-[58%] -translate-x-1/2 bg-cyan-200/20" />
            <div className="absolute left-1/2 top-1/2 h-[58%] w-px -translate-y-1/2 bg-cyan-200/20" />

            {surfaceNodes.map((node) => {
              const isSelected = node.id === selectedId;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                  className={[
                    "absolute grid place-items-center rounded-full border text-center shadow-2xl transition",
                    positionClass[node.position],
                    colorClass[node.color],
                    isSelected ? "scale-110 ring-2 ring-white/70" : "hover:scale-105",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  <span className="px-2 text-xs font-semibold leading-tight text-white">{node.name}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <MirrornodeProcessSequence />
          </div>
        </div>

        <SurfaceNodeInspector node={selectedNode} />
      </div>
    </section>
  );
}
