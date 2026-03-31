/**
 * MIRRORNODE — Fusion Engine Types
 * Numeraethe primitive type system and lattice data structures.
 */

import { Agent } from "@/lib/agents";

// ---------------------------------------------------------------------------
// Numeraethe Primitive Types
// ---------------------------------------------------------------------------

/**
 * Numeraethe is the symbolic type language of the MIRRORNODE lattice.
 * Each primitive maps to a domain of agent cognition.
 *
 * COGNITION   → Semantic / reasoning layer      (Lucian)
 * TRANSACTION → Financial / state mutation      (Osiris)
 * SIGNAL      → Communication / protocol        (Hermes)
 * MEMORY      → Persistence / knowledge graph   (Thoth)
 * SURFACE     → Rendering / interface           (Theia)
 * STRUCTURE   → Infrastructure / systems        (Ptah)
 */
export type NumeraetheType =
  | "COGNITION"
  | "TRANSACTION"
  | "SIGNAL"
  | "MEMORY"
  | "SURFACE"
  | "STRUCTURE"
  | "UNKNOWN";

/**
 * Maps Agent domain labels to Numeraethe primitive types.
 * This is the canonical domain → type registry.
 */
export function domainToNumeraethe(domain: string): NumeraetheType {
  const map: Record<string, NumeraetheType> = {
    "Cognitive Routing":       "COGNITION",
    "Financial State":         "TRANSACTION",
    "Communication Layer":     "SIGNAL",
    "Persistent State":        "MEMORY",
    "Front-End Intelligence":  "SURFACE",
    "DevOps & Systems":        "STRUCTURE",
  };
  return map[domain] ?? "UNKNOWN";
}

// ---------------------------------------------------------------------------
// Lattice Data Structures
// ---------------------------------------------------------------------------

/** A single agent represented as a symbolic node in the lattice. */
export interface SymbolicNode {
  agent: Agent;
  numeraetheType: NumeraetheType;
}

/** The traversal context passed through each recursion of processGlyph(). */
export interface LatticeContext {
  depth: number;
  path: string[];        // Human-readable traversal trace
  agentChain: string[];  // Agent IDs visited (cycle prevention)
}

/** The result returned by processGlyph() after full lattice traversal. */
export interface GlyphResult {
  output: string;
  trace: string[];
  agentChain: string[];
  depth: number;
  terminated: boolean;   // true if recursion ceiling was hit
}
