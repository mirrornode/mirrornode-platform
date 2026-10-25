import type { Metadata } from "next";
import { MirrornodeVisualSurface } from "@/components/mirrornode/MirrornodeVisualSurface";
import { PublicLaneOverview } from "@/components/mirrornode/PublicLaneOverview";
import { PublicPrinciples } from "@/components/mirrornode/PublicPrinciples";
import { SurfaceHero } from "@/components/mirrornode/SurfaceHero";
import { SurfaceLaneSelector } from "@/components/mirrornode/SurfaceLaneSelector";

export const metadata: Metadata = {
  title: "MIRRORNODE | Control. Continuity. Evidence.",
  description: "Human-reviewed structural assessments for AI systems. Build capability while keeping decisions, boundaries, and evidence understandable.",
  openGraph: {
    title: "MIRRORNODE | Control. Continuity. Evidence.",
    description: "Build capability. Keep responsibility. Explore human-reviewed AI systems assessment.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MIRRORNODE | Control. Continuity. Evidence.",
    description: "Build capability. Keep responsibility.",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <SurfaceHero />
      <PublicPrinciples />
      <MirrornodeVisualSurface />
      <SurfaceLaneSelector />
      <PublicLaneOverview />
    </main>
  );
}
