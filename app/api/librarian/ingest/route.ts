import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`Librarian Agent parsing: ${file.name} (${file.size} bytes)`);

    let rawText = '';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      rawText = data.text;
      await parser.destroy();
    } else {
      rawText = buffer.toString('utf-8');
    }

    if (!rawText || rawText.trim() === '') {
      return NextResponse.json({ error: 'File is empty or unreadable' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY) {
      console.warn("Missing OpenAI or Pinecone keys. Returning parsed text without indexing.");
      return NextResponse.json({
        success: true,
        message: `File ${file.name} parsed successfully (Vector indexing skipped - missing keys). Extracted ${rawText.length} characters.`,
        size: file.size,
      }, { status: 200 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: rawText.substring(0, 8000), 
    });
    const vector = embeddingResponse.data[0].embedding;

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const indexName = process.env.PINECONE_INDEX_NAME || 'mirrornode-index';
    const index = pc.Index(indexName);

    const recordId = `doc-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;

    await index.upsert({
      records: [{
        id: recordId,
        values: vector,
        metadata: {
          filename: file.name,
          size: file.size,
          type: file.type,
          snippet: rawText.substring(0, 500)
        }
      }]
    });

    console.log(`Librarian Agent successfully indexed: ${recordId}`);

    return NextResponse.json({
      success: true,
      message: `File ${file.name} extracted, embedded, and indexed to Pinecone.`,
      size: file.size,
    }, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Librarian Ingest Error:', error);
    return NextResponse.json({ error: errorMessage || 'Failed to process file' }, { status: 500 });
  }
}
