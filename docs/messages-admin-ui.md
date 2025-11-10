# RAG 管理介面（/admin）訊息與欄位說明

本檔彙整管理後台所有主要區塊、欄位、按鈕與其行為，方便教學與客製。

- 存取：造訪 `/admin`，需輸入 `ADMIN_TOKEN`。
- 語言：目前為繁體中文硬編碼；若需 i18n 可改為集中字典。

## 登入門禁（AdminGate）
- 欄位：
  - `Admin Token`：需與後端環境變數 `ADMIN_TOKEN` 相同。
- 按鈕：
  - `驗證並進入`：呼叫 `/api/admin/ping` 驗證授權。
- 訊息：
  - `驗證中…`、`驗證成功，可進入管理介面`、`驗證失敗：Token 不正確或未授權`。
- 其他：登入後 Token 會存於瀏覽器 `localStorage.adminToken`；右上角 `登出` 會清除此項。

## 共同導覽（/admin/layout）
- 連結：`管理介面`、`對話紀錄`。
- 右側狀態：`已登入` + `登出`。

## 管理介面首頁（/admin）

### 2) 系統設定（Prompt / 關鍵字 / 檢索參數）
- 欄位：
  - `系統提示（Prompt）`：發問時固定附帶的指示文字（例：要求引用來源）。
  - `關鍵字清單（以半形逗號分隔）`：完全相符關鍵字走快捷回覆（不進 RAG）。
  - `TOPK`：每次檢索返回片段數（預設 6）。
  - `SCORE_THRESHOLD`：相似度分數門檻（Qdrant 用，預設 0.1）。
  - `NUM_CANDIDATES`：Atlas 向量搜尋候選數（預設 400）。
- 按鈕：
  - `保存設定`：PUT `/api/admin/config`（需授權）。
- 提示：未設定 Atlas 時，頁面會顯示與使用預設值，但不會持久化到資料庫。

### 3) 上傳進度
- 顯示：
  - `<progress>` 進度條、百分比、`已上傳 X MB / Y MB`。
  - 完成後顯示：`總寫入 N 個分塊 / 成功 / 錯誤` 摘要。

### 4) 上傳教材（貼上純文字）
- 欄位：
  - `內容`、`來源檔名`（用於標註來源）。
- 按鈕：
  - `上傳`：POST `/api/admin/docs`（需授權）。
- 成功訊息：`已寫入 N 個分塊`。

### 5) 上傳教材（檔案上傳）
- 欄位：
  - `選擇檔案（多檔）`、`chunkSize`、`overlap`。
- 按鈕：
  - `上傳`：POST `/api/admin/docs/upload`（需授權；支援 .txt/.md/.pdf/.docx）。
- 可能錯誤：
  - `Bad Request`（Qdrant 維度不符）、`PDF 解析失敗`、`DOCX 解析失敗`、`Gemini embed failed`、`Vector store not configured`。

### 6) 資料管理（刪除 / 重嵌 / 清空集合）
- 欄位：
  - `來源檔名`：要管理的來源識別字串（通常是上傳檔名）。
- 按鈕：
  - `刪除此來源`：DELETE `/api/admin/docs?source=...`。
  - `重新嵌入此來源`：POST `/api/admin/docs/reembed`（以目前模型重算 embedding）。
  - `清空集合`：POST `/api/admin/vector/clear`（Qdrant：刪除 Collection；Atlas：清空 docs）。

### 7) 日誌
- 按鈕：
  - `重新載入`：GET `/api/admin/logs?limit=50`。
- 表格欄位：`時間`、`類型`、`問題`、`摘要`（錯誤或 hits 數量）。

## 對話紀錄（/admin/conversations）
- 篩選欄位：`使用者 ID`、`Channel`、`數量`、`關鍵字`、`起始（ISO）`、`結束（ISO）`。
- 按鈕：`重新載入`。
- 表格欄位：`時間`、`方向`、`類型`、`使用者`、`內容`。
- 列點擊：開啟明細頁 `/admin/conversations/[id]`。

## 對話明細（/admin/conversations/[id]）
- 欄位：`時間`、`方向`、`類型`、`使用者`、`內容`。
- 區塊：`檢索片段與分數`（來源、頁次、分數）。

## 健康檢查（/admin/setup）
- 切換：`資料庫連線測試`（開啟才會實際連線）。
- 顯示：`LOG_PROVIDER（目前）`、檢查列表（`OK/FAIL` 與資訊/錯誤）、環境變數分組（需要/已填/缺少）。

---

## 客製化建議
- 語系：可將所有字串集中到 `src/i18n/messages.ts`（建議新檔）並以 hooks 供各頁引用。
- 驗證提示：登入門禁目前只顯示簡訊息，可改為顏色標籤並加入「記住我」勾選。
- 上傳：可改為逐檔列隊顯示獨立進度與結果表，或加入重試機制。

