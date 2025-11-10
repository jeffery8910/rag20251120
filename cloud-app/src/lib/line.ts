import crypto from 'crypto';

export function verifyLineSignature(rawBody: string, signature: string) {
  const secret = process.env.LINE_CHANNEL_SECRET as string;
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  try { return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature||'')); }
  catch { return false; }
}

export async function replyToLine(replyToken: string, text: string) {
  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LINE reply failed: ${res.status} ${t}`);
  }
}
