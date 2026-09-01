import type { NextConfig } from "next";
import path from "node:path";

// Anchor Turbopack to the package working directory.
// This remains stable in Git worktrees and Vercel, where npm runs from the project root.
const projectRoot = path.resolve(process.cwd());

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
