# 17｜n8n 可選部署（與 cloud-app 分離）

本文件說明如何將 n8n 與 `cloud-app`（Next.js）解耦，使 n8n 成為「可選」的外掛式自動化層。你仍然使用 Gemini（Google AI Studio）做嵌入與生成；是否經過 n8n 完全由你選擇。

## 什麼情況需要 n8n？
- 想以可視化節點方式編排流程（審核、分流、排程、CRM/表單整合）。
- 需要把 cloud-app 的回答前/後再串多個服務或寫入報表。
- 想要把「關鍵字回覆」或「客制化流程」交給 n8n，RAG 留在 cloud-app。

若只是 RAG + LINE 互動，`cloud-app` 已可獨立完成，n8n 並非必要。

## 可以部署在 Vercel 嗎？
不建議。Vercel 屬 Serverless（短時間執行、無持久磁碟），不適合長駐的 n8n 進程。建議選：
- n8n Cloud（官方代管）
- Render（Free 可起步，建議掛持久磁碟）
- Railway / Fly.io / 自主 VM / Kubernetes

下文以 Render 為例。

## 部署 n8n 到 Render（建議）
1) 建立 Web Service（Node or Docker 皆可，以下示意 Node 版）
- Create new Web Service → 連接你的 Git repo（可專門放一個空的 n8n 目錄與 Procfile）。
- Build Command：`npm i n8n -g`
- Start Command：`n8n start`

2) 設定環境變數（Render → Environment）
- 基本
  - `N8N_PORT=5678`
  - `N8N_PROTOCOL=https`
  - `N8N_HOST=<你的 Render 網域，如 my-n8n.onrender.com>`
  - `WEBHOOK_URL=https://<你的 Render 網域>`（n8n 用於產生外部可觸發的 Webhook URL）
  - `N8N_ENCRYPTION_KEY=<請填 32+ 隨機字元>`
  - （可選）`N8N_BASIC_AUTH_ACTIVE=true`、`N8N_BASIC_AUTH_USER`、`N8N_BASIC_AUTH_PASSWORD`
- Gemini（在 n8n 內用 HTTP 節點呼叫時使用）
  - `GEMINI_API_KEY=<你的金鑰>`（或在 n8n Credentials/Variables 中保存）

3) 持久化
- 在 Render 建立 Persistent Disk，掛載到 `/home/node/.n8n`（n8n 預設工作目錄），保留 Workflow 與 Credentials。

4) 驗證
- 開啟 `https://<service>.onrender.com` → n8n 編輯器登入 → 新建/匯入 `n8n/workflows/line-rag-qdrant.json`。

> 也可改用 Docker：以 `ghcr.io/n8n-io/n8n` 官方映像，並掛載 `/home/node/.n8n`；環境變數同上。

## 與 cloud-app 的整合模式
你可擇一使用：

- 模式 A（純 cloud-app；不經 n8n）
  - LINE Webhook → `cloud-app` `/api/line-webhook`；回答與檢索完全在 `cloud-app`。

- 模式 B（Webhook 指向 n8n）
  - LINE Webhook → n8n Webhook 節點 →（Embedding/檢索/生成）→ LINE Reply。
  - 注意：n8n 原生很難驗證 LINE 簽名的「raw body」。若要嚴格驗簽，建議改用模式 C。

- 模式 C（cloud-app 驗簽，再轉發到 n8n）
  - LINE Webhook → `cloud-app` `/api/line-webhook`（已內建簽名驗證）→ 依條件轉發到 n8n Flow。
  - 目前 repo 尚未啟用「自動轉發」開關；若你要，我可以加上：
    - `FORWARD_TO_N8N_URL=<n8n 對外 HTTP 入站端點>`（cloud-app 檢測到特定關鍵字或路由時，將事件 POST 到此端點）。

## 讓 n8n 成為「可選」
- 在文件與部署上分離：
  - `cloud-app` 仍部署在 Vercel/Render（擇一）；
  - `n8n` 可隨時在 Render/n8n Cloud 另建專案；
  - LINE Webhook 可由你切換到 n8n 或 cloud-app（模式 B/C）。
- 在程式上抽象「嵌入/檢索/生成」：
  - 你已選擇持續用 Gemini；n8n 只在需要時插隊處理（審核/分流/排程）。

## 常見 QA
- Q：若我把 cloud-app 部署在 Vercel，n8n 能放 Render 嗎？
  - A：可以，也是常見做法。cloud-app 與 n8n 各有自己的 URL，互不影響。
- Q：LINE Webhook 只能設定一個，要怎麼同時讓 cloud-app 和 n8n 都收到？
  - A：請用模式 C：Webhook 指向 cloud-app，由 cloud-app 驗簽後「按條件」轉發到 n8n。要我加 `FORWARD_TO_N8N_URL` 的程式嗎？
- Q：n8n 也能用 Gemini 嗎？
  - A：可以。用 HTTP Request 節點帶 `x-goog-api-key: {{ $env.GEMINI_API_KEY }}` 即可；我們提供了可匯入的 workflow 範例在 `n8n/workflows/line-rag-qdrant.json`。

## 下一步（可選實作）
- 我可以在 `cloud-app` 加上：
  - `FORWARD_TO_N8N_URL` & `FORWARD_RULE=keywords|all`（由 `/admin` 管理）
  - `/api/admin/n8n/test` 測試轉發是否成功
  - 文件同步更新（部署/安全/去重策略）

## 【可測試】n8n 基本健康檢查
- 編輯器可開啟：`https://<service>.onrender.com`（或 n8n Cloud 專案 URL）
- 基本 API：
  ```bash
  curl -s https://<service>.onrender.com/rest/ping | jq .
  ```
- Webhook 模擬（同 06 節的範例）：
  ```bash
  curl -s -X POST "https://<service>.onrender.com/webhook/line/webhook" \
    -H 'content-type: application/json' \
    -d '{"events":[{"type":"message","message":{"type":"text","text":"n8n 測試"},"replyToken":"DUMMY","source":{"type":"user","userId":"Uxxx"}}]}'
  ```
