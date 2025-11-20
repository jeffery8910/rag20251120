# LINE 故障排除速查

## 常見症狀與檢查
- **Webhook 驗證失敗**  
  - 確認 URL：`https://<domain>/api/line-webhook`  
  - 確認 env：`LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN` 正確無多餘空白  
  - 重新點 LINE Developers 的「Verify」

- **訊息無回應**  
  - 看後端日誌是否 401：多半 `ADMIN_TOKEN` 或 LINE 金鑰錯，重新設定環境變數後重 deploy  
  - `GET /api/health?withDb=1` 需顯示 line/gemini/pinecone 為 ok  
  - 確認 `/admin` 已上傳教材並可線上測試成功

- **回應亂碼或空白**  
  - 可能教材內容未命中：降低 `SCORE_THRESHOLD` 或提高 `TOPK`，再問  
  - 檢查教材格式：PDF 解析失敗可改成 TXT/MD  

- **簽名錯誤 403**  
  - 確認 Webhook URL 與 Channel Secret 配對  
  - 重新發行 Channel access token，更新環境變數並重啟

## 快速自測
1. `/admin` → 測試／聊天：輸入「這份教材的三個重點？」應有回覆。  
2. LINE 對話輸入同樣問題；若無回覆，看 Render/Vercel 日誌是否有 401/403/500。  
3. Curl Webhook 模擬（替換 token/domain）：
   ```bash
   curl -X POST https://<domain>/api/line-webhook \
     -H "Content-Type: application/json" \
     -d '{"events":[{"replyToken":"dummy","type":"message","message":{"type":"text","text":"hello"}}]}'
   ```
   若 200，代表接口可達；再檢查簽名驗證及 LINE 端設定。

## 設定 checklist
- Webhook URL 正確，已點 Verify 成功  
- Access Token 未過期，至少一次重發並重新部署  
- `LINE_CHANNEL_SECRET` / `LINE_CHANNEL_ACCESS_TOKEN` 已填入雲端環境  
- /admin 可登入並成功測試 RAG 回覆  
- `GET /api/health?withDb=1` 顯示 ok
