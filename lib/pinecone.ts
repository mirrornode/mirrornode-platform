/**
 * lib/pinecone.ts
 * TypeScript-side Pinecone singleton for mirrornode-platform.
 * All Next.js API routes use this — do not instantiate Pinecone directly elsewhere.
 *
 * NOTE: env is checked lazily (inside getPinecone) so Next.js build-time
 * module evaluation does not throw when PINECONE_API_KEY is absent.
 */
import { Pinecone } from '@pinecone-database/pinecone';

let _pinecone: Pinecone | null = null;

export function getPinecone(): Pinecone {
  if (!_pinecone) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) throw new Error('PINECONE_API_KEY is not set');
    _pinecone = new Pinecone({ apiKey });
  }
  return _pinecone;
}

export const PINECONE_INDEX = process.env.PINECONE_INDEX_NAME ?? 'mirrornode-vault';

/** Namespaces — one per agent / domain */
export const NS = {
  librarian: 'librarian',
  lucian: 'lucian',
  osiris: 'osiris',
  thoth: 'thoth',
} as const;

export type Namespace = (typeof NS)[keyof typeof NS];
