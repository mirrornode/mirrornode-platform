import type { Metadata } from "next";
import { MirrornodeVisualSurface } from "@/components/mirrornode/MirrornodeVisualSurface";
import { ProviderIndependentSpine } from "@/components/mirrornode/ProviderIndependentSpine";
import { PublicLaneOverview } from "@/components/mirrornode/PublicLaneOverview";
import { SurfaceHero } from "@/components/mirrornode/SurfaceHero";
import { SurfaceLaneSelector } from "@/components/mirrornode/SurfaceLaneSelector";

export const metadata: Metadata = {
  title: "MIRRORNODE | Controlled AI Infrastructure",
  description:
    "MIRRORNODE is building provider-independent AI control infrastructure for capability continuity, bounded authority, and verifiable evidence across changing models and compute.",
  openGraph: {
    title: "MIRRORNODE | Controlled AI Infrastructure",
    description:
      "Provider-independent AI control infrastructure for capability continuity, bounded authority, and verifiable evidence.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MIRRORNODE | Controlled AI Infrastructure",
    description:
      "Provider-independent AI control infrastructure for capability continuity, bounded authority, and verifiable evidence.",
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
