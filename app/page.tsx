import type { Metadata } from "next";
import { MirrornodeVisualSurface } from "@/components/mirrornode/MirrornodeVisualSurface";
import { PublicLaneOverview } from "@/components/mirrornode/PublicLaneOverview";
import { SurfaceHero } from "@/components/mirrornode/SurfaceHero";
import { SurfaceLaneSelector } from "@/components/mirrornode/SurfaceLaneSelector";

export const metadata: Metadata = {
  title: "Mirrornode | Governed AI Coordination",
  description:
    "A static public orientation surface for Mirrornode: context, routing, review, authority boundaries, and delivery without unsupported live-state claims.",
  openGraph: {
    title: "Mirrornode | Governed AI Coordination",
    description:
      "Explore Mirrornode as a static public visual surface for governed AI coordination, lane routing, review boundaries, and delivery.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Mirrornode | Governed AI Coordination",
    description:
      "A static public visual surface for governed AI coordination and review-aware delivery.",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <SurfaceHero />
      <MirrornodeVisualSurface />
      <SurfaceLaneSelector />
      <PublicLaneOverview />
    </main>
  );
}
