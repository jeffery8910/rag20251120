# Workshop Playbook（3 小時腳本）

## 前置（講師）
- 事先建立 Pinecone index、LINE Channel，部署 cloud-app，確認 `/admin` 可登入。
- 準備兩份示例教材（短篇+長篇），放在 `data/`（可自訂）。
- 在 LINE 綁定 Webhook：`https://<your-app>/api/line-webhook`。

## 現場流程
### 0:00–0:20 觀念
- RAG 管線：Chunk → Embed → Vector Search → Context → LLM。
- TopK / ScoreThreshold 影響：TopK 增加命中率但可能稀釋相關度；ScoreThreshold 可過濾雜訊。
- Namespace 策略：本專案「每個來源一個 namespace」，刪除/清空容易。

### 0:20–0:40 Key 準備
- 學員領取：Gemini API Key、Pinecone API Key/Index/Env、LINE 測試帳號。
- 講師示範在 `/admin/setup` 或 health API 確認 env 已就緒。

### 0:40–1:20 實作 1：上傳與嵌入
- 在 `/admin` 上傳短篇教材，Chunk 參數建議：`chunkSize=800`、`overlap=120`。
- 觀察「插入數量」與錯誤訊息；若速率受限，可在 `.env` 調整 `GEMINI_EMBED_RPM`。
- 介紹「刪除來源」= 刪除 namespace；「清空向量庫」= 刪除所有 namespace。

### 1:20–1:40 實作 2：LINE 問答
- 學員用 LINE 發問；示範調整 TopK / ScoreThreshold，對比回覆差異。
- 未命中時，鼓勵讓模型回「查無資料」，避免幻想。

### 1:40–2:10 情境 Demo
- 課後測驗：使用 `/admin` Prompt 模板（可貼下列範例）。
- 講義摘要：要求產出「300 字摘要＋3 個重點 + 推薦延伸閱讀」。
- 學習建議：根據學生提問歷程，列出「下一步練習」。

### 2:10–2:40 品質自評
- 發放 5–10 條標準問答（CSV），手動比對模型回覆。
- 討論：命中率、可讀性、來源引用；如何補充教材或調 Chunk/TopK。

### 2:40–3:00 運維與加值
- 速率與費用：Pinecone Starter 2GB / 2M write / 1M read；Gemini 免費層配額。
- n8n 選配：Webhook → 驗簽 → 呼叫 cloud-app `/api/test` → LINE Reply。

## Admin Prompt 範例（可直接貼）
**「課後測驗出題官」**
```
你是課後測驗出題官，根據提供的教材內容，產出一題單選題。
請同時給出正確解答與簡短解釋，不要杜撰教材沒有的資訊。
回答格式：
- 題目：....
- 選項：A) ... B) ... C) ... D) ...
- 正解：A/B/C/D
- 理由：一行說明
```

**「教材助教」**
```
你是教材助教，需根據提供的教材段落回答學生問題。
若教材沒有涵蓋，請回答「查無資料，請提供更多上下文」。
回答請控制在 6 行內，並在最後一行列出來源 (source 與 page)。
```
