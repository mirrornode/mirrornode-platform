import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { getUserFromBearer } from '@/utils/supabase/server';

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX_NAME || 'mirrornode-vault';

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
    const { user, error: authError } = await getUserFromBearer(req);

    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    if (!pineconeApiKey) {
      return NextResponse.json({ error: 'Pinecone is not configured.' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No document provided.' }, { status: 400 });
    }

    const { severity, quote, checkoutTier } = determineTier(file.size);
    const documentId = `doc_${user.id}_${Date.now()}`;

    const vector = new Array(1536).fill(0.001);

    const pinecone = new Pinecone({ apiKey: pineconeApiKey });
    const index = pinecone.Index(pineconeIndexName);

    await index.upsert({
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
            ingested_at: new Date().toISOString(),
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
      message: 'Document triaged. Awaiting payment to enter the vault.',
    });
  } catch (error) {
    console.error('Librarian ingest error:', error);
    return NextResponse.json({ error: 'Ingestion failed.' }, { status: 500 });
  }
}
