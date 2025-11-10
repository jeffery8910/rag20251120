"use client";
import { useEffect, useMemo, useState } from 'react';
import Overlay from '@/components/Overlay';
import AdminGate from '../AdminGate';

export default function ConversationsPage(){
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [limit, setLimit] = useState(50);
  const auth = useMemo(()=> ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  useEffect(()=>{ setToken(localStorage.getItem('adminToken')||''); },[]);

  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    const qs = new URLSearchParams({ limit: String(limit) });
    if (userId) qs.append('userId', userId);
    if (channelId) qs.append('channelId', channelId);
    if (q) qs.append('q', q);
    if (from) qs.append('from', from);
    if (to) qs.append('to', to);
    const res = await fetch(`/api/admin/conversations?${qs}`, { headers: { ...auth.headers } });
    if (!res.ok) { setLoading(false); return alert('讀取失敗/未授權'); }
    const j = await res.json(); setItems(j.conversations || []);
    setLoading(false);
  };

  useEffect(()=>{ if (token) load(); }, [token]);

  return (
    <AdminGate>
    <div>
      <div className="card">
        <div className="title">對話紀錄</div>
        <div className="row">
          <div className="col"><label>使用者 ID（可留空）</label><input value={userId} onChange={e=>setUserId(e.target.value)} placeholder="LINE userId 可留空" /></div>
          <div className="col"><label>Channel（可留空）</label><input value={channelId} onChange={e=>setChannelId(e.target.value)} placeholder="user/group/room 或留空" /></div>
          <div className="col"><label>數量</label><input type="number" value={limit} onChange={e=>setLimit(Number(e.target.value))} /></div>
        </div>
        <div className="row">
          <div className="col"><label>關鍵字</label><input value={q} onChange={e=>setQ(e.target.value)} placeholder="全文搜尋" /></div>
          <div className="col"><label>起始（ISO）</label><input value={from} onChange={e=>setFrom(e.target.value)} placeholder="2025-01-01T00:00:00Z" /></div>
          <div className="col"><label>結束（ISO）</label><input value={to} onChange={e=>setTo(e.target.value)} placeholder="2025-12-31T23:59:59Z" /></div>
          <div className="col"><label>&nbsp;</label><button className={`primary ${loading?'btnloading':''}`} disabled={loading} onClick={load}>{loading? <span className='spinner'/>:null} {loading?'載入中…':'重新載入'}</button></div>
        </div>
        <table>
          <thead><tr><th>時間</th><th>方向</th><th>類型</th><th>使用者</th><th>內容</th></tr></thead>
          <tbody>
            {items.map((r, i)=> (
              <tr key={i} onClick={()=> window.open(`/admin/conversations/${encodeURIComponent(r.id)}`, '_blank')} style={{cursor:'pointer'}}>
                <td>{r.ts}</td>
                <td>{r.direction}</td>
                <td>{r.type}</td>
                <td>{r.userId || '-'}</td>
                <td style={{whiteSpace:'pre-wrap'}}>{r.text || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <Overlay show={loading} message="載入對話紀錄…" />
    </AdminGate>
  );
}
