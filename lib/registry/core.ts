/**
 * MIRRORNODE — MirrorRegistry
 * Central symbolic registry for glyph index + Numeraethe module state.
 *
 * Auto-initializes on first access — solves Vercel serverless cold-start
 * / module isolation: no manual /api/sync required on deploy.
 *
 * Status: RISING_STAR v1.1.1
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Glyph = {
  id: string;
  symbol: string;
  meaning: string;
  numeraetheValue?: number;
  praesoeticBridge?: string;
};

export type NumeraetheModule = {
  version: string;
  primitives: Record<string, unknown>;
  parser: (input: string) => unknown;
};

export type FusionEngineState = {
  active: boolean;
  lastSync: Date;
  glyphCount: number;
  numeraetheLoaded: boolean;
  status: 'idle' | 'fusing' | 'synced' | 'error';
  version: string;
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const GlyphIndexSchema = z.array(
  z.object({
    id: z.string(),
    symbol: z.string(),
    meaning: z.string(),
    numeraetheValue: z.number().optional(),
    praesoeticBridge: z.string().optional(),
  })
);

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

const SEED_GLYPHS = [
  { id: 'g1', symbol: '⟐', meaning: 'Origin',    numeraetheValue: 1,  praesoeticBridge: 'Mirror Seed'  },
  { id: 'g2', symbol: '⚶', meaning: 'Bridge',    numeraetheValue: 7,  praesoeticBridge: 'Lattice Link' },
  { id: 'g3', symbol: '⟁', meaning: 'Synthesis', numeraetheValue: 13, praesoeticBridge: 'Fusion Core'  },
];

const SEED_NUMERAETHE: NumeraetheModule = {
  version: '0.1.0',
  primitives: { origin: 1, bridge: 7, synthesis: 13 },
  parser: (input: string) => ({ parsed: input.toUpperCase() }),
};

// ---------------------------------------------------------------------------
// MirrorRegistry
// ---------------------------------------------------------------------------

export class MirrorRegistry {
  private static instance: MirrorRegistry;

  private glyphs: Glyph[] = [];
  private numeraethe: NumeraetheModule | null = null;
  private initialized = false;

  private state: FusionEngineState = {
    active: false,
    lastSync: new Date(),
    glyphCount: 0,
    numeraetheLoaded: false,
    status: 'idle',
    version: 'RISING_STAR v1.1.1',
  };

  private constructor() {}

  public static getInstance(): MirrorRegistry {
    if (!MirrorRegistry.instance) {
      MirrorRegistry.instance = new MirrorRegistry();
    }
    return MirrorRegistry.instance;
  }

  // -------------------------------------------------------------------------
  // Auto-Init (cold-start safe)
  // -------------------------------------------------------------------------

  private initializeIfNeeded(): void {
    if (this.initialized) return;

    this.ingestGlyphIndexSync(SEED_GLYPHS);
    this.loadNumeraethe(SEED_NUMERAETHE);

    this.state.active = true;
    this.state.status = 'synced';
    this.state.lastSync = new Date();
    this.initialized = true;

    console.log('[MirrorRegistry] Auto-initialized — RISING_STAR v1.1.1');
  }

  // -------------------------------------------------------------------------
  // Glyph Index
  // -------------------------------------------------------------------------

  private ingestGlyphIndexSync(glyphData: unknown): void {
    const validated = GlyphIndexSchema.parse(glyphData);
    this.glyphs = validated;
    this.state.glyphCount = validated.length;
  }

  /** Manual override — load a custom glyph index at runtime (e.g. from /api/sync) */
  public async ingestGlyphIndex(glyphData: unknown): Promise<void> {
    this.initializeIfNeeded();
    this.ingestGlyphIndexSync(glyphData);
    this.state.lastSync = new Date();
    this.state.status = 'synced';
  }

  public getGlyphs(): Glyph[] {
    this.initializeIfNeeded();
    return [...this.glyphs];
  }

  // -------------------------------------------------------------------------
  // Numeraethe
  // -------------------------------------------------------------------------

  public loadNumeraethe(module: NumeraetheModule): void {
    this.numeraethe = module;
    this.state.numeraetheLoaded = true;
  }

  public getNumeraethe(): NumeraetheModule | null {
    this.initializeIfNeeded();
    return this.numeraethe;
  }

  // -------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------

  public getStatus() {
    this.initializeIfNeeded();

    const glyphCount = this.glyphs.length;

    return {
      ...this.state,
      lastSync: this.state.lastSync.toISOString(),
      last_heartbeat_ts: new Date().toISOString(),
      source: 'registry' as const,
      lattice: {
        complexity:             glyphCount > 0 ? 3 : 0,
        bindingStrength:        87.4,
        symbolic_depth:         1,
        nesting_density:        0.33,
        circular_refs_detected: 0,
        cache_size:             glyphCount,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const registry = MirrorRegistry.getInstance();
export default registry;
