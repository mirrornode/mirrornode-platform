import type { Metadata } from "next";
import { MirrornodeVisualSurface } from "@/components/mirrornode/MirrornodeVisualSurface";
import { ProviderIndependentSpine } from "@/components/mirrornode/ProviderIndependentSpine";
import { PublicLaneOverview } from "@/components/mirrornode/PublicLaneOverview";
import { SurfaceHero } from "@/components/mirrornode/SurfaceHero";
import { SurfaceLaneSelector } from "@/components/mirrornode/SurfaceLaneSelector";

export const metadata: Metadata = {
  title: "MIRRORNODE | Capability Continuity for AI Systems",
  description:
    "MIRRORNODE is building control infrastructure so critical AI capability, explicit authority boundaries, and verifiable evidence can survive changes in models, providers, credentials, and compute.",
  openGraph: {
    title: "MIRRORNODE | Capability Continuity for AI Systems",
    description:
      "Models are replaceable. Your capability, authority, and evidence should not be.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MIRRORNODE | Capability Continuity for AI Systems",
    description:
      "Models are replaceable. Your capability, authority, and evidence should not be.",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <SurfaceHero />
      <ProviderIndependentSpine />
      <MirrornodeVisualSurface />
      <SurfaceLaneSelector />
      <PublicLaneOverview />
    </main>
  );
}
