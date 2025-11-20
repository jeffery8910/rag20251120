# LINE Login + Web 前端整合（示意與操作）

> 目的：除 Webhook 回覆外，讓使用者在 Web 介面以 LINE 身份登入，體驗個人化助手（同一份 RAG 管線）。

## 功能構想
- 使用者在前端按「LINE Login」→ LINE OAuth → 取得 id_token / profile。
- 前端帶著 identity token 呼叫後端 `/api/test` 或自訂 `/api/assist`，可用 LINE userId 進行：
  - 個人化提問紀錄（LOG_PROVIDER 若設 Atlas/PG 等）
  - 動態選擇 namespace（依 userId 決定檢索資料集）
  - 帶入「我的教材」或「班級教材」的路由

## 實作步驟（簡化版）
1) 在 LINE Developers 為同一官方帳號啟用 LINE Login，設定 Callback URL 為你的前端域名（例 `https://<domain>/line-callback`）。  
2) 取得 Channel ID / Channel Secret（Login 用，與 Messaging API 可同帳號但不同用途）。  
3) 前端（Next.js）放置一個「登入」按鈕，導向：
```
https://access.line.me/oauth2/v2.1/authorize?
  response_type=code&
  client_id=<LOGIN_CHANNEL_ID>&
  redirect_uri=https://<domain>/line-callback&
  scope=openid%20profile&
  state=<random>
```
4) 在 `/line-callback` 交換 token：
   - POST `https://api.line.me/oauth2/v2.1/token`，帶 code + redirect_uri + client_id + client_secret。  
   - 取得 `id_token` 後用 `https://api.line.me/oauth2/v2.1/verify` 驗證，拿到 userId、displayName。
5) 前端把 userId 存在 cookie/localStorage，呼叫本專案 API 時附上 `x-user-id` header（或 Authorization bearer 自訂）。  
6) 後端（可在 `/api/test` 或新 endpoint）：
   - 讀取 `x-user-id` → 用作分流：如 namespace = `user_<id>` 或 `class_<id>`。  
   - 日誌寫入時也紀錄 userId，便於個人化分析。

## /admin 示範用法
- 在 `/admin` 加一個「以 LINE 身份測試」按鈕：先通知前端完成 OAuth，再帶 userId 呼叫同一條 RAG 測試 API。  
- 不改核心 RAG 程式，只在檢索與日誌層加上 userId aware 的 namespace/metadata。

## 注意
- LINE Login 的 Channel Secret/ID 與 Messaging API 的 Channel Secret/Token 不同；請分開存放。  
- 若部署在 Vercel/Render，redirect_uri 需與 LINE console 設定一致且為 https。  
- Demo 環境建議只開放 profile scope（openid+profile），不要開 email。  

此章提供操作框架，若要真實整合需在前端新增 Login 按鈕與 callback route，後端加 userId 分流邏輯；現有 RAG 流程可直接重用。***
