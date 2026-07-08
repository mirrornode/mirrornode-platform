import type { Metadata } from "next";
import { LittleFoxConsole } from "@/components/little-fox/LittleFoxConsole";

export const metadata: Metadata = {
  title: "Little Fox | MIRRORNODE Audit Surface v0",
  description:
    "A small inspectable MIRRORNODE console for system state, active modules, recent outputs, and the next reviewable move.",
  openGraph: {
    title: "Little Fox | MIRRORNODE Audit Surface v0",
    description:
      "Inspect system state, active modules, recent outputs, and the review boundary for MIRRORNODE.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Little Fox | MIRRORNODE Audit Surface v0",
    description: "A small reviewable console surface for MIRRORNODE continuity and handoff.",
  },
};

export default function LittleFoxPage() {
  return <LittleFoxConsole />;
}
