"use client";
import { useEffect, useMemo, useState } from 'react';
import AdminGate from './AdminGate';
import Overlay from '@/components/Overlay';
import Info from '@/components/Info';

type Config = { prompt: string; keywords: string[]; TOPK: number; SCORE_THRESHOLD: number; NUM_CANDIDATES: number };

export default function AdminPage(){
  const [token, setToken] = useState<string>('');
  const [cfg, setCfg] = useState<Config>({ prompt: '', keywords: [], TOPK: 6, SCORE_THRESHOLD: 0.1, NUM_CANDIDATES: 400 });
  const [q, setQ] = useState('請輸入一個測試問題');
  const [answer, setAnswer] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const auth = useMemo(()=> ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  useEffect(()=>{
    const t = localStorage.getItem('adminToken') || '';
    setToken(t);
    // 讀取現有設定（未授權時忽略錯誤）
    fetch('/api/admin/config').then(r=>r.json()).then(setCfg).catch(()=>{});
  },[]);

  const saveToken = () => { localStorage.setItem('adminToken', token); alert('已保存 Admin Token（僅此瀏覽器）'); };

  const [savingCfg, setSavingCfg] = useState(false);
  const saveConfig = async () => {
    try {
      setSavingCfg(true);
      const res = await fetch('/api/admin/config', { method:'PUT', headers:{ 'content-type':'application/json', ...auth.headers }, body: JSON.stringify(cfg) });
      if (!res.ok) return alert('儲存失敗');
      const j = await res.json(); setCfg(j); alert('設定已更新');
    } finally { setSavingCfg(false); }
  };

  const [pasting, setPasting] = useState(false);
  const uploadDoc = async (content: string, source: string, page?: number, section?: string) => {
    try {
      setPasting(true);
      const res = await fetch('/api/admin/docs', { method:'POST', headers:{ 'content-type':'application/json', ...auth.headers }, body: JSON.stringify({ content, source, page, section }) });
      if (!res.ok) return alert('上傳失敗');
      const j = await res.json(); alert(`已寫入 ${j.inserted} 個分塊`);
      // 上傳成功後刷新來源清單
      loadSources();
    } finally { setPasting(false); }
  };

  const [testing, setTesting] = useState(false);
  const runTest = async () => {
    setAnswer(''); setTesting(true);
    try {
      const res = await fetch('/api/test', { method:'POST', headers:{ 'content-type':'application/json', ...auth.headers }, body: JSON.stringify({ question: q }) });
      if (!res.ok) return setAnswer('請求失敗/未授權');
      const j = await res.json(); setAnswer(j.answer || '(無內容)');
    } finally { setTesting(false); }
  };

  const [loadingLogs, setLoadingLogs] = useState(false);
  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch('/api/admin/logs?limit=50', { headers: { ...auth.headers } });
      if (!res.ok) return alert('讀取日誌失敗/未授權');
      const j = await res.json(); setLogs(j.logs || []);
    } finally { setLoadingLogs(false); }
  };

  const [docText, setDocText] = useState('');
  const [docSource, setDocSource] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [chunkSize, setChunkSize] = useState(800);
  const [overlap, setOverlap] = useState(120);
  const [manageSource, setManageSource] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  const loadSources = async () => {
    try {
      setLoadingSources(true);
      const res = await fetch('/api/admin/docs/sources', { headers: { ...auth.headers } });
      if (!res.ok) return;
      const j = await res.json();
      setSources(Array.isArray(j.sources)? j.sources : []);
    } finally { setLoadingSources(false); }
  };
  useEffect(()=>{ if (token) loadSources(); }, [token]);
  const [managing, setManaging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadReport, setUploadReport] = useState<any|null>(null);
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); alert('已複製到剪貼簿'); } catch {} };
  const uploadFiles = async () => {
    if (!files?.length) return alert('請先選擇檔案');
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    fd.append('chunkSize', String(chunkSize));
    fd.append('overlap', String(overlap));
    setUploading(true); setUploadPct(0); setUploadMsg('開始上傳…'); setUploadReport(null);
    await new Promise<void>((resolve)=>{
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/docs/upload', true);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadPct(pct);
          setUploadMsg(`已上傳 ${(e.loaded/1024/1024).toFixed(2)} MB / ${(e.total/1024/1024).toFixed(2)} MB`);
        } else {
          setUploadMsg('正在上傳…');
        }
      };
      xhr.onerror = () => {
        setUploading(false);
        setUploadMsg('網路錯誤，請稍後再試');
        resolve();
      };
      xhr.onload = () => {
        setUploading(false);
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const j = JSON.parse(xhr.responseText || '{}');
            setUploadReport(j);
            const okList = (j.results||[]).map((r:any)=> `${r.file}：${r.inserted}`);
            const errList = (j.errors||[]).map((e:any)=> `${e.file}：${e.error}`);
            setUploadMsg(`總寫入 ${j.totalInserted||0} 個分塊。` + (errList.length? ` 錯誤：${errList.length} 件` : ''));
            // 上傳成功後刷新來源清單
            loadSources();
          } else {
            setUploadMsg(`上傳失敗：${xhr.responseText || xhr.statusText || xhr.status}`);
          }
        } catch (e:any) {
          setUploadMsg(`解析回應失敗：${e?.message||e}`);
        }
        resolve();
      };
      xhr.send(fd);
    });
  };

  return (
    <AdminGate>
    <div>
      <div className="card"><div><a href="/admin/conversations">→ 對話紀錄（瀏覽/搜尋/明細）</a></div></div>

      <div className="card">
        <div className="title">2) 系統設定（Prompt / 關鍵字 / 檢索參數）</div>
        <div className="grid">
          <div>
            <label>系統提示（Prompt）</label>
            <textarea rows={8} value={cfg.prompt} onChange={e=>setCfg({...cfg, prompt: e.target.value})} />
          </div>
          <div>
            <label>關鍵字清單（以半形逗號分隔） <Info text={'以"字元數"計算（不是 tokens）。中文多數 1 字 = 1 字元；emoji/少數符號可能算 2。建議 600–1000 字，太小上下文不足、太大速度變慢。詳見 docs/retrieval-parameters.md'} /></label>
            <input value={cfg.keywords.join(',')} onChange={e=>setCfg({...cfg, keywords: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
            <div className="row">
              <div className="col"><label>TOPK <Info text="每次檢索返回的片段數。越大涵蓋越多，但速度較慢、可能引入雜訊。建議 4–8。"/></label><input type="number" value={cfg.TOPK} onChange={e=>setCfg({...cfg, TOPK: Number(e.target.value)})} /></div>
              <div className="col"><label>SCORE_THRESHOLD <Info text="相似度分數門檻（0–1）。低於門檻的片段會被過濾。噪音多→調高，常找不到→調低。建議 0.10–0.30。"/></label><input type="number" step="0.01" value={cfg.SCORE_THRESHOLD} onChange={e=>setCfg({...cfg, SCORE_THRESHOLD: Number(e.target.value)})} /></div>
              <div className="col"><label>NUM_CANDIDATES <Info text="Atlas Vector Search 使用：候選數量，越多結果更穩定但較慢。建議 200–800。Qdrant 可忽略。"/></label><input type="number" value={cfg.NUM_CANDIDATES} onChange={e=>setCfg({...cfg, NUM_CANDIDATES: Number(e.target.value)})} /></div>
            </div>
            <div style={{marginTop:8}}><button className={`primary ${savingCfg?'btnloading':''}`} disabled={savingCfg} onClick={saveConfig}>{savingCfg? <span className="spinner"/>:null} {savingCfg? '保存中…':'保存設定'}</button></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="title">3) 上傳進度</div>
        {!uploading && !uploadReport && (<div className="hint">選擇檔案並按「上傳」後會顯示進度。</div>)}
        {uploading && (
          <div>
            <label>進度</label>
            <progress value={uploadPct} max={100} style={{ width:'100%' }} />
            <div className="hint">{ uploadPct<100 ? (uploadMsg || `${uploadPct}%`) : '伺服器處理中（分塊/嵌入/寫入向量）…' }</div>
          </div>
        )}
        {uploadReport && (
          <div>
            <div className="hint">{uploadMsg}</div>
            <div style={{marginTop:8}}>
              <div>總寫入：{uploadReport.totalInserted||0}</div>
              <div>成功：{Array.isArray(uploadReport.results)? uploadReport.results.length : 0}</div>
              <div>錯誤：{Array.isArray(uploadReport.errors)? uploadReport.errors.length : 0}</div>
            </div>
            {Array.isArray(uploadReport.results) && uploadReport.results.length>0 && (
              <div style={{marginTop:8}}>
                <div className="title">成功清單</div>
                <table>
                  <thead><tr><th>檔名</th><th>分塊數</th></tr></thead>
                  <tbody>
                    {uploadReport.results.map((r:any, i:number)=> (
                      <tr key={i}><td>{r.file}</td><td>{r.inserted}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {Array.isArray(uploadReport.errors) && uploadReport.errors.length>0 && (
              <div style={{marginTop:8}}>
                <div className="title">錯誤清單</div>
                <table>
                  <thead><tr><th>檔名</th><th>錯誤</th></tr></thead>
                  <tbody>
                    {uploadReport.errors.map((e:any, i:number)=> (
                      <tr key={i}><td>{e.file}</td><td style={{whiteSpace:'pre-wrap'}}>{e.error}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="row" style={{marginTop:8}}>
                  <div className="col"><button onClick={()=>copy(JSON.stringify(uploadReport, null, 2))}>複製原始回應（JSON）</button></div>
                  <div className="col"><button onClick={()=>{ setUploadReport(null); setUploadMsg(''); }}>清除</button></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="title">3) 上傳教材（檔案上傳：PDF / TXT / MD）</div>
        <div className="row">
          <div className="col"><label>選擇檔案（可多選）</label><input type="file" accept=".pdf,.txt,.md,.docx" multiple onChange={e=> setFiles(Array.from(e.target.files||[]))} /></div>
          <div className="col"><label>分塊大小 <Info text={'以"字元數"計算（不是 tokens）。中文多數 1 字 = 1 字元；emoji/少數符號可能算 2。建議 600–1000 字，太小上下文不足、太大速度變慢。詳見 docs/retrieval-parameters.md'}/></label><input type="number" value={chunkSize} onChange={e=> setChunkSize(Number(e.target.value))} /></div>
          <div className="col"><label>重疊 <Info text="相鄰分塊之間的重疊字數，避免句子被切開。建議為分塊大小的 10–20%。"/></label><input type="number" value={overlap} onChange={e=> setOverlap(Number(e.target.value))} /></div>
        </div>
        <div className="row"><div className="col"><button className={`primary ${uploading?'btnloading':''}`} disabled={uploading} onClick={uploadFiles}>{uploading? <span className="spinner"/>:null} {uploading? '上傳中…':'送出並寫入向量庫'}</button></div></div>
        <div className="hint">說明：伺服器自動將檔案轉為文字並分塊後嵌入。支援 .pdf/.txt/.md/.docx；可一次上傳多檔，後端將串行處理以配合免費速率限制。</div>
      </div>

      <div className="card">
        <div className="title">4) 上傳教材（貼上純文字）</div>
        <div className="row">
          <div className="col"><label>來源檔名（會顯示於引用）</label><input value={docSource} onChange={e=>setDocSource(e.target.value)} /></div>
          <div className="col"><label>貼上教材內容（建議 .txt/.md） <Info text="此路徑使用預設切分參數：size=800、overlap=120（以字元數計算）。大型文件建議使用『檔案上傳』以自訂參數。"/></label><textarea rows={8} value={docText} onChange={e=>setDocText(e.target.value)} placeholder="貼上純文字；PDF 請先轉成文字檔。" /></div>
        </div>
        <div className="hint">更多說明：<a href="https://github.com/jeffery891010/RAGWorkshop/blob/main/docs/retrieval-parameters.md" target="_blank">檢索與切分參數指南</a></div>
        <div className="row">
          <div className="col"><button className={`primary ${pasting?'btnloading':''}`} disabled={pasting} onClick={()=>uploadDoc(docText, docSource)}>{pasting? <span className="spinner"/>:null} {pasting? '寫入中…':'送出並寫入向量庫'}</button></div>
        </div>
      </div>

      <div className="card">
        <div className="title">5) 線上測試（不經 LINE）</div>
        <div className="row">
          <div className="col"><label>問題</label><input value={q} onChange={e=>setQ(e.target.value)} /></div>
          <div className="col"><label>&nbsp;</label><button className={`primary ${testing?'btnloading':''}`} disabled={testing} onClick={runTest}>{testing? <span className="spinner"/>:null} {testing? '生成中…':'送出測試'}</button></div>
        </div>
        <label>回覆</label>
        <textarea rows={6} readOnly value={answer} />
      </div>

      <div className="card">
        <div className="title">6) 資料管理（刪除 / 重嵌 / 清空集合）</div>
        <div className="row">
          <div className="col"><label>來源檔名</label>
            <select value={manageSource} onChange={e=>setManageSource(e.target.value)}>
              <option value="">（請選擇來源）</option>
              {sources.map((s,i)=> (<option key={i} value={s}>{s}</option>))}
            </select>
            <div className="row" style={{marginTop:6}}>
              <div className="col" style={{flex:'0 0 auto'}}>
                <button className={`${loadingSources?'btnloading':''}`} disabled={loadingSources} onClick={loadSources}>{loadingSources? <span className="spinner"/>:null} {loadingSources? '刷新中…':'重新整理來源'}</button>
              </div>
              <div className="col" style={{flex:'1 1 auto'}}>
                <div className="hint" style={{marginTop:6}}>{loadingSources? '讀取來源中…' : `共 ${sources.length} 個來源`}</div>
              </div>
            </div>
          </div>
          <div className="col"><label>&nbsp;</label><button className={`${managing?'btnloading':''}`} disabled={managing} onClick={async ()=>{
            if (!manageSource) return alert('請輸入來源檔名');
            if (!confirm(`確定刪除來源「${manageSource}」的所有分塊？此動作無法還原。`)) return;
            setManaging(true);
            try{
              const res = await fetch(`/api/admin/docs?source=${encodeURIComponent(manageSource)}`, { method:'DELETE', headers: { ...auth.headers } });
              if (!res.ok) return alert('刪除失敗/未授權');
              alert('刪除完成');
              // 刪除後刷新來源清單
              setManageSource('');
              loadSources();
            } finally { setManaging(false); }
          }}>刪除此來源</button></div>
          <div className="col"><label>&nbsp;</label><button className={`${managing?'btnloading':''}`} disabled={managing} onClick={async ()=>{
            if (!manageSource) return alert('請輸入來源檔名');
            if (!confirm(`將重新為來源「${manageSource}」所有分塊產生嵌入，可能需要時間。要繼續嗎？`)) return;
            setManaging(true);
            try{
              const res = await fetch('/api/admin/docs/reembed', { method:'POST', headers: { 'content-type':'application/json', ...auth.headers }, body: JSON.stringify({ source: manageSource }) });
              if (!res.ok) return alert('重嵌失敗/未授權');
              const j = await res.json();
              alert(`重嵌完成，共處理 ${j.reembedded} 個分塊`);
            } finally { setManaging(false); }
          }}>重新嵌入此來源</button></div>
        </div>
        <div className="row">
          <div className="col"><label>清空向量集合</label><button className={`danger ${managing?'btnloading':''}`} disabled={managing} onClick={async ()=>{
            if (!confirm('將清空整個向量集合（或 Atlas docs 集合）。確定繼續？')) return;
            setManaging(true);
            try{
              const res = await fetch('/api/admin/vector/clear', { method:'POST', headers: { ...auth.headers } });
              if (!res.ok) return alert('清空失敗/未授權');
              alert('已清空集合');
              setManageSource('');
              loadSources();
            } finally { setManaging(false); }
          }}>清空集合</button></div>
        </div>
      </div>

      <div className="card">
        <div className="title">7) 日誌</div>
        <div className="row"><div className="col"><button className={`${loadingLogs?'btnloading':''}`} disabled={loadingLogs} onClick={loadLogs}>{loadingLogs? <span className="spinner"/>:null} {loadingLogs? '載入中…':'重新載入'}</button></div></div>
        <table>
          <thead><tr><th>時間</th><th>類型</th><th>問題</th><th>摘要</th></tr></thead>
          <tbody>
            {logs.map((l, i)=> (
              <tr key={i}>
                <td>{l.ts}</td>
                <td>{l.type}</td>
                <td>{l.q||'-'}</td>
                <td>{l.error|| (l.hits? `${l.hits.length} hits`: '-')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <Overlay show={uploading || pasting || testing || savingCfg || loadingLogs || managing} message={
      uploading ? (uploadPct<100 ? '檔案上傳中…' : '伺服器處理中（分塊/嵌入/寫入向量）…') :
      pasting ? '寫入中…' :
      testing ? '生成回覆中…' :
      savingCfg ? '保存設定中…' :
      loadingLogs ? '載入日誌…' :
      managing ? '執行資料管理操作…' : '處理中…'
    } />
    </AdminGate>
  );
}
