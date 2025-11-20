# cloud-app (Gemini + Pinecone default)

Next.js App Router，提供：
- LINE Webhook：`/api/line-webhook`
- 管理後台：`/admin`（上傳/分塊/嵌入/清空/測試）
- 測試介面：六種 JSON 模板（摘要/單選/條列/建議/表格/時間線），可直接點按鈕生成；支援「身分」下拉傳入 userId 以分流 namespace。

## 一鍵部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<YOUR_GITHUB_REPO_URL>&root-directory=cloud-app&project-name=rag-line-cloud-app&repository-name=rag-line-cloud-app&env=ADMIN_TOKEN,GEMINI_API_KEY,EMBED_MODEL,GEN_MODEL,VECTOR_BACKEND,PINECONE_API_KEY,PINECONE_INDEX,PINECONE_ENV,LINE_CHANNEL_SECRET,LINE_CHANNEL_ACCESS_TOKEN,TOPK,SCORE_THRESHOLD&envDescription=請依 docs%2F01-env.md 填寫&envLink=../docs/01-env.md)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=<YOUR_GITHUB_REPO_URL>&dir=cloud-app)

Webhook（部署後填入 LINE）：`https://<your-app>/api/line-webhook`

## 必填環境變數
- `ADMIN_TOKEN`
- `GEMINI_API_KEY`
- `EMBED_MODEL=text-embedding-004`
- `GEN_MODEL=gemini-2.5-flash`
- `VECTOR_BACKEND=pinecone`
- `PINECONE_API_KEY` / `PINECONE_INDEX` / `PINECONE_ENV`
- `LINE_CHANNEL_SECRET` / `LINE_CHANNEL_ACCESS_TOKEN`
- 建議：`TOPK=6`、`SCORE_THRESHOLD=0.35`

（進階可替換）Atlas / Qdrant 請見 `docs/09-atlas-setup.md`、`docs/10-qdrant-setup.md`

## 開發
```bash
npm install
npm run dev
# http://localhost:3000/admin  輸入 ADMIN_TOKEN
```

## 批次嵌入
在 repo 根目錄：
```bash
PINECONE_API_KEY=... PINECONE_INDEX=... PINECONE_ENV=us-east-1 \
GEMINI_API_KEY=... npx ts-node scripts/ingest-pinecone.ts ./data
```

## 文件
- `docs/01-env.md`
- `docs/02-pinecone-setup.md`
- `docs/03-workshop-playbook.md`
- `docs/04-test-guide.md`
- `docs/05-admin-test-modes.md`
- `docs/06-deploy.md`
- `docs/07-line-setup.md`
- `docs/08-line-troubleshooting.md`
- `docs/09-atlas-setup.md`
- `docs/10-qdrant-setup.md`
- `docs/11-mermaid-flow.md`
- `docs/12-line-login-web.md`
