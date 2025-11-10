import { limitedJsonPost } from './ratelimit';

function getGeminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

async function postJson(url: string, body: any) {
  const res = await limitedJsonPost('gemini', url, { 'x-goog-api-key': String(getGeminiKey()) }, body);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini request failed: ${res.status} ${t}`);
  }
  return res.json();
}

export async function embedText(text: string, taskType: 'RETRIEVAL_DOCUMENT'|'RETRIEVAL_QUERY'='RETRIEVAL_DOCUMENT') {
  const model = process.env.EMBED_MODEL || 'gemini-embedding-001';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`;
  // use dedicated limiter channel for embeddings
  const dim = Number(process.env.EMBED_DIM || process.env.EMBEDDING_DIMENSIONS || '');
  const body: any = { model: `models/${model}`, content: { parts: [{ text }] }, taskType };
  // Only Gemini Embedding supports configurable output dimensionality
  if (Number.isFinite(dim) && String(model).startsWith('gemini-embedding')) {
    body.embedding_config = { output_dimensionality: dim };
  }
  const res = await limitedJsonPost('gemini_embed' as any, url, { 'x-goog-api-key': String(getGeminiKey()) }, body);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini embed failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  const values = data?.embedding?.values;
  if (!values) throw new Error('No embedding values');
  return values as number[];
}

export async function generateWithContext(prompt: string) {
  const model = process.env.GEN_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  // use dedicated limiter channel for generation
  const res = await limitedJsonPost('gemini_gen' as any, url, { 'x-goog-api-key': String(getGeminiKey()) }, { contents: [{ role: 'user', parts: [{ text: prompt }] }] });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini generate failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text as string;
}
