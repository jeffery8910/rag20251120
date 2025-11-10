# n8n �u�@�y�]�K�O�^�G�����t�m LINE �� RAG �� �^��

## �ؼ�
- �b n8n �H�K�O����]Webhook/HTTP/Function�^�����G���� LINE �� ����r���y �� �O�J�d�� �� �ͦ��^�� �� �^�ǡC
- �@����J Vercel��Render �e���u�y�{�F���v�A���x��Ƭy�P�A�ȩI�s�C
- �i�f�t Qdrant�]`03-Vector-Index.AGENTS.md`�^�Ϊ������V Atlas Data API�]���� cloud-app �������|�^�C

## ��ĳ�ݾ�]�`�I���ǡ^
1. Webhook�]`POST /line/webhook`�^
2. Function�G�^�� `text`�B`replyToken`�A�òΤ@�j�p�g
3. Switch�G����r�զW��]�R�� �� �T�w�^�СF���R�� �� RAG�^
4. HTTP Request�GGemini Embedding
5. HTTP Request�G�V�q�˯��]�w�] Qdrant�A�i�� Atlas Data API�^
6. Function�G�ոˤW�U��]������סB���ӷ��^
7. HTTP Request�GGemini Generate
8. HTTP Request�GLINE Reply
9. �]��t�^Function�G�O�����橵��P�ӷ����q ID

> �Y�n���� cloud-app ���̲צ欰�A��ĳ�N�B�J 5 �令 Atlas `$vectorSearch` Data API�Fbody �P `cloud-app/src/lib/rag.ts` �����C

## Webhook ��J�]LINE �`�����^
- �奻�G`events[0].message.text`
- �^�� Token�G`events[0].replyToken`
- �ϥΪ� ID�G`events[0].source.userId`

## ñ������
- �ֳt�t�m�G�i�Ȯɸ��L�]�ȭ��ʳ����ҡ^�C
- �[�j���G�H Cloudflare Worker �N�����e�� n8n�G
```
export default { fetch: async (req) => {
  const secret = Deno.env.get('LINE_CHANNEL_SECRET');
  const body = await req.text();
  const sig = req.headers.get('x-line-signature') || '';
  const hmac = await crypto.subtle.sign('HMAC', await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  ), new TextEncoder().encode(body));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(hmac)));
  if (b64 !== sig) return new Response('unauthorized', { status: 401 });
  return fetch('https://<your-n8n>.trycloudflare.com/line/webhook', { method:'POST', body, headers:{'Content-Type':'application/json'} });
}}
```

## ����`�I�]�w

### ����r���y�]Switch�^
- �ۭq�զW��G`["help","����","�ҵ{��T"]`�]����p�g�B�װŪťաB�B�z���b�Ρ^�C
- �R���G�����^�T�w�ҪO�� Quick Reply�F���R���G�i�J RAG�C

### Gemini Embedding
- URL�G`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`
- Header�G`x-goog-api-key={{$env.GOOGLE_API_KEY}}`�B`Content-Type: application/json`
- Body�G`{"model":"models/gemini-embedding-001","content":{"parts":[{"text":"{{$json.text}}"}]},"taskType":"RETRIEVAL_QUERY"}`
- �W�ɡG10000 ms�FRetry-on-fail�G2�V3 ���C

### �V�q�˯��]�G��@�^
- **Qdrant**�G`{{$env.QDRANT_API_URL}}/collections/lesson_rag/points/search`
  - Body�G`{"vector":{{$json.embedding}},"limit":{{$env.TOPK||6}},"with_payload":true,"score_threshold":{{$env.SCORE_THRESHOLD||0.1}}}`
- **Atlas Data API**�G`{{$env.ATLAS_DATA_API_BASE}}/aggregate`
  - Body�G
  ```
  {
    "dataSource": "{{$env.ATLAS_DATA_SOURCE}}",
    "database": "{{$env.ATLAS_DATABASE}}",
    "collection": "{{$env.ATLAS_COLLECTION}}",
    "pipeline": [
      {
        "$vectorSearch": {
          "index": "{{$env.ATLAS_SEARCH_INDEX}}",
          "path": "embedding",
          "queryVector": {{$json.embedding}},
          "numCandidates": {{$env.NUM_CANDIDATES||400}},
          "limit": {{$env.TOPK||6}}
        }
      },
      { "$project": { "content": 1, "source": 1, "page": 1, "section": 1, "chunk_id": 1, "score": { "$meta": "vectorSearchScore" } } }
    ]
  }
  ```

### �ոˤW�U��]Function�^
```
const hits = items[0].json.result || items[0].json.documents || [];
const max = 2000; let used = 0; const ctx = [];
for (const h of hits) {
  const text = h.payload?.text || h.content || '';
  if (!text) continue;
  if (used + text.length > max) break;
  used += text.length;
  const origin = h.payload?.source ?? h.source ?? 'unknown';
  const page = h.payload?.page ?? h.page ?? '-';
  ctx.push(`- ${text}\n(�ӷ�:${origin} p.${page})`);
}
return [{ json: { context: ctx.join('\n'), question: $json.text } }];
```

### Gemini Generate
- URL�G`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Body�G
```
{
  "contents": [
    {"role":"user","parts":[{"text":"�A�O�U�СA�Ȩ̤U�C���q�^���æC�X�ӷ��C\n\n���q�G\n{{ $json.context }}\n\n���D�G{{ $json.question }}"}]}]
}
```

### LINE Reply
- URL�G`https://api.line.me/v2/bot/message/reply`
- Header�G`Authorization: Bearer {{$env.LINE_CHANNEL_ACCESS_TOKEN}}`�B`Content-Type: application/json`
- Body�G`{"replyToken":"{{$json.replyToken}}","messages":[{"type":"text","text":"{{$json.answer}}"}]}`

## ���ŵ���
- �˯��L���G�G�^�Ы�ĳ������P�d�Ұݪk�C
- �ͦ��O��/���~�G²�u�P�p + ���ܧ�g���D�F�I���i���դ@���C

## �禬�з�
- ����r�R�����T�w�^�СF���R���� RAG�C
- �^�Ъ��a�ӷ��`���A���驵��� 3�V6 ���]�������P API �ɩ��^�C
- �Y���� Atlas Data API�A�y�{�P `cloud-app` ���u�@�P�A�i�������p�e�m�ơC

