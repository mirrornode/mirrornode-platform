/**
 * lib/embeddings.ts
 * Thin wrapper around OpenAI text-embedding-3-small.
 * Returns a 1536-dimension float array ready for Pinecone upsert.
 */

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings';
const EMBED_MODEL = 'text-embedding-3-small'; // 1536 dims — matches mirrornode-vault
const MAX_CHARS = 8_000; // ~2k tokens, safe for a single embed call

/**
 * Embed a plain-text string and return its vector.
 * Text is truncated to MAX_CHARS to stay within token limits.
 */
export async function embedText(text: string): Promise<number[]> {
  const truncated = text.slice(0, MAX_CHARS);

  const res = await fetch(OPENAI_EMBED_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: truncated,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embed failed: ${res.status} ${err}`);
  }

  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}

/**
 * Extract plain text from an uploaded File.
 * Handles plain text and falls back to raw bytes for binary formats.
 * Real PDF/DOCX parsing can be added here later.
 */
export async function extractText(file: File): Promise<string> {
  const mime = file.type || '';

  if (mime.startsWith('text/') || mime === 'application/json') {
    return file.text();
  }

  // For PDFs, Office docs, etc. — extract what we can as text for now.
  // TODO: plug in pdf-parse or similar when needed.
  const buf = await file.arrayBuffer();
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return decoder.decode(buf).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
}
