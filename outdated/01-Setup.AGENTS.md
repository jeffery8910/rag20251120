# �e�m�@�~�P���ҳ]�w�]�K�O��סUWindows�^

�A�νd��G�����}�o�B���ջP Vercel��Render �G�p�ǳơC

## �ؼ�
- �إߦ@�Ϋ~��GGoogle Gemini�BLINE Messaging API�BMongoDB Atlas�BGit �x�s�w�C
- ���������t�m�]n8n + Qdrant�^�H���x�y�{�A�A���V `cloud-app` �����p�C
- �ǳƥ��n CLI �P�u��G�i�W�Ǧ� Vercel�BRender�A�ëO�@���K���_�C

## ���Ʊb���]�K�O�h�^
| ���� | �γ~ |
| --- | --- |
| Google �b�� | �ӽ� Gemini API Key�B�ϥ� Google Drive �O�s�Ч� |
| LINE Developers | �إ� Messaging API Channel�B���o Webhook ���� |
| MongoDB Atlas | �إ� M0 �O���P Vector Search ���� |
| GitHub�]�� GitLab/Bitbucket�^ | �x�s `cloud-app` ��l�X�� Vercel/Render �פJ |
| Cloudflare�]��t�^ | �������ծɴ����{�ɤ��}���}�]Tunnel�^ |

## �w�ˤu��]PowerShell�^
```
winget install OpenJS.NodeJS.LTS        # Node.js ? 18
winget install Cloudflare.cloudflared   # ��t�GTunnel
winget install Git.Git
```
���ҡG`node -v`�B`npm -v`�B`git --version`�B`cloudflared --version`�]�Y�w�ˡ^�C

## �����t�m�]��t����ĳ�^
1. �Ұ� n8n�G`npx n8n@latest`
2. �ӽ� Qdrant Cloud �K�O�M�שΧ�� Atlas ���� Collection�A�N URL �g�J `QDRANT_API_URL`�]�Ϊ������L�A�M�`�� Atlas�^�C
3. �{�ɤ��}���}�G`cloudflared tunnel --url http://localhost:5678`
4. LINE Webhook ���V `https://xxxx.trycloudflare.com/line/webhook` ���Ҭy�{�C

## �����ܼƲM��]�@�ή榡�^
- LLM�G`GOOGLE_API_KEY`�B`EMBED_MODEL=gemini-embedding-001`�B`GEN_MODEL=gemini-2.5-flash`
- LINE�G`LINE_CHANNEL_SECRET`�B`LINE_CHANNEL_ACCESS_TOKEN`
- Atlas�G`ATLAS_DATA_API_BASE`�]�t `/action`�^�B`ATLAS_DATA_API_KEY`�B`ATLAS_DATA_SOURCE=Cluster0`�B`ATLAS_DATABASE=ragdb`�B`ATLAS_COLLECTION=docs`�B`ATLAS_SEARCH_INDEX=vector_index`
- ��L�G`ADMIN_TOKEN`�B`TOPK=6`�B`SCORE_THRESHOLD=0.1`�B`NUM_CANDIDATES=400`
- log provider �ﶵ�G`LOG_PROVIDER=atlas|pg|mysql|supabase`�A�è̿ﶵ�� `DATABASE_URL`�B`MYSQL_URL`�B`SUPABASE_URL`�B`SUPABASE_SERVICE_ROLE_KEY`�C

> ���ܡG�ϥ� `direnv`�BPowerShell `$Env:KEY="VALUE"` �� GitHub/Vercel/Render �������ܼƤ����޲z�A�קK���_�g�J��l�X�C

## Git �P��Ƨ��W��
- ��ĳ�N��Ӥu�@�{��Ƨ���l�� Git�]�Ψϥβ{�� repo�^�C
- `cloud-app/` �@�� Next.js �M�סA�i�������� GitHub �� Vercel/Render �פJ�C
- ��l `.md` ���u�@�{���ޡA�i�P�B�� wiki �� Notion ���оǯ����C

## Smoke Test�]�����зǡ^
- n8n �i���\���� LINE ���հT���æ^�ǡC
- �Y�ϥ� Qdrant Cloud�A���� `/collections` API ���`�F�Y�ȱ� Atlas�A�i����� `/admin/setup`�C
- PowerShell `Test-Path Env:GOOGLE_API_KEY` ��ܥ��T�ȡC
- Git `git status` ���b�A�����ܧ�i���A��K���򳡸p�C

## �w���`�N
- ���_������ `.env.local`�]�����^�P���ݥ��x�����ܼƤ����F�� commit�C
- Cloudflare Tunnel ���}���ҧY�ܧ�ALINE Webhook �ݦP�B��s�C
- Render/Vercel �פJ�e�A�T�{ repo �L�K�X�ɡB�ƴ� `.env.local.sample` �Y�i�C

