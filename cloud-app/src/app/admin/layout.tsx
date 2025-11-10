"use client";
import React from 'react';
import AdminGate from './AdminGate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <div style={{marginBottom:12, display:'flex', gap:12, alignItems:'center'}}>
        <a href="/admin">管理介面</a>
        <a href="/admin/conversations">對話紀錄</a>
        <div style={{marginLeft:'auto', fontSize:12, color:'#94a3b8'}}>
          已登入
          <button style={{marginLeft:8}} onClick={()=>{ localStorage.removeItem('adminToken'); location.reload(); }}>登出</button>
        </div>
      </div>
      {children}
    </AdminGate>
  );
}
