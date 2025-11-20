# RAG × LINE 教學專案（Gemini + Pinecone 主線）

一鍵部署的 RAG 工作坊範例：**Google Gemini** 生成/嵌入 + **Pinecone** 檢索 + **LINE Messaging API**。/admin 後台可上傳、分塊、嵌入、清空、測試；測試分頁內建 6 種 JSON 模板（摘要/單選/條列/建議/表格/時間線）。

## 一鍵部署
**Vercel**  
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<YOUR_GITHUB_REPO_URL>&root-directory=cloud-app&project-name=rag-line-cloud-app&repository-name=rag-line-cloud-app&env=ADMIN_TOKEN,GEMINI_API_KEY,EMBED_MODEL,GEN_MODEL,VECTOR_BACKEND,PINECONE_API_KEY,PINECONE_INDEX,PINECONE_ENV,LINE_CHANNEL_SECRET,LINE_CHANNEL_ACCESS_TOKEN,TOPK,SCORE_THRESHOLD&envDescription=請依 docs%2F01-env.md 填寫&envLink=docs%2F01-env.md)

**Render**  
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=<YOUR_GITHUB_REPO_URL>&dir=cloud-app)

部署後將 LINE Webhook 設為：`https://<domain>/api/line-webhook`

## 必填環境變數（主線：Pinecone）
- `ADMIN_TOKEN`
- `GEMINI_API_KEY`
- `EMBED_MODEL=text-embedding-004`
- `GEN_MODEL=gemini-2.5-flash`
- `VECTOR_BACKEND=pinecone`
- `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_ENV=us-east-1`
- `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`
- 建議：`TOPK=6`, `SCORE_THRESHOLD=0.35`
- 完整說明：`docs/01-env.md`

進階替換向量庫（選用）  
- Atlas Vector Search：`docs/09-atlas-setup.md`  
- Qdrant Cloud：`docs/10-qdrant-setup.md`

## 操作速覽
1) `/admin` 上傳檔案或貼文字 → 系統分塊+嵌入寫入 Pinecone。  
2) 測試／聊天分頁：選輸出樣式或點六種模板按鈕，立即得到結構化卡片＋原始 JSON；可切換身分（teacher/student-a/b）傳入 userId 以分流 namespace。  
3) 部署驗收：`/api/health?withDb=1`（Gemini/Pinecone/LINE）、LINE 實際發訊測試。  

## 文件導航（一步步）
1. `docs/00-overview.md` 總覽  
2. `docs/01-env.md` 環境變數  
3. `docs/02-pinecone-setup.md` 向量庫建立/測試  
4. `docs/03-workshop-playbook.md` 3 小時腳本  
5. `docs/04-test-guide.md` /admin + LINE 驗收  
6. `docs/05-admin-test-modes.md` 六種 JSON 模板操作（含角色切換）  
7. `docs/06-deploy.md` Vercel / Render 部署  
8. `docs/07-line-setup.md` LINE 設定  
9. `docs/08-line-troubleshooting.md` LINE 故障排除  
10. `docs/09-atlas-setup.md` Atlas Vector Search（選用）  
11. `docs/10-qdrant-setup.md` Qdrant Cloud（選用）  
12. `docs/11-mermaid-flow.md` 流程圖（上傳→chunk→embedding→索引→檢索→生成→前端/LINE）  
13. `docs/12-line-login-web.md` LINE Login + Web 前端合流示意  

## 開發
```bash
cd cloud-app
npm install
npm run dev
# http://localhost:3000/admin  輸入 ADMIN_TOKEN
```

批次嵌入（本地/CI）
```bash
PINECONE_API_KEY=... PINECONE_INDEX=... PINECONE_ENV=us-east-1 \
GEMINI_API_KEY=... npx ts-node scripts/ingest-pinecone.ts ./data
```

## 特別說明
- AI 語意標註：上傳時會用 Gemini 2.5 Flash 自動產生 title/summary/keywords 寫入 metadata，並在上傳結果面板顯示。  
- 角色切換：測試分頁的「身分」下拉會把 userId 帶到後端，可用來示範依使用者分 namespace。  
- 若更換嵌入模型（如 gemini-embedding-001），務必重建/清空索引並對齊維度。***
