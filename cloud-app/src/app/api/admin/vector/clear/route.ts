import { NextRequest } from 'next/server';
import { clearAll } from '@/lib/pinecone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function auth(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  return token === `Bearer ${process.env.ADMIN_TOKEN}`;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return new Response('unauthorized', { status: 401 });
  const backend = (process.env.VECTOR_BACKEND || 'pinecone').toLowerCase();
  if (backend !== 'pinecone') {
    return new Response('backend not supported', { status: 400 });
  }
  await clearAll();
  return new Response(JSON.stringify({ cleared: true }), {
    headers: { 'content-type': 'application/json' },
  });
}
