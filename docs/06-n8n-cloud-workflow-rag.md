# 06｜在 n8n（雲端）建立 RAG 流程並串接 LINE（附可匯入 JSON）

## 目的
- 以 n8n（Cloud/SaaS 或雲端自建）接收 LINE Webhook、檢索向量庫、呼叫 LLM、回覆用戶。

## 快速匯入（推薦）
- 直接匯入 `n8n/workflows/line-rag-qdrant.json`（見 `n8n/README.md`）。
- 開啟後編輯 `Set` 節點填入必要變數：`GEMINI_API_KEY`、`QDRANT_URL`、`QDRANT_API_KEY`、`QDRANT_COLLECTION`、`LINE_CHANNEL_ACCESS_TOKEN`、`TOP_K`、`EMBED_MODEL`、`GEN_MODEL`。
- 將 Webhook 節點 URL（`/line/webhook`）填入 LINE Developers 的 Webhook 設定。

## 自行設計（節點）
1) Webhook（POST `/line/webhook`）
2) Function：驗證 `X-Line-Signature`（使用 `LINE_CHANNEL_SECRET`）
3) Function：解析 LINE 事件，取得 `userMessage` 與 `replyToken`
4) IF：是否命中關鍵字（使用 `config/keywords.json` 或節點內建清單）
   - 是 → Compose 關鍵字回覆 → LINE Reply
   - 否 → RAG 子流程：
     a) HTTP Request：Gemini Embedding API（`text-embedding-004`，將 `userMessage` 向量化）
     b) Qdrant 節點或 HTTP：Top-K 相似檢索
     c) Function：將檢索結果整理為 Context
     d) HTTP Request：Gemini 生成（以 System Prompt + Context + 問題）
     e) HTTP Request：LINE Reply API（帶入 `replyToken`）

## 安全
- 在 Webhook 起點先驗簽；若失敗直接 403。
- Secrets 以 n8n Credentials 管理：Gemini、Qdrant/Atlas、LINE。

## 去重策略（避免雙重回覆）
- 若您啟用 LINE 內建關鍵字回覆，請依 `docs/08-keyword-and-rag-routing.md` 的策略 B 調整，預設建議在 n8n 內部實作關鍵字路由。

## 驗證
- 使用 LINE Developers 後台「驗證 Webhook」測試，並於 n8n 執行紀錄中查看節點輸出。
- 若要嚴格驗簽，建議改用 cloud-app 的 `/api/line-webhook` 作為入口（已內建驗簽），n8n 改為由 cloud-app 轉發觸發。

## 【可測試】Webhook 模擬（終端機快速測）
```bash
export N8N_WEBHOOK_URL="https://<your-n8n>/line/webhook"
curl -s -X POST "$N8N_WEBHOOK_URL" \
  -H 'content-type: application/json' \
  -d '{"events":[{"type":"message","message":{"type":"text","text":"測試"},"replyToken":"DUMMY","source":{"type":"user","userId":"Uxxx"}}]}'
```
若 workflow 已正確串 LINE Reply，應在 n8n 執行紀錄看到 flow 被觸發；回覆到 LINE 需換成真實事件（含有效 replyToken）。
