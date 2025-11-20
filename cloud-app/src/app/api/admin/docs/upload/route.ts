import { NextRequest } from 'next/server';
import { chunkText } from '@/lib/chunker';
import { embedText } from '@/lib/gemini';
import { upsertChunks } from '@/lib/pinecone';
import { insertMany, atlasConfigured } from '@/lib/mongo';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function auth(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  return token === `Bearer ${process.env.ADMIN_TOKEN}`;
}

async function fileToText(file: File): Promise<{ text: string; source: string }[]> {
  const name = (file as any).name || 'uploaded';
  const lower = name.toLowerCase();
  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);
  if (lower.endsWith('.txt') || lower.endsWith('.md')) {
    return [{ text: buf.toString('utf8'), source: name }];
  }
  if (lower.endsWith('.pdf')) {
    const pdfMod: any = await import('pdf-parse');
    const parsePdf: any = pdfMod?.default || pdfMod;
    const data = await parsePdf(buf).catch((e: any) => {
      throw new Error(`PDF parsing failed: ${e?.message || e}`);
    });
    return [{ text: data.text || '', source: name }];
  }
  if (lower.endsWith('.docx')) {
    const mammoth: any = (await import('mammoth')).default || (await import('mammoth'));
    const result = await mammoth.extractRawText({ buffer: buf }).catch((e: any) => {
      throw new Error(`DOCX parsing failed: ${e?.message || e}`);
    });
    return [{ text: result?.value || '', source: name }];
  }
  throw new Error('Unsupported file type. Please upload .txt, .md, .pdf, or .docx');
}

function describeError(e: any): string {
  try {
    if (!e) return 'unknown error';
    const parts: string[] = [];
    if (e.message) parts.push(e.message);
    const data = (e.response && (e.response.data || e.response.body)) || e.body || e.data;
    if (data) {
      if (typeof data === 'string') parts.push(data);
      else parts.push(JSON.stringify(data));
    }
    if (e.status || e.code) parts.push(`status=${e.status || e.code}`);
    return parts.filter(Boolean).join(' | ');
  } catch {
    return String(e?.message || e);
  }
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return new Response('unauthorized', { status: 401 });
  const form = await req.formData();
  let files = form.getAll('files').filter((f): f is File => f instanceof File);
  const single = form.get('file');
  if ((!files || files.length === 0) && single && single instanceof File) files = [single];
  if (!files || files.length === 0) return new Response('file(s) required', { status: 400 });

  const chunkSize = Number(form.get('chunkSize') || 800);
  const overlap = Number(form.get('overlap') || 120);
  const page = Number(form.get('page') || 0);
  const section = String(form.get('section') || '');

  const backend = (process.env.VECTOR_BACKEND || 'pinecone').toLowerCase();
  const results: Array<{ file: string; inserted: number }> = [];
  const errors: Array<{ file: string; error: string }> = [];
  let totalInserted = 0;

  for (const f of files) {
    try {
      const docs = await fileToText(f);
      let inserted = 0;
      for (const d of docs) {
        const chunks = chunkText(d.text, chunkSize, overlap);
        const vectors: number[][] = [];
        for (const c of chunks) {
          const v = await embedText(c.text, 'RETRIEVAL_DOCUMENT');
          vectors.push(v);
        }
        if (backend === 'pinecone') {
          await upsertChunks(
            chunks.map((c, i) => ({
              text: c.text,
              vector: vectors[i],
              source: d.source,
              page,
              section,
              chunk_id: c.chunk_id,
              doc_id: `${d.source}-${c.chunk_id}`,
            }))
          );
        } else if (atlasConfigured()) {
          await insertMany(
            chunks.map((c, i) => ({
              _id: `${d.source}-${c.chunk_id}`,
              content: c.text,
              embedding: vectors[i],
              source: d.source,
              page,
              section,
              chunk_id: c.chunk_id,
            }))
          );
        } else {
          throw new Error('Vector store not configured (set Pinecone or Atlas envs)');
        }
        inserted += chunks.length;
      }
      totalInserted += inserted;
      results.push({ file: (f as any).name || 'uploaded', inserted });
    } catch (e: any) {
      errors.push({ file: (f as any).name || 'uploaded', error: describeError(e) });
    }
  }

  return new Response(JSON.stringify({ totalInserted, results, errors }), {
    headers: { 'content-type': 'application/json' },
  });
}
