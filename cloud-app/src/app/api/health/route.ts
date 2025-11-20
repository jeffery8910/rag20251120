import { NextRequest } from 'next/server';
import { aggregate } from '@/lib/mongo';
import { ping as pineconePing } from '@/lib/pinecone';
import pgPkg from 'pg';
import mysql from 'mysql2/promise';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Check = { name: string; ok: boolean; info?: any; error?: string };

function present(k: string) {
  return Boolean(process.env[k] && String(process.env[k]).length > 0);
}

function envSummary() {
  const has = (k: string) => present(k);
  const cat = (name: string, reqs: string[]) => ({
    name,
    required: reqs,
    present: reqs.filter(has),
    missing: reqs.filter((k) => !has(k)),
  });
  return [
    cat('admin', ['ADMIN_TOKEN']),
    cat('gemini', ['GEMINI_API_KEY', 'EMBED_MODEL', 'GEN_MODEL']),
    cat('line', ['LINE_CHANNEL_SECRET', 'LINE_CHANNEL_ACCESS_TOKEN']),
    cat('pinecone', ['PINECONE_API_KEY', 'PINECONE_INDEX', 'PINECONE_ENV']),
    cat('retrieval', ['TOPK', 'SCORE_THRESHOLD']),
  ];
}

async function checkAtlas(): Promise<Check> {
  const need = ['ATLAS_DATA_API_BASE', 'ATLAS_DATA_API_KEY', 'ATLAS_DATA_SOURCE', 'ATLAS_DATABASE', 'ATLAS_COLLECTION'];
  const miss = need.filter((k) => !process.env[k]);
  if (miss.length) return { name: 'atlas', ok: false, error: `missing env: ${miss.join(',')}` };
  try {
    const r: any = await aggregate([{ $limit: 1 }]);
    return { name: 'atlas', ok: true, info: { documents: Array.isArray(r?.documents) ? r.documents.length : 0 } };
  } catch (e: any) {
    return { name: 'atlas', ok: false, error: e?.message || String(e) };
  }
}

async function checkPostgres(): Promise<Check> {
  if (!process.env.DATABASE_URL) return { name: 'pg', ok: false, error: 'missing env: DATABASE_URL' };
  const { Client } = pgPkg;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const r = await client.query('select 1 as ok');
    return { name: 'pg', ok: true, info: r.rows[0] };
  } catch (e: any) {
    return { name: 'pg', ok: false, error: e?.message || String(e) };
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

async function checkMySQL(): Promise<Check> {
  if (!process.env.MYSQL_URL) return { name: 'mysql', ok: false, error: 'missing env: MYSQL_URL' };
  try {
    const conn = await mysql.createConnection(process.env.MYSQL_URL as string);
    try {
      const [rows] = await conn.execute('select 1 as ok');
      return { name: 'mysql', ok: true, info: rows };
    } finally {
      await conn.end();
    }
  } catch (e: any) {
    return { name: 'mysql', ok: false, error: e?.message || String(e) };
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const provider = (process.env.LOG_PROVIDER || 'none').toLowerCase();
  const withDb = url.searchParams.get('withDb') === '1';
  const checks: Check[] = [
    { name: 'adminToken', ok: present('ADMIN_TOKEN') },
    { name: 'geminiKey', ok: present('GEMINI_API_KEY') || present('GOOGLE_API_KEY') },
    { name: 'lineSecret', ok: present('LINE_CHANNEL_SECRET') },
    { name: 'lineAccessToken', ok: present('LINE_CHANNEL_ACCESS_TOKEN') },
  ];

  if (withDb) {
    const pcOk = await pineconePing();
    checks.push({ name: 'pinecone', ok: pcOk, error: pcOk ? undefined : 'cannot reach pinecone index' });
    if ((process.env.ATLAS_DATA_API_BASE || process.env.ATLAS_DATA_API_URL) && provider === 'atlas') {
      checks.push(await checkAtlas());
    } else if (provider === 'atlas') {
      checks.push({ name: 'atlas', ok: false, error: 'not configured' });
    }
    if (provider === 'pg') checks.push(await checkPostgres());
    if (provider === 'mysql') checks.push(await checkMySQL());
  }

  const summary = envSummary();
  return new Response(JSON.stringify({ provider, checks, envSummary: summary }), {
    headers: { 'content-type': 'application/json' },
  });
}
