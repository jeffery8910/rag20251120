/*
  在 Codespaces 執行的最小可行嵌入寫入腳本：
  - 掃描 data/ 下的 .md/.txt
  - 簡易分塊 + 重疊
  - 使用 Google AI Studio（Gemini）產生嵌入
  - 自動以嵌入維度建立 Qdrant Collection（若不存在）
  - 寫入 points（含原文與來源）

  使用前：
  - 設定環境變數：GEMINI_API_KEY、QDRANT_URL、QDRANT_API_KEY
  - npm i @google/generative-ai @qdrant/js-client-rest dotenv globby
*/

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { globby } from 'globby';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;
const QDRANT_URL = process.env.QDRANT_URL as string;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY as string;

const COLLECTION = process.env.QDRANT_COLLECTION || 'workshop_rag_docs';
const GLOB = process.env.INGEST_GLOB || 'data/**/*.{md,txt}';
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE || 1200); // 字元
const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP || 200);
const EMBED_DELAY_MS = Number(process.env.EMBED_DELAY_MS || 0);

if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY');
if (!QDRANT_URL || !QDRANT_API_KEY) throw new Error('Missing QDRANT_URL/QDRANT_API_KEY');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY });

function chunkText(text: string, size: number, overlap: number) {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    const chunk = text.slice(i, end).trim();
    if (chunk) chunks.push(chunk);
    i = end - overlap;
    if (i < 0) i = 0;
    if (i >= text.length) break;
  }
  return chunks;
}

async function embedOne(text: string) {
  // 使用 Gemini 文字嵌入模型（可透過 EMBED_MODEL 覆寫）
  const embedModel = process.env.EMBED_MODEL || 'gemini-embedding-001';
  const model = genAI.getGenerativeModel({ model: embedModel });
  const res = await model.embedContent({ content: { parts: [{ text }] } });
  const vector = res.embedding?.values as number[];
  if (!vector) throw new Error('No embedding returned');
  return vector;
}

async function ensureCollection(dim: number) {
  try {
    await qdrant.getCollection(COLLECTION);
    return;
  } catch {}
  await qdrant.createCollection(COLLECTION, {
    vectors: { size: dim, distance: 'Cosine' },
  });
}

function idOf(input: string) {
  return createHash('sha1').update(input).digest('hex');
}

async function main() {
  const files = await globby([GLOB]);
  if (files.length === 0) {
    console.log('No files found under data/.');
    return;
  }

  // 先以第一個分塊取得維度
  const first = readFileSync(files[0], 'utf8');
  const firstChunk = chunkText(first, CHUNK_SIZE, CHUNK_OVERLAP)[0] || first.slice(0, CHUNK_SIZE);
  const firstVec = await embedOne(firstChunk);
  await ensureCollection(firstVec.length);

  const points: any[] = [];
  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    const chunks = chunkText(raw, CHUNK_SIZE, CHUNK_OVERLAP);
    for (let idx = 0; idx < chunks.length; idx++) {
      const text = chunks[idx];
      if (EMBED_DELAY_MS > 0) await new Promise(r=>setTimeout(r, EMBED_DELAY_MS));
      const vector = await embedOne(text);
      const id = idOf(`${file}#${idx}`);
      points.push({
        id,
        vector,
        payload: {
          source: file,
          chunk_index: idx,
          text,
        },
      });
      // 批次寫入（每 64 筆）
      if (points.length >= 64) {
        await qdrant.upsert(COLLECTION, { points: points.splice(0, points.length) });
      }
    }
  }

  if (points.length) {
    await qdrant.upsert(COLLECTION, { points });
  }

  console.log('Ingest completed to collection:', COLLECTION);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
