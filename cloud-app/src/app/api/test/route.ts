import { NextRequest } from 'next/server';
import { ragAnswer, ragStructuredAnswer } from '@/lib/rag';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function auth(req: NextRequest) {
  const token = req.headers.get('authorization') || '';
  return token === `Bearer ${process.env.ADMIN_TOKEN}`;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return new Response('unauthorized', { status: 401 });
  const { question, mode, userId } = await req.json();
  const uid = userId || req.headers.get('x-user-id') || '';
  const namespace = uid ? `user_${uid}` : undefined;
  if (!question) return new Response('question required', { status: 400 });

  // 若指定 mode，走結構化輸出
  if (mode) {
    const { answer, structured, hits } = await ragStructuredAnswer(question, mode, { namespace });
    return new Response(JSON.stringify({ answer, structured, hits }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const { answer, hits } = await ragAnswer(question, { namespace });
  return new Response(JSON.stringify({ answer, hits }), {
    headers: { 'content-type': 'application/json' },
  });
}
