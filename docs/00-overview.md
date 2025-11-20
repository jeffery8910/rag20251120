# 一站式 RAG 工作坊（Gemini + Pinecone + LINE）

本套檔案提供 3 小時即可跑完的全雲端工作坊腳本：用 **Google Gemini** 生成/嵌入、**Pinecone Serverless** 檢索、**LINE Messaging API** 回覆，全部透過 `/admin` 後台完成上傳、分塊、嵌入、刪除、清空與測試。

## 架構
- LLM 與 Embedding：Google AI Studio（預設生成 `gemini-2.5-flash`，嵌入 `text-embedding-004`，維度 768）
- Vector Store：Pinecone Serverless（建議區域 `us-east-1`）
- Web：Next.js（cloud-app；路由 `/api/line-webhook`、`/admin`）
- 聊天通道：LINE Official Account Webhook

資料流：`/admin` 上傳教材 → chunk → Gemini 嵌入 → Pinecone upsert（每個來源對應一個 namespace）→ LINE 使用者提問 → Gemini 生成回覆。

## 快速起手（雲端）
1. 建立 Pinecone serverless index（dimension 768，metric cosine，region `us-east-1`），記下 `PINECONE_API_KEY`、`PINECONE_INDEX`、`PINECONE_ENV`。
2. 於 LINE Developers 建立 Messaging API Channel，取得 `LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`。
3. 部署 cloud-app（Vercel/Render 皆可），在環境變數填入：
   - `ADMIN_TOKEN`：自訂後台密碼
   - `GEMINI_API_KEY`
   - `EMBED_MODEL=text-embedding-004`
   - `GEN_MODEL=gemini-2.5-flash`
   - `VECTOR_BACKEND=pinecone`
   - `PINECONE_API_KEY`、`PINECONE_INDEX`、`PINECONE_ENV`
   - `TOPK=6`、`SCORE_THRESHOLD=0.35`
4. 打開 `/admin` 上傳範例教材並測試；將 LINE Webhook 指向 `<你的域名>/api/line-webhook`。

## 研習路線（建議時間軸，3 小時）
- 0:00–0:20 觀念速通：RAG 管線、Chunk / TopK / ScoreThreshold 作用。
- 0:20–0:40 取得 API Key：Gemini、Pinecone、LINE。
- 0:40–1:20 實作 1：`/admin` 上傳教材，觀察嵌入耗時與錯誤。
- 1:20–1:40 實作 2：LINE 端測試，調整 TopK / ScoreThreshold 看命中率。
- 1:40–2:10 教學情境示範：課後測驗、講義摘要、學習建議。
- 2:10–2:40 品質自評：建立 5–10 條金標問答，手動比對 RAG 回覆。
- 2:40–3:00 運維與加值：速率設定、錯誤排除、n8n 串接（可選）。

## 本套件內容
- `docs/01-env.md`：環境變數速查（Pinecone 版）
- `docs/02-pinecone-setup.md`：Pinecone index 建立與測試
- `docs/03-workshop-playbook.md`：逐步腳本與講解節奏
- `docs/04-test-guide.md`：LINE 與 `/admin` 測試清單
- `scripts/ingest-pinecone.ts`：批次嵌入腳本（Codespaces/CI 可用）
- `n8n/workflows/line-rag-pinecone.json`：n8n 選配 workflow（可視化編排）

預設檔案已足夠跑完一場實體或線上工作坊；需要自訂 Prompt、題庫或教材範本時，再依場域加料即可。
