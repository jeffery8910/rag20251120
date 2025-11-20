import { embedText, generateWithContext } from './gemini';
import { getRuntimeConfig } from './config';
import { search } from './pinecone';

export type QuizItem = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

export async function generateRagQuiz(topic: string): Promise<QuizItem> {
  const cfg = await getRuntimeConfig();
  const queryVector = await embedText(topic, 'RETRIEVAL_QUERY');
  const hits = await search(queryVector, cfg.TOPK ?? 6, cfg.SCORE_THRESHOLD);

  const context = hits
    .map((h) => `- ${h.content}\n  (source: ${h.source} p.${h.page ?? '-'})`)
    .join('\n')
    .slice(0, 2000);

  const system = [
    '你是教材出題助教，請用提供的教材內容產出 1 題單選題。',
    '回傳格式為 JSON，不要加額外文字：',
    '{',
    '  "question": "題目",',
    '  "options": ["選項A", "選項B", "選項C", "選項D"],',
    '  "correct_index": 0,',
    '  "explanation": "為何這個答案正確的簡短解釋"',
    '}',
  ].join('\n');

  const prompt = `${system}\n\n教材片段：\n${context}\n\n出題主題：${topic}\n請直接輸出 JSON。`;
  const raw = await generateWithContext(prompt);

  const parsed = parseQuiz(raw);
  if (!Array.isArray(parsed.options) || parsed.options.length < 2) {
    throw new Error('quiz options too few');
  }
  if (parsed.correct_index < 0 || parsed.correct_index >= parsed.options.length) {
    parsed.correct_index = 0;
  }
  return parsed;
}

function parseQuiz(text: string): QuizItem {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  const jsonText = start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
  const obj = JSON.parse(jsonText);
  if (
    typeof obj.question !== 'string' ||
    !Array.isArray(obj.options) ||
    typeof obj.correct_index !== 'number' ||
    typeof obj.explanation !== 'string'
  ) {
    throw new Error('invalid quiz shape');
  }
  return obj as QuizItem;
}
