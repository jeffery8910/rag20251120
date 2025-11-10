# �إߦV�q���ޡ]MongoDB Atlas M0�U�K�O�^

## �A�νd��
- �������p�� **Vercel** �� **Render** �ɪ��D�n�V�q�x�s�C
- �� Qdrant �t�m�]`03-Vector-Index.AGENTS.md`�^�L�h�ഫ�ܶ������ҡC
- �K�O�h�]M0�^�Y�i�䴩�u�@�{�W�ҡF�Y��ƶq�����A�Ҽ{�ɯšC

## ���仡��
- Atlas Vector Search �䴩�Ҧ��h�šA�� M0 �b CPU/�O����P���޼ƶq�W������C
- ���� `numDimensions` �����P Gemini �O�J��X�����פ@�P�]�Ѧ� `02-Gemini-API-Key.AGENTS.md`�^�C
- `cloud-app` ���� Data API �禡�A�w�]�ϥ� `ATLAS_DATA_API_BASE` + `api-key`�C

## �B�J 1�G�إߧK�O�O���P��Ʈw
1. ���U/�n�J Atlas�A�إ߱M�׻P M0 �O���]�����ۤv�̪񪺰ϰ�^�C
2. �إ߸�Ʈw�G`ragdb`�F���X�G`docs`�C
3. �ҥ� Data API�]App Services �� Data API�^�A�O���G
   - `ATLAS_DATA_API_BASE`�]�Ҧp `https://data.mongodb-api.com/app/<APP_ID>/endpoint/data/v1/action`�^
   - `ATLAS_DATA_API_KEY`
   - `ATLAS_DATA_SOURCE`�]�ҡG`Cluster0`�^
4. ���G�Y�n����۫ضפJ�}���A�i�إ� Database User ���o `MONGODB_URI`�C

## �B�J 2�G�إ� Vector Search ����
1. �b `docs` ���X���s�W���ޡ]��ĳ�W�١G`vector_index`�^�C
2. JSON �w�q�]�N `768` �אּ��ں��ס^�G
```
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "vector",
        "numDimensions": 768,
        "similarity": "cosine"
      }
    }
  }
}
```

## �B�J 3�G��Ƽҫ��]��ĳ�^
```
{
  _id: "doc-00001-0001",
  content: "���q����K�K",
  embedding: [/* �B�I�ư}�C�A����=���� */],
  source: "�Ч�A.txt",
  page: 12,
  section: "1.2 ²��",
  chunk_id: 1,
  tags: ["�Ч�","���`1"]
}
```
- `_id` �i�u�� Qdrant �� `source-chunk_id` �榡�A��K�l�ܡC

## �B�J 4�G�g�J���
- **A. Data API�]cloud-app / Vercel / Render ���ˡ^**
  - �I�s `ATLAS_DATA_API_BASE/insertMany` �� `insertOne`�C
  - `cloud-app` �w���� `insertMany`�B`insertOne` �禡�]`src/lib/mongo.ts`�^�C
- **B. MongoDB �X�ʡ]�����妸�ɤJ�^**
  - `npm i mongodb`
  - �ϥ� `MongoClient(process.env.MONGODB_URI)` �פJ�C
  - �פJ�����ᤴ�i�z�L Data API �d�ߡC

## �B�J 5�G�V�q�˯��]Aggregation �޽u�^
```
[
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: "<�d�ߦV�q array>",
      numCandidates: 400,
      limit: 6
    }
  },
  {
    $project: {
      content: 1,
      source: 1,
      page: 1,
      section: 1,
      chunk_id: 1,
      score: { $meta: "vectorSearchScore" }
    }
  }
]
```
- `cloud-app/src/lib/rag.ts` �H�� pipeline ���D��]�i�վ� `NUM_CANDIDATES`�B`TOPK`�^�C

## �B�J 6�G�P�y�{�α�
- �N Qdrant �� upsert �P�d�ߴ����� Data API�C
- �b Vercel/Render �����ܼƤ��]�w�G
  - `ATLAS_DATA_API_BASE`
  - `ATLAS_DATA_API_KEY`
  - `ATLAS_DATA_SOURCE`
  - `ATLAS_DATABASE=ragdb`
  - `ATLAS_COLLECTION=docs`
  - `ATLAS_SEARCH_INDEX=vector_index`
- �Y���� n8n �Φ۫ظ}���A�i�u�ΦP�˩R�W�C

## �禬
- ���N���D �� `$vectorSearch` ���^�e K ���������q�P `score`�C
- ��s�浧��� �� �A���d�ߧY�i�ݨ�Y�ɵ��G�]�� M0 �t���A�q�`���š^�C
- `cloud-app` `/admin/setup` ���d�ˬd��� Atlas �s�u���\�]`ok: true`�^�C

## �`�����D
- ���פ��šG���s�إ߯��ީΨϥηs�� `numDimensions`�C
- �į୭��GM0 ���귽�W���A�Y�J�W�ɥi���C `numCandidates`�B�Y�p `TOPK` �ΤɯŤ�סC
- IP �զW��G�Y��� Mongo �X�ʽг]�w Vercel/Render IP �Ψϥ� Data API �٥h�զW��ݨD�C

