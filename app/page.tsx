import { MirrornodeVisualSurface } from "@/components/mirrornode/MirrornodeVisualSurface";
import { PublicLaneOverview } from "@/components/mirrornode/PublicLaneOverview";
import { SurfaceHero } from "@/components/mirrornode/SurfaceHero";
import { SurfaceLaneSelector } from "@/components/mirrornode/SurfaceLaneSelector";

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
