"use client";

import { useState } from "react";
import { osirisRuntimeAdapters } from "@/content/osiris/runtimeAdapters";

export default function OsirisRuntimeAdapterPanel() {
  const [selectedAdapterIndex, setSelectedAdapterIndex] = useState(0);
  const selectedAdapter = osirisRuntimeAdapters[selectedAdapterIndex];

  return (
    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-black/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">
            Runtime adapters
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">
            Same audit sequence, different evidence lens
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            The client sees one stable Osiris pipeline. The backend swaps the
            runtime lens, evidence sources, trust boundaries, finding labels,
            and proof format.
          </p>
        </div>

        <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cyan-100">
          {osirisRuntimeAdapters.length} lenses
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {osirisRuntimeAdapters.map((adapter, index) => {
          const active = selectedAdapterIndex === index;

          return (
            <button
              key={adapter.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedAdapterIndex(index)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.16em] transition ${
                active
                  ? "border-cyan-200/70 bg-cyan-300/15 text-cyan-100 shadow-[0_0_22px_rgba(103,232,249,0.16)]"
                  : "border-zinc-800 bg-zinc-950/80 text-zinc-500 hover:border-cyan-300/35 hover:text-cyan-100"
              }`}
            >
              {adapter.runtimeFamily}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
              Selected lens
            </p>
            <h4 className="mt-1 text-xl font-semibold text-zinc-100">
              {selectedAdapter.name}
            </h4>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              {selectedAdapter.description}
            </p>
          </div>

          <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-amber-100">
            {selectedAdapter.id}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AdapterList title="Primitives" items={selectedAdapter.primitives} />
          <AdapterList
            title="Trust boundaries"
            items={selectedAdapter.trustBoundaries}
          />
          <AdapterList
            title="Evidence"
            items={selectedAdapter.evidenceSources}
          />
          <AdapterList
            title="Finding labels"
            items={selectedAdapter.findingSublabels}
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <AdapterChipGroup
            title="Common bug classes"
            items={selectedAdapter.commonBugClasses}
          />
          <AdapterChipGroup
            title="Proof format"
            items={selectedAdapter.proofFormat}
          />
        </div>
      </div>
    </div>
  );
}

function AdapterList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.slice(0, 6).map((item) => (
          <li
            key={item}
            className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-6 text-zinc-300"
          >
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.45)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdapterChipGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-amber-200/70">
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-zinc-800 bg-black/30 px-3 py-1 text-xs text-zinc-300"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
