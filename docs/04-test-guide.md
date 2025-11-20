# 測試清單（/admin 與 LINE）

## /admin
- 登入：輸入 `ADMIN_TOKEN` 進入。
- 上傳檔案：選擇 PDF/MD/TXT/DOCX，設定 chunkSize=800、overlap=120，確認「插入數量」>0。
- 刪除來源：選擇剛上傳的檔名，按刪除並確認，再查看 sources 變為空。
- 清空向量庫：僅在需要重置時使用，會刪除所有 namespace。
- 線上測試：輸入「這份教材的三個重點是？」應回覆含來源。

## LINE
- 問答：對應教材提問，應能引用內容回答。
- 未命中：問教材外問題，應回「查無資料/不在教材」。
- 參數體驗：在 `/admin` 調整 TopK 2→8、ScoreThreshold 0.2→0.5，比較回覆變化。

## 健康檢查 API
- `GET /api/health?withDb=1`  
  - 應看到 `pinecone.ok = true`、`geminiKey=true`、LINE 金鑰為 true。
  - 若 pinecone 為 false，多半是 API Key 或 Index 名稱錯誤。
