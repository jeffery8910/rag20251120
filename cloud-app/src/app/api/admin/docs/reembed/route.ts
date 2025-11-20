import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function auth(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  return token === `Bearer ${process.env.ADMIN_TOKEN}`;
}

// Pinecone serverless 不支援直接抓出向量內容重嵌，此端點改為提示重新上傳。
export async function POST(req: NextRequest) {
  if (!auth(req)) return new Response('unauthorized', { status: 401 });
  const { source } = await req.json();
  if (!source) return new Response('source required', { status: 400 });
  return new Response(
    JSON.stringify({
      reembedded: 0,
      note: `Pinecone 模式請直接重新上傳來源檔（${source}），或在 /admin 刪除後再上傳。`,
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}
