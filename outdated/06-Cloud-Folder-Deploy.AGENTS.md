# ���ݸ�Ƨ����p�]��t�^�GOneDrive/Google Drive/Dropbox + n8n CLI

## ����w��
- �@�� **�i�⫬�ƴ����**�G�N n8n + Qdrant ���]�w�P��Ʃ�J�P�B��Ƨ��A����@�x�q���ҰʡC
- �ɨ� Vercel/Render �����p�G�b�����W�u�e�αоǲ{���L�k�s���ݮɡA�i���t��Φ���סC
- �����H Windows ���ҡFmacOS/Linux �u�ݽվ���O�C

## ���䷧��
- ���ݦP�B�ȴ��ѡu�ɮ׳ƥ��v�A�B�⤴�b����o�x�����W�C
- n8n �H Node.js CLI �Φ��ҰʡA��Ʒ|�s����w�� user folder�]�w�] SQLite�^�C
- **�@���u���\\�@�x�D���Ұ� n8n**�A�קK�P�B�Ĭ�y�� DB �l���C
- �Y�̲ױĥ� Vercel/Render + Atlas�A�W�z��Ƨ��i�����ܽd�κ�� fallback�C

## �ǳƨƶ�
- �w�˨õn�J���@�P�B�A�ȡGOneDrive / Google Drive for Desktop / Dropbox�C
- �w�� Node.js 18+ �P cloudflared�]Cloudflare Tunnel�^�C

## ��ĳ��Ƨ����c
```
<SyncFolder>/rag-line-stack/
  �u�w .env
  �|�w data/
      �|�w n8n/        # n8n ���Τ��ơ]�u�@�y�B���ҡBSQLite DB�^
```

### `.env` �d��
```
# --- LLM ---
GOOGLE_API_KEY=
EMBED_MODEL=gemini-embedding-001
GEN_MODEL=gemini-2.5-flash

# --- LINE ---
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=

# --- RAG ---
TOPK=6
SCORE_THRESHOLD=0.1

# --- URLs ---
# �Ұ� cloudflared ��ƻs�{�ɤ��}���}
WEBHOOK_URL=

# --- n8n ---
N8N_ENCRYPTION_KEY=please-change-me-32+chars
TZ=Asia/Taipei
```

### �Ұʸ}���]PowerShell �d�ҡ^
�إ� `run-n8n.ps1` �� `rag-line-stack/` �ڥؿ��G
```
param(
  [string]$EnvFile = ".env"
)

if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^(?<k>[A-Za-z0-9_]+)=(?<v>.*)$') {
      $key = $Matches['k']; $value = $Matches['v'];
      [System.Environment]::SetEnvironmentVariable($key, $value)
    }
  }
}

$userFolder = Join-Path $PSScriptRoot 'data/n8n'
New-Item -ItemType Directory -Force -Path $userFolder | Out-Null

npx n8n@latest start --tunnel --port 5678 --userFolder $userFolder
```
> �Y���� n8n ���� tunnel�A�i���� `--tunnel`�A��� Cloudflare Tunnel�C

## �Ұʬy�{�]�C�x�����ۦP�^
1. �T�{ `.env` �w�P�B�����]�]�t LINE�BGemini�BAtlas�BQdrant Cloud ���s�u�]�w�^�C
2. �b `rag-line-stack` ���}�� PowerShell�A����G
   - `./run-n8n.ps1`
3. �����Ұʷ|�۰ʫإ� `data/n8n`�C���s�����}�� `http://localhost:5678/` �i�J n8n�C

## ���o���}���}�]Cloudflare Tunnel�^
1. �s�}�׺ݰ��� `cloudflared tunnel --url http://localhost:5678`
2. �ƻs��ܪ� `https://xxxx.trycloudflare.com`
3. ��s `.env` �� `WEBHOOK_URL` �᭫�s�Ұ� `run-n8n.ps1`

## �]�w LINE Webhook
- LINE ��x �� Webhook URL�G`https://xxxx.trycloudflare.com/line/webhook`
- �ҥ� Webhook�A���� Verify �ΥH������աC

## �����ܨ�L�q��
1. �T�O�Ĥ@�x�q���w���� `run-n8n.ps1` �P cloudflared�C
2. �ݦP�B������A�b�ĤG�x�q�����ƱҰʬy�{�C
3. ���s���ͷs Tunnel URL�A��s `.env` �P LINE Webhook�C

## �ƥ��P�_��
- �u�@�y�B���ҡBDB �Ҧb `data/n8n`�A�P�B�A�Ȥw�ƴ��C
- ��ĳ���w���ץX `workflows.json` �H���P�B�Ĭ�C

## ����P��ĳ
- �K�O quick tunnel URL �C�����ҳ��|�ܡF�Y�ݭní�w����A�i�� Cloudflare named tunnel�]�ݦ۳ƺ���^�C
- �����h�H�P�ɾާ@���A�X SQLite + �P�B�F�Y��V�`�n���ݡA��ĳ��� cloud-app + Atlas �� Render n8n�C
- �Y�ݭn�P Vercel/Render �O���@�P�A�i�b n8n �̧�� Atlas Data API �� Qdrant Cloud REST�A��{�P�@�M�����ܼơC

## �P��L�ɮת�����
- `04-n8n-Workflow.AGENTS.md`�G�`�I�t�m�ۦP�A�i�N `QDRANT_API_URL` �� `http://qdrant:6333`�C
- `05-LINE-Web-Admin.AGENTS.md`�G�p�H n8n Webhook �إߺ޲z�����A�i�u�� `WEBHOOK_URL` �U�����ѡC
- `09-Cloud-Only-Atlas-Vercel-Render.AGENTS.md`�G���A�ǳƦn���ݱ`�n���p�A�i�����飼 Vercel/Render + Atlas ���u�C

