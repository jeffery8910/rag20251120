# 部署指引（Vercel / Render）

以下以雲端快速部署為主，不需本機環境。

## 前置
- 準備好 GitHub repo（根目錄含 `cloud-app/`；若本專案即為 root，部署時 root-directory 填 `cloud-app`）。
- 已取得必填環境變數（見 `docs/01-env.md`）。

## A. Vercel 部署步驟
1. 點擊 README 的「Deploy with Vercel」按鈕，或到 Vercel → New Project → Import Git。
2. Root Directory：`cloud-app`
3. Node 版本：20
4. 填入環境變數：
   - `ADMIN_TOKEN`
   - `GEMINI_API_KEY`
   - `EMBED_MODEL=text-embedding-004`
   - `GEN_MODEL=gemini-2.5-flash`
   - `VECTOR_BACKEND=pinecone`
   - `PINECONE_API_KEY`、`PINECONE_INDEX`、`PINECONE_ENV`
   - `LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`
   - 建議：`TOPK=6`、`SCORE_THRESHOLD=0.35`
5. 部署完成後，複製產生的網域，作為 LINE Webhook：
   - `https://<your-vercel-app>.vercel.app/api/line-webhook`

## B. Render 部署步驟
1. 點 README 的「Deploy to Render」或 Render → New Web Service → 連 GitHub。
2. Root / Directory：`cloud-app`
3. Runtime：Node 20，Build Command `npm install && npm run build`，Start Command `npm start`
4. 填入同上一節的環境變數。
5. 部署完成後 Webhook：
   - `https://<your-render-service>.onrender.com/api/line-webhook`

## 驗收
- `GET https://<domain>/api/health?withDb=1` 應回傳 pinecone/gemini/line 為 ok。
- `/admin` 能登入並上傳檔案、測試問答。
- LINE App 收到訊息能回覆教材內容；教材外問題應回「查無資料」。
