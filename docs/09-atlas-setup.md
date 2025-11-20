# MongoDB Atlas Vector Search（Vercel 友善版）設定步驟

本章介紹如何在 Atlas 建立向量索引並透過 Data API/Driver 讀寫，適合部署在 Vercel。

## 一、建立專案與 Cluster
1. 登入 [MongoDB Atlas](https://cloud.mongodb.com/)，建立 Project。
2. 建立免費層 M0（可放教學用資料），Cloud 選 AWS/最靠近你的區域。
3. Network Access：新增 IP 白名單 `0.0.0.0/0`（教學用，可之後關閉）；User 建立強密碼。

## 二、資料庫與集合
在 `Collections` 建立：
- Database：`ragdb`
- Collection：`docs`
- 文件欄位建議：
  - `content`: string（段落文本）
  - `embedding`: array<number>（向量）
  - `source`: string（檔名或標題）
  - `page`: int
  - `section`: string
  - `chunk_id`: string

## 三、向量索引
1. 點 `Indexes` → `Create Search Index` → `JSON`。
2. 範例 768 維（對應 `text-embedding-004`）：
```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": {
        "dimensions": 768,
        "similarity": "cosine",
        "type": "vector"
      },
      "content": { "type": "string" },
      "source": { "type": "string" },
      "page":   { "type": "number" }
    }
  }
}
```
3. Index Name：`vector_index`（可自訂，需對應環境變數）。

## 四、取得 Data API 參數（給 Vercel）
啟用 App Services → Data API，記下：
- `ATLAS_DATA_API_BASE`（通常以 `/action` 結尾）
- `ATLAS_DATA_API_KEY`
- `ATLAS_DATA_SOURCE`（例 `Cluster0`）
- `ATLAS_DATABASE=ragdb`
- `ATLAS_COLLECTION=docs`
- `ATLAS_SEARCH_INDEX=vector_index`

## 五、環境變數設定（Vercel/Render）
最少需加：
```
LOG_PROVIDER=atlas
ATLAS_DATA_API_BASE=...
ATLAS_DATA_API_KEY=...
ATLAS_DATA_SOURCE=Cluster0
ATLAS_DATABASE=ragdb
ATLAS_COLLECTION=docs
ATLAS_SEARCH_INDEX=vector_index
```
若用 Driver（效率較佳），可改用：
```
LOG_PROVIDER=atlas-driver
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net
MONGODB_DB=ragdb
```

## 六、寫入向量（範例 curl，Data API）
```bash
curl -X POST "$ATLAS_DATA_API_BASE/insertOne" \
  -H "Content-Type: application/json" \
  -H "api-key: $ATLAS_DATA_API_KEY" \
  -d '{
    "dataSource": "'$ATLAS_DATA_SOURCE'",
    "database": "'$ATLAS_DATABASE'",
    "collection": "'$ATLAS_COLLECTION'",
    "document": {
      "content": "示例段落",
      "embedding": [0.01, 0.02, ...], 
      "source": "demo.pdf",
      "page": 1,
      "chunk_id": "c1"
    }
  }'
```

## 七、檢索（範例 curl，Data API Aggregate）
```bash
curl -X POST "$ATLAS_DATA_API_BASE/aggregate" \
  -H "Content-Type: application/json" \
  -H "api-key: $ATLAS_DATA_API_KEY" \
  -d '{
    "dataSource": "'$ATLAS_DATA_SOURCE'",
    "database": "'$ATLAS_DATABASE'",
    "collection": "'$ATLAS_COLLECTION'",
    "pipeline": [
      {
        "$vectorSearch": {
          "index": "'$ATLAS_SEARCH_INDEX'",
          "path": "embedding",
          "numCandidates": 200,
          "limit": 6,
          "queryVector": [0.01, 0.02, ...]
        }
      }
    ]
  }'
```

## 八、在本專案的使用位置
- 環境選項：`LOG_PROVIDER=atlas`（存對話/日誌）；目前預設向量庫為 Pinecone，但可依需求改用 Atlas，需對應調整索引維度（與 `EMBED_MODEL` 一致）。
- 若你改用 Atlas 做檢索，請確保所有向量 `dimensions` 與索引設定一致；變更模型時須重建索引或先清空集合。

## 九、常見問題
- **向量維度不符**：重建索引或重置集合，並確認 `EMBED_MODEL` 對應維度。  
- **免費層配額**：M0 適合教學，量大需升級。  
- **延遲**：Data API 會較 Driver 慢，若在 Vercel 可考慮 `atlas-driver` 模式但需允許 IP。  
