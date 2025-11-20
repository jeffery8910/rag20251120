# 環境變數速查（Pinecone 版）

最小必填（cloud-app）
- `ADMIN_TOKEN`：/admin 後台密碼
- `GEMINI_API_KEY`
- `EMBED_MODEL=text-embedding-004`（768 維）
- `GEN_MODEL=gemini-2.5-flash`
- `VECTOR_BACKEND=pinecone`
- `PINECONE_API_KEY`
- `PINECONE_INDEX`：serverless index 名稱（小寫、無空白）
- `PINECONE_ENV`：region（例 `us-east-1`）

推薦參數
- `TOPK=6`
- `SCORE_THRESHOLD=0.35`

LINE
- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`

選填（若要存對話/日誌）
- `LOG_PROVIDER=atlas|pg|mysql|supabase|none`
- Atlas：`ATLAS_DATA_API_BASE`、`ATLAS_DATA_API_KEY`、`ATLAS_DATA_SOURCE`、`ATLAS_DATABASE`、`ATLAS_COLLECTION`
- Postgres：`DATABASE_URL`
- MySQL：`MYSQL_URL`
- Supabase：`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`

提示
- Pinecone 維度必須與嵌入模型一致；若改模型，請重建 index 或清空 namespace。
- GitHub Codespaces 的 Secrets 不會自動同步到 Vercel/Render，上線後要再填一次。
