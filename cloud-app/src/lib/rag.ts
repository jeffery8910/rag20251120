import { embedText, generateWithContext } from './gemini';
import { getRuntimeConfig } from './config';
import { search } from './pinecone';

type RagHit = {
  content: string;
  source: string;
  page: string | number;
  section?: string;
  chunk_id?: string;
  score?: number;
};

export async function ragAnswer(
  question: string,
  opts?: { topK?: number; scoreThreshold?: number; namespace?: string }
) {
  const cfg = await getRuntimeConfig();
  const external = process.env.ANSWER_WEBHOOK_URL;
  const extToken = process.env.ANSWER_WEBHOOK_TOKEN || process.env.BACKEND_API_KEY;
  const extTimeout = Number(process.env.ANSWER_WEBHOOK_TIMEOUT_MS || 15000);

  // Optional: delegate to external answer provider first
  if (external) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), extTimeout);
      const res = await fetch(external, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(extToken ? { authorization: `Bearer ${extToken}` } : {}),
        },
        body: JSON.stringify({
          question,
          topK: cfg.TOPK,
          scoreThreshold: cfg.SCORE_THRESHOLD,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) {
        const j: any = await res.json();
        return { answer: j.answer || '', hits: j.hits || [] };
      }
    } catch {
      /* fall back to local */
    }
  }

  const queryVector = await embedText(question, 'RETRIEVAL_QUERY');
  const topK = Number(opts?.topK ?? cfg.TOPK ?? 6);
  const scoreTh = Number.isFinite(opts?.scoreThreshold ?? cfg.SCORE_THRESHOLD)
    ? (opts?.scoreThreshold ?? cfg.SCORE_THRESHOLD)
    : undefined;

  const hits: RagHit[] = await search(queryVector, topK, scoreTh, opts?.namespace);

  const maxChars = 2000;
  let used = 0;
  const ctxParts: string[] = [];
  for (const h of hits) {
    const t = h.content || '';
    if (!t) continue;
    if (used + t.length > maxChars) break;
    used += t.length;
    const section = h.section ? ` / ${h.section}` : '';
    ctxParts.push(`- ${t}\n  (source: ${h.source} p.${h.page ?? '-'}${section})`);
  }

  const prompt = `${cfg.prompt}\n\n請根據下列教材回覆使用者，若無相關內容請說明查無資料。\n${ctxParts.join(
    '\n'
  )}\n\n使用者問題：${question}`;
  const answer = await generateWithContext(prompt);
  return { answer, hits };
}

type StructuredModes = 'summary' | 'quiz' | 'bullets' | 'suggestions' | 'table' | 'timeline';

function buildStructuredPrompt(mode: StructuredModes, question: string, context: string) {
  const base = `你是一個教材助教，請只輸出符合下述 JSON schema 的內容，不要多餘文字。所有文字必須出自提供的教材，若缺乏資訊請回傳空陣列或空字串。`;
  const schemas: Record<StructuredModes, string> = {
    summary: `{
  "summary": "200 字內的摘要",
  "bullets": ["重點1","重點2","重點3"],
  "sources": [{"title": "來源檔名或標題", "page": 0}]
}`,
    quiz: `{
  "quizzes": [
    {"question": "題幹", "options": ["A","B","C","D"], "answer": "A", "explanation": "簡短理由", "source": {"title":"", "page":0}}
  ]
}`,
    bullets: `{
  "notes": [
    {"text": "重點說明", "page": 0}
  ]
}`,
    suggestions: `{
  "next_steps": [
    {"advice": "下一步建議", "page": 0}
  ]
}`,
    table: `{
  "table": {
    "headers": ["欄位1","欄位2","欄位3"],
    "rows": [
      ["值11","值12","值13"],
      ["值21","值22","值23"]
    ],
    "source": {"title":"來源", "page":0}
  }
}`,
    timeline: `{
  "timeline": [
    {"title": "事件標題", "date": "YYYY-MM-DD", "detail": "事件描述", "page": 0}
  ]
}`,
  };
  return `${base}\n請用模式: ${mode}\n輸出 JSON 範例：\n${schemas[mode]}\n\n教材片段：\n${context}\n\n使用者問題：${question}\n\n務必回傳合法 JSON。`;
}

export async function ragStructuredAnswer(
  question: string,
  mode: StructuredModes = 'summary',
  opts?: { topK?: number; scoreThreshold?: number; namespace?: string }
) {
  const cfg = await getRuntimeConfig();
  const queryVector = await embedText(question, 'RETRIEVAL_QUERY');
  const topK = Number(opts?.topK ?? cfg.TOPK ?? 6);
  const scoreTh = Number.isFinite(opts?.scoreThreshold ?? cfg.SCORE_THRESHOLD)
    ? (opts?.scoreThreshold ?? cfg.SCORE_THRESHOLD)
    : undefined;

  const hits: RagHit[] = await search(queryVector, topK, scoreTh, opts?.namespace);

  const maxChars = 2000;
  let used = 0;
  const ctxParts: string[] = [];
  for (const h of hits) {
    const t = h.content || '';
    if (!t) continue;
    if (used + t.length > maxChars) break;
    used += t.length;
    const section = h.section ? ` / ${h.section}` : '';
    ctxParts.push(`- ${t}\n  (source: ${h.source} p.${h.page ?? '-'}${section})`);
  }
  const prompt = buildStructuredPrompt(mode, question, ctxParts.join('\n'));
  const raw = await generateWithContext(prompt);

  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // try to extract json substring
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(raw.slice(start, end + 1));
      } catch {
        parsed = null;
      }
    }
  }
  return { answer: raw, structured: parsed, hits };
}
