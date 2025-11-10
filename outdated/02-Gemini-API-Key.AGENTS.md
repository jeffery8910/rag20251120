# ���o�P���� Google Gemini API Key�]�K�O�B�ס^

## �ؼ�
- �ӽ� Google AI Studio API Key�A�����u�O�J�v�P�u�ͦ��v���ҡC
- �O���V�q���ס]Atlas Vector Search �P Vercel/Render �һݡ^�C
- �إ߸󥭥x���_�޲z�G�����]n8n �m�ߡ^�BVercel�BRender�BGitHub�C

## �ӽлP�O�s�]�K�O�^
1. �e�� [Google AI Studio](https://aistudio.google.com/) �� �إ� API Key�C
2. �ߧY�ƻs�üȦs��w����m�C
3. �]�w�����ܼơG
   - �����GPowerShell `setx GOOGLE_API_KEY <key>` �� `.env.local`
   - Vercel�GProject Settings �� Environment Variables �� `GOOGLE_API_KEY`
   - Render�GDashboard �� Environment �� `GOOGLE_API_KEY`
4. ��s `cloud-app/.env.local.sample`�]�ȯd�� placeholder�A���n��J��ڭȡ^�C

## �ҫ���ĳ�]�i�H�a�Ͻվ�^
- �O�J�G`gemini-embedding-001`
- �ͦ��G`gemini-2.5-flash`
- �Y�t�B�����A�i��γ̷s�uflash�v�Ρupro�v�t�C���K�O�h�šC

## �̤p���ҫ��O
> Windows PowerShell ���FmacOS/Linux �N `%GOOGLE_API_KEY%` �令 `$GOOGLE_API_KEY`�C

### �O�J
```
curl -X POST \
  -H "x-goog-api-key: %GOOGLE_API_KEY%" \
  -H "Content-Type: application/json" \
  https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent \
  -d "{\n    \"model\": \"models/gemini-embedding-001\",\n    \"content\": { \"parts\": [ { \"text\": \"�o�O�@�q���դ奻\" } ] },\n    \"taskType\": \"RETRIEVAL_DOCUMENT\"\n  }"
```
- �禬�G�^�� JSON ���� `embedding.values`�A�ðO������ס]�ҡG768�^�C
- �N�����׶�J Atlas ���ޡBQdrant collection �]�w�C

### �ͦ�
```
curl -X POST \
  -H "x-goog-api-key: %GOOGLE_API_KEY%" \
  -H "Content-Type: application/json" \
  https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent \
  -d "{\n    \"contents\": [ { \"role\": \"user\", \"parts\": [ { \"text\": \"�Хu�^�СGOK\" } ] } ]\n  }"
```
- �禬�G�^�Ǥ��e�t `OK` �������奻�A���� 1�V3 ���C

## ���x��X��ĳ
- **Vercel**�G�� Project Settings �s�W `GOOGLE_API_KEY`�F�G�p��i�z�L `/admin/setup` ���աC
- **Render**�G�b�A�Ȫ� Environment ������J `GOOGLE_API_KEY`�C���s���p��O�o�I���uManual Deploy�v���ܧ�ͮġC
- **n8n**�GHTTP Request �`�I header `x-goog-api-key={{$env.GOOGLE_API_KEY}}`�ATimeout 10000 ms�ARetry-on-fail 2�V3 ���C

## �`�����~�P�ƿ�
- `401/403`�G���_���~�εL�s���v �� ���� Key�F�T�{ header �W�٧����ŦX�C
- `400`�GBody �榡���~ �� �]�֤޸��B����P JSON ���c�C
- `429`�G�F��t�v���� �� �Ұ� Retry-on-fail�]���ưh�ס^�Χ�Χ󰪵��żҫ��C
- `503`�G�ȮɩʪA�Ȱ��D �� ���𭫸աA�O�d���Ŧ^�СC

