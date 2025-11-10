# 打造智慧 LINE 聊天機器人：RAG x LINE Chatbot（雲端優先）

本專案以「全雲端 + GitHub Codespaces」為前提，帶您完成：
- 以 Google AI Studio（Gemini）進行文字嵌入與回答生成
- 以 Qdrant Cloud（或 MongoDB Atlas Vector Search）建立向量檢索
- 以 n8n（雲端）設計 RAG 流程並串接 LINE Messaging API
- 以 Web 管理介面（選配）維運知識庫與系統提示

請依序閱讀 `docs/`：
- docs/00-overview.md（新的整合總覽）
- docs/00-overview-architecture.md（已整併，保留作相容指引）
- docs/00-overview-env.md
- docs/01-codespaces-setup.md
- docs/02-google-ai-studio-api-key.md
- docs/03-qdrant-cloud-setup.md（或 03b-mongodb-atlas-vector-search.md）
- docs/04-prepare-knowledge-base.md
- docs/05-embedding-ingest-from-codespaces.md
- docs/06-n8n-cloud-workflow-rag.md
- docs/07-line-developers-setup.md
- docs/08-keyword-and-rag-routing.md
- docs/09-admin-web-management.md（選配）
- docs/10-secrets-and-security.md
- docs/11-ci-cd-with-github-actions.md
- docs/12-troubleshooting.md
- docs/13-checklist.md
- docs/14-non-md-files-usage.md
 - docs/15-rate-limits.md
 - docs/16-cloud-app-deploy.md
 - docs/17-n8n-optional-deploy.md
 - docs/16-cloud-app-deploy.md

**Outdated**
- 已將根目錄的舊教學稿與 AGENTS 指南移至 `outdated/`（保留 `README.md` 與 `AGENTS.md` 於根目錄）。

雲端優先注意：本專案不提供本機安裝流程；所有指引均以雲端產品或 SaaS 為主，並在 Codespaces 中完成必要腳本與設定。若要在 n8n 快速匯入工作流程，請見 `n8n/README.md` 與 `n8n/workflows/line-rag-qdrant.json`。
