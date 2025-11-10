import { verifyLineSignature, replyToLine } from '@/lib/line';
import { ragAnswer } from '@/lib/rag';
import { logEvent } from '@/lib/mongo';
import { logConversation } from '@/lib/logs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  const sig = req.headers.get('x-line-signature') || '';
  const raw = await req.text();
  if (!verifyLineSignature(raw, sig)) {
    return new Response('unauthorized', { status: 401 });
  }
  const body = JSON.parse(raw);
  const ev = body?.events?.[0];
  const text = ev?.message?.text || '';
  const replyToken = ev?.replyToken;
  const userId = ev?.source?.userId;
  const channelId = ev?.source?.type;
  if (!text || !replyToken) return new Response('ok');

  let answer = '(系統忙碌，暫無內容)';
  try {
    // 記錄使用者訊息（含 user id，便於對話串接）
    const inId = (await import('crypto')).randomUUID();
    await logConversation({ id: inId, type:'message', direction:'in', text, userId, channelId });
    // 關鍵字優先（可在 config 中管理）
    const cfgKeywords = (await (await import('@/lib/mongo')).getConfig()).keywords as string[];
    const normalized = String(text).trim().toLowerCase();
    if (cfgKeywords.map(k=>k.toLowerCase()).includes(normalized)) {
      answer = '收到！這是預設關鍵字回覆。也可以直接輸入問題，我會用教材知識來回答。';
    } else {
      const { answer: a, hits } = await ragAnswer(text);
      answer = a || answer;
      const compactHits = hits.map((h:any)=>({ source:h.source, page:h.page, score:h.score }));
      await logEvent({ type:'reply', q:text, answer, hits: compactHits });
      const outId = (await import('crypto')).randomUUID();
      await logConversation({ id: outId, replyToId: inId, type:'reply', direction:'out', text: answer, userId, channelId, hits: compactHits });
    }
  } catch (e: any) {
    answer = '抱歉，系統暫時無法回覆，請稍後再試。';
    await logEvent({ type:'error', q:text, error: String(e?.message || e) });
    await logConversation({ type:'error', direction:'out', text: String(e?.message||e), userId, channelId });
  }

  try { await replyToLine(replyToken, answer); } catch { /* ignore reply error */ }
  return new Response('ok');
}
