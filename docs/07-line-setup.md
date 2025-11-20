# LINE Messaging API 設定步驟

## 建立 Channel
1. 到 [LINE Developers](https://developers.line.biz/console/) → Create → Messaging API。
2. 填入應用名稱與基本資料，建立 Channel。

## 取得金鑰
- `LINE_CHANNEL_SECRET`：Basic settings → Channel secret。
- `LINE_CHANNEL_ACCESS_TOKEN`：Messaging API → Issue (長存取權杖)。

## 設定 Webhook
部署好之後，把 Webhook URL 設為：
```
https://<你的域名>/api/line-webhook
```
並在 Messaging API 頁面：
- 開啟「Use webhook」。
- 點擊「Verify」應為 success。

## 權限與安全
- Webhook handler 已內建簽名驗證：請確保環境變數的 secret/token 正確。
- 開發時可先關閉「Auto-reply」與「Greeting message」，避免干擾。

## 測試
1. 在 `/admin` 完成上傳與嵌入。
2. 用官方帳號對話：
   - 問教材內問題：應帶來源的回答。
   - 問教材外問題：應回「查無資料」或設計的 fallback。
3. 若未回應：
   - 查環境變數是否填錯。
   - 看 `GET /api/health?withDb=1` 狀態。
   - 查看 Vercel/Render 日誌。
