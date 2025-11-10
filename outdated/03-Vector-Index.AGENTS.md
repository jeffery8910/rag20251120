# �إߦV�q���޻P��Ʒǳơ]Qdrant �t�m�^

## ����w��
- **�оǡ��t�m�γ~**�G�z�L Qdrant Cloud�]�Φ۬[ REST �A�ȡ^�m�߸�Ƥ����B�O�J�P�˯��C
- **���p�α�**�G�ۦP������P�y�{�i�������Ӧ� MongoDB Atlas�]Vercel��Render �������p�ϥΡ^�C
- **����**�GQdrant Cloud Free Tier ���H�л\�ҵ{�m�ߡF�]�i��� Atlas ������@�C

## �ؼ�
1. �N�u�Ю׻P�Ч��v��z�����c�Ƥ��q�C
2. �z�L Gemini �O�J���o�V�q���ס]Atlas �]�|�Ψ�^�C
3. �b Qdrant ���� upsert �P�y�N�d�ߡA���� RAG �˯����ġC

## ��Ʒǳ�
- �ɮ׫��O�G�u�� TXT / Markdown�FPDF �Х����u�ର�¤�r�C
- ������h�G�C�q 400�V1000 �r�B���| 10�V15%�A�O�d���`�P���X�C
- ����ĳ�G
  ```
  {
    id: "doc-00001-0001",
    text: "���q����K�K",
    metadata: { source: "�Ч�A.txt", page: 12, section: "1.2 ²��", chunk_id: 1, tags: ["�Ч�"] },
    vector: [/* embedding array */]
  }
  ```

## ���o�O�J���ס]�@���^
- �� `02-Gemini-API-Key.AGENTS.md` ���O�J���աC
- �^�� `embedding.values.length`�]�Ҧp 768�^�A���� Qdrant �P Atlas ���ݤ@�P�C

## �إ� Collection�]Qdrant Cloud �ΰU�ުA�ȡ^
```
PUT https://<your-qdrant-endpoint>/collections/lesson_rag
{
  "vectors": { "size": 768, "distance": "Cosine" }
}
```
- �N `768` �אּ��ڴO�J���סF�Y�ϥ� Qdrant Cloud�A�O�o�a�W API Key Header�C

## Upsert �d��
```
PUT https://<your-qdrant-endpoint>/collections/lesson_rag/points?wait=true
{
  "points": [
    {
      "id": "doc-00001-0001",
      "vector": [/* embedding array */],
      "payload": {
        "text": "���q����...",
        "source": "�Ч�A.txt",
        "page": 12,
        "section": "1.2 ²��",
        "chunk_id": 1
      }
    }
  ]
}
```

## �y�N�d��
```
POST https://<your-qdrant-endpoint>/collections/lesson_rag/points/search
{
  "vector": [/* query embedding */],
  "limit": 6,
  "with_payload": true,
  "score_threshold": 0.1
}
```
- �[�� `result` �� `score` �P `payload` �O�_�ŦX���ݡC
- �ϥγo�Ǥ��q�զ������^�����W�U��C

## n8n ���� Function�]�i�����M�Ρ^
```
// input: ��r�b items[0].json.text
const text = items[0].json.text || '';
const size = 800, overlap = 120;
const chunks = [];
for (let i = 0; i < text.length; i += (size - overlap)) {
  const part = text.slice(i, i + size);
  if (!part.trim()) continue;
  chunks.push({ json: { chunk: part, chunk_id: chunks.length + 1 } });
}
return chunks;
```

## �����禬
- ���N���D �� �i���o�e K �����q�P���ơA�B���e�P�Ч��۲šC
- �s�W�Χ�s��ƫ�A���d�ߧY�i�����G��s�]�h���Y�ɡ^�C

## �L��� Atlas�]Vercel��Render �������ҡ^
- �O�d���G`content`�]�� `text`�^�B`source`�B`page`�B`section`�B`chunk_id`�B`embedding`�C
- Atlas `$vectorSearch` �޽u�P `cloud-app/src/lib/mongo.ts` �� Data API �禡�ۤ������C
- �W�u�e�i���� Atlas M0 ���ҡA�A�N�����ܼƦP�B�� Vercel �P Render�C

## �`������
- ���פ��šG`vectors.size` ��������O�J���סC
- �R���v�C�G�վ� chunk ���סB���ɭ��|�B�W�[ `limit`�C
- �����į�GDocker �e���ܤ֫O�d 1GB RAM�F�Y�d�y�A�i��ָ�ƶq�Τɯŵw��C

