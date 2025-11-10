# 09｜（選配）Web 管理介面

## 內容
- 目的：提供管理者於瀏覽器上傳/更新教材、調整系統提示（Prompt）、檢視對話紀錄。
- 架構：Next.js（Vercel/Render）單一應用，後端 API 由同一專案提供。
- 權限：以單一 `ADMIN_TOKEN` 門禁（登入頁僅輸入 Token，即可進入 /admin 介面）。

## 主要功能（已內建於 cloud-app）
- 上傳教材（PDF/TXT/MD/DOCX）或貼上純文字 → 伺服器分塊 → Gemini 嵌入 → 寫入向量庫（預設 Qdrant；可切換 Atlas）
- 編輯 Prompt/關鍵字（未設定 Atlas 時使用預設；設定後可存於 Atlas `config` 集合）
- 管理資料：
  - 刪除指定來源檔的所有分塊（依 `source`）
  - 重新嵌入指定來源（用於模型升級或矯正嵌入）
  - 清空整個向量集合（Qdrant：刪除 Collection；Atlas：刪除 `docs` 全部文件）
- 對話紀錄（/admin/conversations）：依 `LOG_PROVIDER` 讀取（預設 `none` → 空清單）

## 權限與登入流程
- 整個 `/admin` 以門禁元件統一保護：進入 `/admin` 首頁會先顯示 Token 登入畫面。
- 驗證方式：呼叫 `/api/admin/ping` 並比對 `Authorization: Bearer <ADMIN_TOKEN>`。
- 登入成功後 Token 儲存在瀏覽器 `localStorage`（僅該瀏覽器生效）。
- 版面右上提供「登出」（清除 localStorage 後重載）。

## 注意
- 嚴禁在前端曝露金鑰；所有嵌入/寫入均由後端 API 執行（需 `ADMIN_TOKEN`）。
- 若未設定 Qdrant/Atlas，相關資料操作 API 會回清楚錯誤（不會造成建置失敗）。
- 重新嵌入時如遇向量維度不相容（更換嵌入模型），請先使用「清空集合」再重新上傳。
