import { Pinecone, type QueryResponse } from '@pinecone-database/pinecone';

type StoredPayload = {
  text: string;
  source: string;
  page?: number;
  section?: string;
  chunk_id?: string;
  doc_id?: string;
};

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required for Pinecone backend`);
  return v;
}

function slugNamespace(source: string) {
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63);
  return slug || 'default';
}

export function getIndexName() {
  return requiredEnv('PINECONE_INDEX');
}

function getPineconeClient() {
  const apiKey = requiredEnv('PINECONE_API_KEY');
  const env = process.env.PINECONE_ENV;
  return env ? new Pinecone({ apiKey, environment: env }) : new Pinecone({ apiKey });
}

export function getIndex() {
  const pc = getPineconeClient();
  return pc.index(getIndexName());
}

export async function listNamespaces(): Promise<string[]> {
  const idx = getIndex();
  try {
    const stats = await idx.describeIndexStats();
    const namespaces = Object.keys(stats.namespaces || {});
    return namespaces.length ? namespaces : ['default'];
  } catch {
    return ['default'];
  }
}

export async function upsertChunks(chunks: Array<{ text: string; vector: number[]; source: string; page?: number; section?: string; chunk_id?: string; doc_id?: string }>) {
  if (!chunks.length) return;
  const idx = getIndex();
  const groups = new Map<string, typeof chunks>();
  for (const c of chunks) {
    const ns = slugNamespace(c.source || 'default');
    if (!groups.has(ns)) groups.set(ns, []);
    groups.get(ns)!.push(c);
  }

  for (const [ns, items] of groups.entries()) {
    await idx.upsert({
      vectors: items.map((c, i) => ({
        id: c.doc_id || `${ns}-${c.chunk_id || i}`,
        values: c.vector,
        metadata: {
          text: c.text,
          source: c.source,
          page: c.page ?? 0,
          section: c.section || '',
          chunk_id: c.chunk_id || String(i),
          doc_id: c.doc_id || `${ns}-${c.chunk_id || i}`,
        } as StoredPayload,
      })),
      namespace: ns,
    });
  }
}

export async function search(
  vector: number[],
  topK: number,
  scoreThreshold?: number,
  namespace?: string
) {
  const idx = getIndex();
  const namespaces = namespace ? [namespace] : await listNamespaces();
  const perNsK = Math.max(topK, 3);
  const merged: Array<{ score: number; metadata?: any; namespace?: string }> = [];

  for (const ns of namespaces) {
    const res: QueryResponse = await idx.query({
      vector,
      topK: perNsK,
      includeMetadata: true,
      namespace: ns,
    });
    const matches = res.matches || [];
    for (const m of matches) {
      if (typeof scoreThreshold === 'number' && m.score !== undefined && m.score < scoreThreshold) continue;
      merged.push({ score: m.score ?? 0, metadata: m.metadata, namespace: ns });
    }
  }

  merged.sort((a, b) => (b.score || 0) - (a.score || 0));
  return merged.slice(0, topK).map((m) => {
    const payload = m.metadata as StoredPayload;
    return {
      content: payload?.text || '',
      source: payload?.source || m.namespace || 'unknown',
      page: payload?.page ?? '-',
      section: payload?.section || '',
      chunk_id: payload?.chunk_id,
      score: m.score ?? 0,
    };
  });
}

export async function deleteBySource(source: string) {
  const ns = slugNamespace(source);
  const idx = getIndex();
  await idx.deleteAll({ namespace: ns });
}

export async function clearAll() {
  const idx = getIndex();
  const namespaces = await listNamespaces();
  for (const ns of namespaces) {
    await idx.deleteAll({ namespace: ns });
  }
}

export async function ping(): Promise<boolean> {
  try {
    const idx = getIndex();
    await idx.describeIndexStats();
    return true;
  } catch {
    return false;
  }
}

export function defaultNamespaceFromSource(source: string) {
  return slugNamespace(source);
}
