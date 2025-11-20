# Pinecone Serverless 設定與測試

## 建立 Index
1. 登入 console.pinecone.io → Create index。
2. 選擇 **Serverless**，cloud `AWS`，region `us-east-1`（與免費額度一致）。
3. 設定：
   - Name：`g-workshop`（示例）
   - Dimension：`768`（對應 `text-embedding-004`）
   - Metric：`cosine`
4. 建立後，於 Console 右上角複製 **API Key**，並記下環境名稱（例 `us-east-1`）。填入環境變數：
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX=g-workshop`
   - `PINECONE_ENV=us-east-1`

## 快速自測（curl）
```bash
curl -X POST "https://controller.${PINECONE_ENV}.pinecone.io/databases" \
  -H "Api-Key: ${PINECONE_API_KEY}"
# 200 OK 即正常；若 404/401 請檢查 env/value。
```

## 嵌入維度提示
- 預設 `text-embedding-004` 為 768 維。
- 若改用其他模型，請：
  1) 重建 index 並設 dimension；或 2) 清空 namespace 後重新上傳。

## 清空 / 刪除
- `/admin` 的「清空向量庫」會逐 namespace `deleteAll`; 不會刪除 index。
- 要刪整個 index，請在 Pinecone Console 手動刪除，或確保 rename index 後更新環境變數。
