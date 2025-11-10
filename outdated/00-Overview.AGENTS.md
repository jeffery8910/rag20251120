# �u�@�{�`���GVercel �� Render �����p RAG �� LINE Chatbot

���ɩw�q���鵦���F��l�ɮפ��O�����U���q�Ӹ`�C

## �֤ߥؼ�
- �H Google Gemini�BMongoDB Atlas M0 �P Next.js�]cloud-app�^���y LINE RAG �U�СC
- �P�ɷǳ� **Vercel�]Serverless API Route�^** �P **Render�]�`�n Node Web Service�^** ������p���|�A�T�O�Юץi�b���@���x�W�u�C
- �O�d�Ч��ӷ��ޥλP���ųB�z�A���� 3�V6 ���^������C

## ����Ū�]�̳��p���q�^
| ���q | Vercel & Render �@�q | Vercel ���I | Render ���I |
| --- | --- | --- | --- |
| 0. �W�� | ���� | �X | �X |
| 1. ��¦�ǳ� | `01-Setup.AGENTS.md` | �X | �X |
| 2. ���_���� | `02-Gemini-API-Key.AGENTS.md` | �X | �X |
| 3. �V�q���� | `03-Vector-Index.AGENTS.md`�]Qdrant �m�ߡ^ / `03-Vector-Index-Atlas.AGENTS.md`�]Atlas �����^ | Atlas Data API �Ѽ� | Atlas Data API + �`�n�s�u��ĳ |
| 4. �۰ʤ� & ���� | `04-n8n-Workflow.AGENTS.md`�B`05-LINE-Web-Admin.AGENTS.md` | �X | �X |
| 5. �i��P�P�B | `06-Cloud-Folder-Deploy.AGENTS.md` | �i�ֳt�ץX�� Vercel | �i���� Render �}�o�ƴ� |
| 6. �����x���p | `07-Platforms.AGENTS.md`�B`09-Cloud-Only-Atlas-Vercel-Render.AGENTS.md` | API Route ���p�P�����ܼ� | Web Service ���p�Brender.yaml |
| 7. ����t�m | `08-Full-Workflow.AGENTS.md` | �Ľ] serverless �禬 | �Ľ]�`�n�A���禬 |
| 8. �Ю� | `10-University-Workshop-Plan.AGENTS.md`�]�s�W�^ | �X | �X |

## �����|���
- **Vercel**�G�N�Ұʥi�����B�A�X API Route�C�]�w `cloud-app` �� repo �Τl�ؿ��æP�B�����ܼơC
- **Render**�G���s�u�B�i�w���C�H `render.yaml` �P `npm run build/start` �ظm�A�O�� webhook path `/api/line-webhook` �@�P�C
- ��̦@�ΡG�����ܼơBAtlas Vector Search�BGemini ���_�BLINE Messaging API�C

## �����ܼư�ǡ]�@�Ρ^
- LLM�G`GOOGLE_API_KEY`�B`EMBED_MODEL=gemini-embedding-001`�B`GEN_MODEL=gemini-2.5-flash`
- LINE�G`LINE_CHANNEL_SECRET`�B`LINE_CHANNEL_ACCESS_TOKEN`
- Atlas Data API�G`ATLAS_DATA_API_BASE`�B`ATLAS_DATA_API_KEY`�B`ATLAS_DATA_SOURCE=Cluster0`�B`ATLAS_DATABASE=ragdb`�B`ATLAS_COLLECTION=docs`�B`ATLAS_SEARCH_INDEX=vector_index`
- �˯��G`TOPK=6`�B`SCORE_THRESHOLD=0.1`�B`NUM_CANDIDATES=400`
- �޲z�G`ADMIN_TOKEN`�B`LOG_PROVIDER`�]`atlas|pg|mysql|supabase`�^�ά����s�u�r��

## ����y�{
�ϥΪ� LINE �T�� �� Vercel/Render Webhook �� Gemini �O�J �� Atlas `$vectorSearch` �� Gemini �ͦ� �� �^�� LINE�C����r�R�������T�w�^�СA��l�i�J�˯�-�ͦ��y�{�C

## ��ĳ���涶��
1. Ū���ɴx�������P�����u
2. �̧ǧ��� `01`�V`05`�]�����t�m�B�۰ʤơ^
3. ��� Qdrant�]�m�ߡ^�� Atlas�]�����^�إ߯���
4. �� `07` �P `09` �G�p Vercel�BRender�F�P�B�����ܼƻP webhook URL
5. �ϥ� `08` �禬�ݨ�ݡA�̫�H `10` �Юױa��u�@�{

## �禬�M��
- �⥭�x����b 3�V6 �����^�Шê��ӷ�
- �s�Ч��W�ǫ� 1�V5 �������i�˯�
- ���~���ҡ]Gemini/Atlas/LINE�^�ണ�Ѥ͵����ŰT��
- �޲z�ݥi�n�J `/admin` �˵����d�ˬd�B�W�ǱЧ��B�f������

