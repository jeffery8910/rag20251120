# RAG x LINE Cloud App（Qdrant 預設｜Vercel/Render 部署）

雲端友善的 Next.js 應用：提供 LINE Webhook 與管理介面，預設使用 Qdrant Cloud 作為向量檢索、Google AI Studio（Gemini）做嵌入與生成。對話紀錄支援 Atlas/Supabase/Postgres/MySQL（預設關閉）。

Highlights
- Next.js App Router（LINE Webhook + Admin 工具），/admin 以 Admin Token 門禁
- Qdrant Cloud 預設向量庫（可切換 Atlas Vector Search）
- Google AI Studio（Gemini）嵌入與生成（`GEMINI_API_KEY`；預設嵌入 `text-embedding-004`、生成 `gemini-2.5-flash`）
- 可選外掛：`ANSWER_WEBHOOK_URL` 將回答委外到你的後台（失敗時回退本地流程）

Quick Start（Vercel）
1) 準備 Qdrant Cloud：取得 `QDRANT_URL`、`QDRANT_API_KEY`、`QDRANT_COLLECTION`
2) 將 `cloud-app/` 建為 Vercel 專案（Root Directory 設 `cloud-app`）
3) 專案環境變數新增（至少）：
   - `ADMIN_TOKEN`（自定強密碼，用於 /admin 登入）
   - `GEMINI_API_KEY`、`EMBED_MODEL=text-embedding-004`、`GEN_MODEL=gemini-2.5-flash`
   - `LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`
   - `VECTOR_BACKEND=qdrant`、`QDRANT_URL`、`QDRANT_API_KEY`、`QDRANT_COLLECTION=workshop_rag_docs`
   - （可選）`ANSWER_WEBHOOK_URL`、`ANSWER_WEBHOOK_TOKEN`
   - 檢索參數：`TOPK=6`、`SCORE_THRESHOLD=0.1`、`NUM_CANDIDATES=400`
   - 日誌：`LOG_PROVIDER=none`（預設），或改 `atlas`/`pg`/`mysql`/`supabase` 後再填對應變數
4) 部署後在 LINE 後台把 Webhook 指向 `/api/line-webhook`
5) 造訪 `/admin` 輸入 `ADMIN_TOKEN` 後進行：
   - 上傳教材（PDF/TXT/MD/DOCX）或貼上純文字 → 分塊嵌入 → 寫入向量庫
   - `/admin/setup` 健康檢查；`/admin/conversations` 檢視對話紀錄（依 LOG_PROVIDER 而定）

Health Check
- `/admin/setup` 顯示環境變數與（選擇性）DB 連線檢查。內建 Qdrant ping、Atlas Data API、Postgres、MySQL。

Atlas（可選）
- 若要用 Atlas 作 config/logs 或向量搜尋，請正確填入 `ATLAS_*`；若填占位值（如 APP_ID）將自動視為未設定並使用預設。

Local Dev（可選）
- `cd cloud-app && npm i && npm run dev` → `http://localhost:3000/admin`
- 建 `./.env.local`：至少 `ADMIN_TOKEN`；其餘視需要加入。

相容性與部署注意
- Node 版本已鎖定：`package.json` → `engines: { "node": "20.x" }`，並於 `vercel.json` 設 `NODE_VERSION=20`
- TypeScript 型別：已加入 `@types/react`、`@types/node`、`@types/pdf-parse`、`@types/pg`
- pdf-parse 打包：`next.config.mjs` 設定 `alias: { 'pdf-parse$': 'pdf-parse/lib/pdf-parse.js' }` 避免測試檔觸發 ENOENT
- API route 均設 `dynamic='force-dynamic'`、`revalidate=0`，避免 build 期觸發外部呼叫

資料模型（僅當 LOG_PROVIDER 使用 Atlas/Supabase/PG/MySQL 時）
- config：`{ _id: "default", prompt, keywords, TOPK, ... }`
- logs：一般偵錯日誌
- conversations：`{ id, ts, channelId, userId, type, direction, text, hits?, replyToId? }`

部署到 Render
- 使用 `render.yaml` 建立 Node Web Service；填入與 Vercel 相同的環境變數。Webhook 路徑：`/api/line-webhook`。
