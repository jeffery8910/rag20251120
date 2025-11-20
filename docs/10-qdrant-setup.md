# Qdrant Cloud 設定與測試（教學用，非預設）

> 本專案主線預設使用 Pinecone。若要實際切換到 Qdrant，需額外安裝 `@qdrant/js-client-rest` 並在環境變數設定 `VECTOR_BACKEND=qdrant`，再依下列步驟調整。

> 若只需 Pinecone / Atlas 可略過。本章提供 Qdrant 作為替代向量庫的完整步驟。

## 一、建立 Qdrant Cloud 專案
1. 登入 [Qdrant Cloud](https://cloud.qdrant.io/)，建立 Cluster（free tier 可用）。
2. 記下：
   - `QDRANT_URL`（REST 端點，如 `https://xxxx-xxxx.cloud.qdrant.io`）
   - `QDRANT_API_KEY`

## 二、環境變數
```
VECTOR_BACKEND=qdrant
QDRANT_URL=...
QDRANT_API_KEY=...
QDRANT_COLLECTION=workshop_rag_docs
```
若重新建 collection，可加：
```
QDRANT_RESET_ON_DIM_MISMATCH=true
```

## 三、建立 Collection（768 維示例；對應 text-embedding-004）
```bash
curl -X PUT "$QDRANT_URL/collections/workshop_rag_docs" \
  -H "Content-Type: application/json" \
  -H "api-key: $QDRANT_API_KEY" \
  -d '{
    "vectors": { "size": 768, "distance": "Cosine" }
  }'
```

## 四、寫入測試向量
```bash
curl -X PUT "$QDRANT_URL/collections/workshop_rag_docs/points?wait=true" \
  -H "Content-Type: application/json" \
  -H "api-key: $QDRANT_API_KEY" \
  -d '{
    "points": [
      {
        "id": 1,
        "vector": [0.01,0.02,...,0.03],
        "payload": { "text": "示例段落", "source": "demo.txt", "page": 1, "chunk_id": "c1" }
      }
    ]
  }'
```

## 五、相似度查詢
```bash
curl -X POST "$QDRANT_URL/collections/workshop_rag_docs/points/search" \
  -H "Content-Type: application/json" \
  -H "api-key: $QDRANT_API_KEY" \
  -d '{
    "vector": [0.01,0.02,...,0.03],
    "limit": 3,
    "with_payload": true
  }'
```

## 六、在本專案中切換 Qdrant
1. `.env`／雲端環境變數設定為上述 QDRANT_*，並設 `VECTOR_BACKEND=qdrant`。
2. `/admin` 上傳檔案時，後端會用 Qdrant 對應 collection；清空功能會 drop collection（若開啟 reset）。
3. 模型維度需與 collection 大小一致；更換 embedding 模型時，建議重建/清空 collection 再寫入。

## 七、常見問題
- 維度不符：重建 collection 或開 `QDRANT_RESET_ON_DIM_MISMATCH=true` 後再上傳。
- 429/速率：Free tier 有寫入/查詢限額，注意批次量與重試。
- 域名 TLS 問題：確保使用 `https://` REST 端點且帶 `api-key` header。
