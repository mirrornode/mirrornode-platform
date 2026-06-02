import { NextResponse } from 'next/server';
import { getUserFromBearer } from '@/utils/supabase/server';
import { pinecone, PINECONE_INDEX, NS } from '@/lib/pinecone';
import { embedText, extractText } from '@/lib/embeddings';

function determineTier(fileSize: number) {
  if (fileSize < 250_000) {
    return { severity: 'LOW' as const, quote: 49, checkoutTier: 'tier1' as const };
  }
  if (fileSize < 1_000_000) {
    return { severity: 'MEDIUM' as const, quote: 149, checkoutTier: 'tier2' as const };
  }
  return { severity: 'HIGH' as const, quote: 499, checkoutTier: 'tier3' as const };
}

export async function POST(req: Request) {
  try {
    // 1. Auth
    const { user, error: authError } = await getUserFromBearer(req);
    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    // 2. File
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No document provided.' }, { status: 400 });
    }

    // 3. Triage (size-based for now; semantic triage can replace this later)
    const { severity, quote, checkoutTier } = determineTier(file.size);
    const documentId = `doc_${user.id}_${Date.now()}`;

    // 4. Extract text → embed
    const text = await extractText(file);
    const vector = await embedText(
      `filename: ${file.name}\n\n${text}`
    );

    // 5. Upsert to mirrornode-vault under the librarian namespace
    const index = pinecone.Index(PINECONE_INDEX);
    await index.namespace(NS.librarian).upsert([
      {
        id: documentId,
        values: vector,
        metadata: {
          owner_id: user.id,
          vaulted: false,
          paid: false,
          filename: file.name,
          mime_type: file.type || 'application/octet-stream',
          bytes: file.size,
          severity,
          quote,
          checkout_tier: checkoutTier,
          source: 'librarian',
          ingested_at: new Date().toISOString(),
        },
      },
    ]);

    // 6. Return triage result to the UI
    return NextResponse.json({
      success: true,
      documentId,
      severity,
      quote,
      checkoutTier,
      message: 'Document embedded and vaulted. Awaiting payment to unlock audit.',
    });
  } catch (error) {
    console.error('[librarian/ingest]', error);
    return NextResponse.json({ error: 'Ingestion failed.' }, { status: 500 });
  }
}
