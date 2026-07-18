"use client";

import { useMemo, useReducer } from "react";
import {
  deriveLaneInteractionState,
  initialLaneInteractionModel,
  laneInteractionReducer,
  type LaneInteractionState,
} from "@/content/mirrornode/laneInteraction";
import { lanes } from "@/content/mirrornode/lanes";
import { SurfaceBoundaryNotice } from "./SurfaceBoundaryNotice";
import { SurfaceStateBadge } from "./SurfaceStateBadge";

const interactionLabels: Record<LaneInteractionState, string> = {
  unselected: "Unselected",
  selected: "Selected",
  "boundary-required": "Boundary required",
  acknowledged: "Acknowledged",
  blocked: "Blocked",
  invalid: "Invalid",
};

export function SurfaceLaneSelector() {
  const [model, dispatch] = useReducer(
    laneInteractionReducer,
    initialLaneInteractionModel,
  );

  const selectedLane = useMemo(
    () => lanes.find((lane) => lane.slug === model.selectedSlug),
    [model.selectedSlug],
  );
  const interactionState = deriveLaneInteractionState(selectedLane, model);
  const canEnter =
    Boolean(selectedLane?.ctaHref && selectedLane?.ctaLabel) &&
    (interactionState === "selected" || interactionState === "acknowledged");

  return (
    <section id="lanes" className="mx-auto max-w-7xl px-6 py-12 md:px-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">Lanes</p>
          <h2 className="mt-2 text-3xl font-semibold text-white md:text-5xl">Enter by purpose, not by noise.</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-white/55">
          Each lane names what it can do, what it does not claim, and where review remains.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3 md:grid-cols-2" aria-label="Public lanes">
          {lanes.map((lane) => {
            const isSelected = lane.slug === model.selectedSlug;

            return (
              <button
                key={lane.slug}
                type="button"
                onClick={() => dispatch({ type: "select", slug: lane.slug })}
                aria-pressed={isSelected}
                aria-controls="lane-inspector"
                className={[
                  "min-h-44 rounded-lg border p-4 text-left transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070a]",
                  "motion-reduce:transition-none",
                  isSelected
                    ? "border-cyan-200/50 bg-cyan-200/[0.08]"
                    : "border-white/10 bg-white/[0.03] hover:border-cyan-200/40 hover:bg-cyan-200/[0.06]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">{lane.title}</h3>
                  <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/50">
                    {lane.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-cyan-100/70">{lane.descriptor}</p>
                <p className="mt-4 text-sm leading-6 text-white/55">{lane.body}</p>
              </button>
            );
          })}
        </div>

        <aside
          id="lane-inspector"
          aria-live="polite"
          aria-atomic="true"
          className="h-fit rounded-lg border border-cyan-300/20 bg-slate-950/70 p-5 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.05)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Lane inspector</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                {selectedLane?.title ?? "Choose a lane"}
              </h3>
            </div>
            <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/60">
              {interactionLabels[interactionState]}
            </span>
          </div>

          {interactionState === "unselected" ? (
            <p className="mt-4 text-sm leading-6 text-white/60">
              Select a lane to inspect its public boundary and available action.
            </p>
          ) : null}

          {interactionState === "invalid" ? (
            <div className="mt-4">
              <p className="text-sm leading-6 text-rose-100/85">
                This lane record could not be resolved. No action is available.
              </p>
              <button
                type="button"
                onClick={() => dispatch({ type: "clear" })}
                className="mt-4 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                Return to lanes
              </button>
            </div>
          ) : null}

          {selectedLane && interactionState !== "invalid" ? (
            <>
              <p className="mt-4 text-sm leading-6 text-white/65">{selectedLane.body}</p>
              <div className="mt-4">
                <SurfaceBoundaryNotice state={selectedLane.exposureState} depth="detail" />
              </div>

              {interactionState === "boundary-required" ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "acknowledge" })}
                  className="mt-4 w-full rounded-lg border border-amber-200/30 bg-amber-200/10 px-4 py-2.5 text-sm font-semibold text-amber-50 transition hover:border-amber-200/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 motion-reduce:transition-none"
                >
                  Acknowledge this boundary
                </button>
              ) : null}

              {interactionState === "blocked" ? (
                <p className="mt-4 text-sm leading-6 text-amber-100/80">
                  This lane is explanatory only and does not expose an entry action.
                </p>
              ) : null}

              {canEnter && selectedLane.ctaHref && selectedLane.ctaLabel ? (
                <a
                  href={selectedLane.ctaHref}
                  className="mt-4 inline-flex rounded-lg border border-cyan-200/25 bg-cyan-200/10 px-4 py-2.5 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 motion-reduce:transition-none"
                >
                  {selectedLane.ctaLabel}
                </a>
              ) : null}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <SurfaceStateBadge state={selectedLane.exposureState} />
                <button
                  type="button"
                  onClick={() => dispatch({ type: "clear" })}
                  className="text-sm text-white/55 underline-offset-4 hover:text-white/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                >
                  Clear selection
                </button>
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
