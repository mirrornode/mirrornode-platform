/**
 * lib/embeddings.ts
 * Thin wrapper around OpenAI text-embedding-3-small.
 * Returns a 1536-dimension float array ready for Pinecone upsert.
 *
 * NOTE: OPENAI_API_KEY is read inside embedText (not at module load)
 * so Next.js build-time evaluation does not throw.
 */

const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings';
const EMBED_MODEL = 'text-embedding-3-small'; // 1536 dims — matches mirrornode-vault
const MAX_CHARS = 8_000; // ~2k tokens, safe for a single embed call

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const truncated = text.slice(0, MAX_CHARS);

  const res = await fetch(OPENAI_EMBED_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: truncated }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embed failed: ${res.status} ${err}`);
  }

  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}

export async function extractText(file: File): Promise<string> {
  const mime = file.type || '';

  if (mime.startsWith('text/') || mime === 'application/json') {
    return file.text();
  }

  const buf = await file.arrayBuffer();
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return decoder.decode(buf).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
}
