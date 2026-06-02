/**
 * POST /api/thoth/query
 *
 * Thoth is the retrieval agent — the read side of mirrornode-vault.
 * Accepts a natural-language query, embeds it, runs a similarity search
 * against Pinecone, and returns ranked matches with metadata.
 *
 * Body: { query: string, namespace?: string, topK?: number }
 * Auth: Bearer token (Supabase session)
 */
import { NextResponse } from 'next/server';
import { getUserFromBearer } from '@/utils/supabase/server';
import { queryVault } from '@/lib/pinecone';
import { embedText } from '@/lib/embeddings';
import { NS } from '@/lib/pinecone';

export async function POST(req: Request) {
  try {
    // 1. Auth
    const { user, error: authError } = await getUserFromBearer(req);
    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json() as {
      query?: string;
      namespace?: string;
      topK?: number;
    };

    const { query, namespace = NS.librarian, topK = 5 } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'query is required.' }, { status: 400 });
    }

    // 3. Embed the query
    const vector = await embedText(query.trim());

    // 4. Search the vault
    const matches = await queryVault({
      vector,
      namespace,
      topK,
      filter: { owner_id: user.id },
    });

    return NextResponse.json({
      ok: true,
      query,
      namespace,
      matches,
    });
  } catch (error) {
    console.error('[thoth/query]', error);
    return NextResponse.json({ error: 'Query failed.' }, { status: 500 });
  }
}
