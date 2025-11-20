# n8n Workflow（Pinecone 版）

用途：示範以 n8n 串接 LINE → cloud-app `/api/test` → LINE 回覆，讓學員在可視化流程裡觀察 RAG 回應。

步驟
1. 開啟 n8n（自建或 n8n Cloud），Import `workflows/line-rag-pinecone.json`。
2. 編輯兩個環節：
   - `LINE Webhook` 節點：填入你的 Channel access token、Channel secret。
   - `Call cloud-app` 節點：填入部署好的 `https://<your-app>/api/test` 與 `ADMIN_TOKEN`。
3. 執行測試流程；看到 `answer` 後再用 LINE Reply API 回推給使用者即可。

備註：本 workflow 預設將使用 cloud-app 的 RAG pipeline（Gemini + Pinecone），無需在 n8n 內自行串接 Pinecone。
