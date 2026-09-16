import { NextResponse } from 'next/server';
import { getUserFromBearer } from '@/utils/supabase/server';
import { getPinecone, PINECONE_INDEX, NS } from '@/lib/pinecone';
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

    const purpose =
      formData.get('purpose') === 'workspace' ? 'workspace' : 'audit';

    if (purpose === 'workspace') {
      const mime = file.type || '';
      const supported =
        mime.startsWith('text/') ||
        mime === 'application/json';

      if (!supported) {
        return NextResponse.json(
          {
            error:
              'Workspace indexing currently supports text, Markdown, CSV, and JSON only.',
          },
          { status: 415 },
        );
      }
    }

    const documentId = `doc_${user.id}_${Date.now()}`;
    const ingestedAt = new Date().toISOString();

    // Extracted text is embedded externally; source file bytes are not retained here.
    const text = await extractText(file);
    const vector = await embedText(`filename: ${file.name}\n\n${text}`);

    const index = getPinecone().Index(PINECONE_INDEX);

    if (purpose === 'workspace') {
      await index.namespace(NS.librarian).upsert({
        records: [
          {
            id: documentId,
            values: vector,
            metadata: {
              owner_id: user.id,
              filename: file.name,
              mime_type: file.type || 'application/octet-stream',
              bytes: file.size,
              source: 'operator-workspace',
              purpose: 'workspace',
              ingested_at: ingestedAt,
            },
          },
        ],
      });

      return NextResponse.json({
        success: true,
        mode: 'workspace',
        documentId,
        filename: file.name,
        bytes: file.size,
        ingestedAt,
        message:
          'Extracted text was indexed for user-scoped retrieval. Original file bytes were not retained by this slice.',
      });
    }

    // Existing Librarian → paid audit behavior remains unchanged.
    const { severity, quote, checkoutTier } = determineTier(file.size);

    await index.namespace(NS.librarian).upsert({
      records: [
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
            purpose: 'audit',
            ingested_at: ingestedAt,
          },
        },
      ],
    });

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
