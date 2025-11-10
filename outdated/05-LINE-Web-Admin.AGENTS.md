# LINE �]�w�P Web �޲z�����]�K�O�^

## �ؼ�
- �ֳt���� LINE Messaging API ��D�]�w�A�ѥ��� n8n �t�m�P cloud-app�]Vercel��Render�^���p�@�ΡC
- �T�O webhook�B����r���y�BRAG �^���޿�b��ӥ��x�O���@�P�C
- ���� `cloud-app` ���� `/admin` �������@�Ч��B���ܵ��P�����C

## �إ� Channel�]�}�o�γ~�K�O�^
1. �e�� [LINE Developers Console](https://developers.line.biz/) �إ� Messaging API Channel�C
2. ���o�G
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
3. �N������ܼƥ[�J�G
   - ���� n8n�]�t�m�^�G�����ܼƩ� Credentials
   - Vercel / Render�G�M�������ܼƦC��
   - `cloud-app/.env.local.sample` �O�d���]�ФŶ�J��ڭȡ^

## Webhook �]�w
- �������աG�ϥ� Cloudflare Tunnel �� `https://xxxx.trycloudflare.com/line/webhook`
- Vercel�G`https://<project>.vercel.app/api/line-webhook`
- Render�G`https://<service>.onrender.com/api/line-webhook`
- �C�����p�� Tunnel ��s��A�ݦb LINE ��x���s�]�w�ë��uVerify�v�C

## ����r + RAG �@�s����
- ����r�զW��i���b n8n �t�m�A�̲צb cloud-app `/admin` �������@�C
- cloud-app �w�]�欰�]`src/app/api/line-webhook/route.ts` �P `src/lib/rag.ts`�^�G
  - ����r�R�� �� �^�T�w�ҪO�C
  - ��L�T�� �� RAG �y�{�]Gemini �� Atlas �� Gemini �� Reply�^�C
- �Y�ݭn�X�R�T�w�^�СA�i�b `/admin` �վ�����]�w�Χ�s��Ʈw�C

## Web �޲z�����]cloud-app�^
- `/admin`�G�n�J��i�]�w Prompt�B����r�B�����ˬd�C
- `/admin/docs`�G�W�ǱЧ� �� �۰ʤ����B�O�J�B�g�J Atlas�C
- `/admin/conversations`�G�˵��P�j�M��ܬ����C
- �G�p�� Vercel/Render ��Y��i�ΡF���� `npm run dev` �]�i�ϥΡC

## ���Q�۫غ޲z�ݪ��ﶵ�]�K�O�^
1. **n8n Webhook API + �R�A��**�]GitHub Pages ���^�G
   - `POST /admin/docs`�G�W�Ǥ奻 �� ���� �� �O�J �� upsert
   - `PUT /admin/prompt`�G��s�t�δ���
   - `PUT /admin/keywords`�G��s����r�զW��
   - `GET /admin/logs`�G�d�ߪ���^��
2. **n8n Form/Manual Trigger**�G�̤p�i��A�Ұ�t�m�ɥi���Ĳ�o�C

## �禬�n�I
- Webhook Verify ���\�FLINE �T���i�� 3�V6 �����^�СC
- �s�Ч��z�L `/admin/docs` �W�ǫ�A�Ƥ������i�Q RAG �^�ФޥΡC
- �L�� Vercel �� Render�A�޲z�����e�{�@�P�F�����ܼƯʥ��|�b `/admin/setup` ��ܡC

## �w����ĳ
- ���_�l���x�s�b�����ܼơF�� commit `.env.local`�]�ȴ��� `.env.local.sample`�^�C
- �޲z�ݻݳ]�w `ADMIN_TOKEN`�A�éw���󴫡C
- �Ͳ����q�����ҥ� LINE ñ�����ҡ]cloud-app ���w��@�^�C

