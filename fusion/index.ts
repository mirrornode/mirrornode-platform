/**
 * MIRRORNODE — Fusion Engine
 * Symbolic lattice synthesis layer.
 *
 * Integrates lib/agents.ts manifest as high-level symbolic nodes.
 * Each Agent domain maps to a Numeraethe primitive type.
 * processGlyph() is the recursive entry point for all lattice synthesis.
 *
 * Status: SYMBOLIC_MAPPING v1 — manifest wired, recursion scaffolded
 */

import { Agent, agentList, getAgent } from "@/lib/agents";
import {
  NumeraetheType,
  domainToNumeraethe,
  SymbolicNode,
  GlyphResult,
  LatticeContext,
} from "@/fusion/types";

// ---------------------------------------------------------------------------
// Core: processGlyph
// ---------------------------------------------------------------------------

/**
 * Recursively processes a symbolic glyph through the lattice.
 *
 * Each agent in the manifest is treated as a high-level symbolic node.
 * The glyph is routed through agents whose Numeraethe domain type matches
 * the glyph's primitive type, accumulating synthesis at each depth level.
 *
 * @param glyph     - The symbolic input to process
 * @param context   - Current lattice context (depth, path, agent chain)
 * @returns         - GlyphResult with synthesized output and traversal trace
 */
export function processGlyph(
  glyph: string,
  context: LatticeContext = { depth: 0, path: [], agentChain: [] }
): GlyphResult {
  if (context.depth > 8) {
    // Recursion ceiling — prevent unbounded lattice expansion
    return {
      output: glyph,
      trace: context.path,
      agentChain: context.agentChain,
      depth: context.depth,
      terminated: true,
    };
  }

  // Resolve which agents are symbolically active for this glyph
  const activeNodes = resolveActiveNodes(glyph, context);

  if (activeNodes.length === 0) {
    return {
      output: glyph,
      trace: context.path,
      agentChain: context.agentChain,
      depth: context.depth,
      terminated: false,
    };
  }

  // Pass glyph through each active symbolic node in sequence
  let current = glyph;
  const updatedChain = [...context.agentChain];
  const updatedPath = [...context.path];

  for (const node of activeNodes) {
    const synthesis = synthesizeAtNode(current, node, context.depth);
    current = synthesis.output;
    updatedChain.push(node.agent.id);
    updatedPath.push(`${node.agent.id}[${node.numeraetheType}]`);
  }

  // Recurse with updated context
  return processGlyph(current, {
    depth: context.depth + 1,
    path: updatedPath,
    agentChain: updatedChain,
  });
}

// ---------------------------------------------------------------------------
// Symbolic Node Resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the active symbolic nodes for a given glyph.
 * Filters agents from the manifest by Numeraethe domain match.
 */
function resolveActiveNodes(
  glyph: string,
  context: LatticeContext
): SymbolicNode[] {
  return agentList
    .filter((agent) => {
      // Skip agents already in the chain to prevent cycles
      if (context.agentChain.includes(agent.id)) return false;
      // Only active agents participate in synthesis
      if (agent.status !== "nominal") return false;
      return true;
    })
    .map((agent) => ({
      agent,
      numeraetheType: domainToNumeraethe(agent.domain),
    }))
    .filter((node) => isGlyphCompatible(glyph, node.numeraetheType));
}

/**
 * Determines if a glyph is compatible with a given Numeraethe primitive type.
 * Compatibility is based on glyph content heuristics and type affinity.
 */
function isGlyphCompatible(glyph: string, type: NumeraetheType): boolean {
  switch (type) {
    case "COGNITION":    return /[a-zA-Z]/.test(glyph);       // Lucian — text/semantic input
    case "TRANSACTION":  return /[\d\.\$]/.test(glyph);       // Osiris — numeric/financial
    case "SIGNAL":       return /[\[\]\{\}\|]/.test(glyph);   // Hermes — structured/protocol
    case "MEMORY":       return glyph.length > 32;            // Thoth — long-form, context-rich
    case "SURFACE":      return /[<>]/.test(glyph);           // Theia — markup/visual
    case "STRUCTURE":    return /[\/\\\-_]/.test(glyph);      // Ptah — path/infrastructure
    default:             return false;
  }
}

// ---------------------------------------------------------------------------
// Node Synthesis
// ---------------------------------------------------------------------------

/**
 * Applies symbolic transformation at a single agent node.
 * This is the integration point for per-agent synthesis logic.
 * Extend each case as agent intelligence layers are implemented.
 */
function synthesizeAtNode(
  glyph: string,
  node: SymbolicNode,
  depth: number
): { output: string } {
  const { agent, numeraetheType } = node;

  // Synthesis stub — each agent applies its domain logic to the glyph.
  // Replace with real agent synthesis as intelligence layers are built.
  switch (agent.id) {
    case "lucian":
      return { output: `[LUCIAN:${depth}|${numeraetheType}] ${glyph}` };
    case "osiris":
      return { output: `[OSIRIS:${depth}|${numeraetheType}] ${glyph}` };
    case "hermes":
      return { output: `[HERMES:${depth}|${numeraetheType}] ${glyph}` };
    case "thoth":
      return { output: `[THOTH:${depth}|${numeraetheType}] ${glyph}` };
    case "theia":
      return { output: `[THEIA:${depth}|${numeraetheType}] ${glyph}` };
    case "ptah":
      return { output: `[PTAH:${depth}|${numeraetheType}] ${glyph}` };
    default:
      return { output: glyph };
  }
}

// ---------------------------------------------------------------------------
// Public Utilities
// ---------------------------------------------------------------------------

/**
 * Returns the symbolic node representation of a single agent by ID.
 * Used by external callers (API routes, HUD) to inspect agent lattice position.
 */
export function getSymbolicNode(id: string): SymbolicNode | undefined {
  const agent = getAgent(id);
  if (!agent) return undefined;
  return {
    agent,
    numeraetheType: domainToNumeraethe(agent.domain),
  };
}

/**
 * Returns the full symbolic lattice — all active agents as SymbolicNodes.
 * Used for lattice visualization and telemetry.
 */
export function getLattice(): SymbolicNode[] {
  return agentList
    .filter((a) => a.status === "nominal")
    .map((agent) => ({
      agent,
      numeraetheType: domainToNumeraethe(agent.domain),
    }));
}
