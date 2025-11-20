# 流程示意（Mermaid）

下圖描述上傳 → chunk → embedding → 向量索引 → 檢索 → 生成 → 前端/LINE 的完整路徑，並標示可替換的向量庫（Pinecone / Atlas / Qdrant）。

```mermaid
flowchart TD
  A[使用者/講師<br>/admin 上傳檔案或貼文字] --> B[Chunk & Metadata<br>chunk_id/source/page/section]
  B --> C[Embedding API<br>Gemini text-embedding-004]
  C --> D{向量庫選擇}
  D --> |Pinecone| D1[Pinecone Index]
  D --> |Atlas Vector Search| D2[MongoDB Atlas<br>vector_index]
  D --> |Qdrant| D3[Qdrant Collection]
  D1 --> E[TopK 檢索]
  D2 --> E
  D3 --> E
  E --> F[LLM 生成<br>Gemini 2.5 Flash]
  F --> G[結構化 JSON<br>摘要/測驗/表格/時間線]
  G --> H[前端 /admin 渲染<br>卡片 + JSON 檢視]
  G --> I[LINE Webhook 回覆]
```

說明：
- D 節點代表可替換的向量後端；本專案預設 Pinecone，也提供 Atlas、Qdrant 设置文件。
- G 節點輸出結構化 JSON（六種模式），前端與 LINE 可共用同一份回傳。
- 若需外部後端，`/api/test` 的 `mode` 參數與同樣的檢索結果可複用。***
