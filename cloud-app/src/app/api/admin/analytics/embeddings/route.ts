import { NextRequest } from 'next/server';
import { listNamespaces } from '@/lib/pinecone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function auth(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  return token === `Bearer ${process.env.ADMIN_TOKEN}`;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return new Response('unauthorized', { status: 401 });
  const backend = (process.env.VECTOR_BACKEND || 'pinecone').toLowerCase();
  if (backend !== 'pinecone') {
    return new Response(JSON.stringify({ backend, namespaces: [], totalVectors: 0 }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const namespaces = await listNamespaces();
  return new Response(
    JSON.stringify({
      backend: 'pinecone',
      namespaces,
      note: 'Pinecone serverless 不提供向量內容掃描；此接口僅列出 namespace 清單與計數。',
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}
