/**
 * lib/pinecone.ts
 * TypeScript-side Pinecone singleton for mirrornode-platform.
 * All Next.js API routes use this — do not instantiate Pinecone directly elsewhere.
 */
import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is not set');
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const PINECONE_INDEX = process.env.PINECONE_INDEX_NAME ?? 'mirrornode-vault';

/** Namespaces — one per agent / domain */
export const NS = {
  librarian: 'librarian',
  lucian: 'lucian',
  osiris: 'osiris',
  thoth: 'thoth',
} as const;

export type Namespace = (typeof NS)[keyof typeof NS];
