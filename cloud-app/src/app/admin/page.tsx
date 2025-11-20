"use client";
import { useEffect, useMemo, useState } from "react";
import AdminGate from "./AdminGate";
import Overlay from "@/components/Overlay";
import Info from "@/components/Info";
import Tabs from "@/components/Tabs";
import ConfigPanel from "@/components/ConfigPanel";
import UploadPanel from "@/components/UploadPanel";
import TextUploadPanel from "@/components/TextUploadPanel";
import TestPanel from "@/components/TestPanel";
import DataManagementPanel from "@/components/DataManagementPanel";
import LogsPanel from "@/components/LogsPanel";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import Toast from "@/components/Toast";

type Config = {
  prompt: string;
  keywords: string[];
  TOPK: number;
  SCORE_THRESHOLD: number;
  NUM_CANDIDATES: number;
  forwardToN8nUrl?: string;
  forwardRule?: string;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function AdminPage() {
  const [token, setToken] = useState<string>("");
  const [cfg, setCfg] = useState<Config>({
    prompt: "",
    keywords: [],
    TOPK: 6,
    SCORE_THRESHOLD: 0.35,
    NUM_CANDIDATES: 400,
    forwardToN8nUrl: "",
    forwardRule: "",
  });
  const [q, setQ] = useState("請總結這份教材的三個重點並列出來源頁碼");
  const [answer, setAnswer] = useState("");
  const [structured, setStructured] = useState<any>(null);
  const [mode, setMode] = useState<
    "summary" | "quiz" | "bullets" | "suggestions" | "table" | "timeline"
  >("summary");
  const [userId, setUserId] = useState<string>("teacher");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("adminToken") || "";
    setToken(t);
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => {});
  }, []);

  const saveToken = () => {
    localStorage.setItem("adminToken", token);
    showToast("已保存 Admin Token，下次自動填入。", "success");
  };

  const [savingCfg, setSavingCfg] = useState(false);
  const saveConfig = async () => {
    try {
      setSavingCfg(true);
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "content-type": "application/json", ...auth.headers },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) return showToast("設定儲存失敗", "error");
      const j = await res.json();
      setCfg(j);
      showToast("設定已儲存", "success");
    } finally {
      setSavingCfg(false);
    }
  };

  const [pasting, setPasting] = useState(false);
  const uploadDoc = async (
    content: string,
    source: string,
    page?: number,
    section?: string
  ) => {
    try {
      setPasting(true);
      const res = await fetch("/api/admin/docs", {
        method: "POST",
        headers: { "content-type": "application/json", ...auth.headers },
        body: JSON.stringify({ content, source, page, section }),
      });
      if (!res.ok) return showToast("插入失敗", "error");
      const j = await res.json();
      showToast(`已插入 ${j.inserted} 筆分塊`, "success");
      loadSources();
    } finally {
      setPasting(false);
    }
  };

  const [testing, setTesting] = useState(false);
  const runTest = async (customQuestion?: string, customMode?: typeof mode) => {
    const ask = (customQuestion ?? q).trim();
    if (!ask) return;
    const useMode = customMode ?? mode;
    setAnswer("");
    setStructured(null);
    setTesting(true);
    setMessages((prev) => [...prev, { role: "user", content: ask }]);
    try {
      const res = await fetch("/api/test", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...auth.headers,
        },
        body: JSON.stringify({ question: ask, mode: useMode, userId }),
      });
      if (!res.ok) {
        setAnswer("測試失敗，請確認環境變數或後端日誌。");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "測試失敗，請檢查設定或日誌。" },
        ]);
        return;
      }
      const j = await res.json();
      const ans = j.answer || "(未取得答案，請查看日誌)";
      setAnswer(ans);
      if (j.structured) setStructured(j.structured);
      setMessages((prev) => [...prev, { role: "assistant", content: ans }]);
    } finally {
      setTesting(false);
    }
  };

  const [loadingLogs, setLoadingLogs] = useState(false);
  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch("/api/admin/logs?limit=50", {
        headers: { ...auth.headers },
      });
      if (!res.ok) return showToast("讀取日誌失敗", "error");
      const j = await res.json();
      setLogs(j.logs || []);
    } finally {
      setLoadingLogs(false);
    }
  };

  const [docText, setDocText] = useState("");
  const [docSource, setDocSource] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [chunkSize, setChunkSize] = useState(800);
  const [overlap, setOverlap] = useState(120);
  const [manageSource, setManageSource] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  const loadSources = async () => {
    try {
      setLoadingSources(true);
      const res = await fetch("/api/admin/docs/sources", {
        headers: { ...auth.headers },
      });
      if (!res.ok) return;
      const j = await res.json();
      setSources(Array.isArray(j.sources) ? j.sources : []);
    } finally {
      setLoadingSources(false);
    }
  };
  useEffect(() => {
    if (token) loadSources();
  }, [token]);

  const [managing, setManaging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadReport, setUploadReport] = useState<any | null>(null);

  const uploadFiles = async () => {
    if (!files?.length) return showToast("請選擇檔案", "warning");
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    fd.append("chunkSize", String(chunkSize));
    fd.append("overlap", String(overlap));
    setUploading(true);
    setUploadPct(0);
    setUploadMsg("上傳中…");
    setUploadReport(null);
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/docs/upload", true);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadPct(pct);
          setUploadMsg(
            `已上傳 ${(e.loaded / 1024 / 1024).toFixed(2)} MB / ${(e.total /
              1024 /
              1024
            ).toFixed(2)} MB`
          );
        } else {
          setUploadMsg("上傳中…");
        }
      };
      xhr.onerror = () => {
        setUploading(false);
        setUploadMsg("上傳失敗，請重試");
        resolve();
      };
      xhr.onload = () => {
        setUploading(false);
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const j = JSON.parse(xhr.responseText || "{}");
            setUploadReport(j);
            const errList = (j.errors || []).map(
              (e: any) => `${e.file}：${e.error}`
            );
            setUploadMsg(
              `已插入 ${j.totalInserted || 0} 筆分塊` +
                (errList.length ? `，有 ${errList.length} 筆錯誤` : "")
            );
            loadSources();
          } else {
            setUploadMsg(
              `上傳失敗：${xhr.responseText || xhr.statusText || xhr.status}`
            );
          }
        } catch (e: any) {
          setUploadMsg(`解析回應失敗：${e?.message || e}`);
        }
        resolve();
      };
      xhr.send(fd);
    });
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const quickPrompts = [
    {
      label: "摘要",
      question:
        "請產生 JSON：{ \"summary\": \"200 字摘要\", \"bullets\": [\"重點1\",\"重點2\",\"重點3\"], \"sources\": [{\"title\":\"\",\"page\":0}] }，不要加入教材外資訊。",
    },
    {
      label: "單選題",
      question:
        "請依教材出 3 題單選題，JSON 陣列格式：[{\"question\":\"\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"answer\":\"A\",\"explanation\":\"\"}]，不要編造教材沒有的資訊。",
    },
    {
      label: "條列筆記",
      question:
        "請輸出 5 條條列筆記並附來源頁碼，格式：{\"notes\":[{\"text\":\"\",\"page\":0}]}，保持精簡且引用教材。",
    },
    {
      label: "學習建議",
      question:
        "假設讀者是初學者，請給 5 條下一步學習建議並附來源頁碼，格式：{\"next_steps\":[{\"advice\":\"\",\"page\":0}]}。",
    },
    {
      label: "表格",
      question:
        "請以表格輸出關鍵資訊，格式：{\"table\":{\"headers\":[\"欄位1\",\"欄位2\",\"欄位3\"],\"rows\":[[\"值11\",\"值12\",\"值13\"]],\"source\":{\"title\":\"\",\"page\":0}}}，內容僅能引用教材。",
    },
    {
      label: "時間線",
      question:
        "請整理教材中的事件成時間線，格式：{\"timeline\":[{\"title\":\"事件\",\"date\":\"YYYY-MM-DD\",\"detail\":\"描述\",\"page\":0}]}，不要杜撰日期。",
    },
  ];

  const modeDefaults: Record<
    "summary" | "quiz" | "bullets" | "suggestions" | "table" | "timeline",
    string
  > = {
    summary:
      '請產生 JSON：{ "summary": "200 字摘要", "bullets": ["重點1","重點2","重點3"], "sources": [{"title":"","page":0}] }，不要加入教材外資訊。',
    quiz:
      '請依教材出 3 題單選題，JSON 陣列格式：[{"question":"","options":["A","B","C","D"],"answer":"A","explanation":""}]，不要編造教材沒有的資訊。',
    bullets:
      '請輸出 5 條條列筆記並附來源頁碼，格式：{"notes":[{"text":"","page":0}]}，保持精簡且引用教材。',
    suggestions:
      '假設讀者是初學者，請給 5 條下一步學習建議並附來源頁碼，格式：{"next_steps":[{"advice":"","page":0}]}。',
    table:
      '請以表格輸出關鍵資訊，格式：{"table":{"headers":["欄位1","欄位2","欄位3"],"rows":[["值11","值12","值13"]],"source":{"title":"","page":0}}} 內容僅能引用教材。',
    timeline:
      '請整理教材中的事件成時間線，格式：{"timeline":[{"title":"事件","date":"YYYY-MM-DD","detail":"描述","page":0}]}，不要杜撰日期。',
  };

  return (
    <AdminGate>
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                RAG × LINE 管理後台
              </h1>
              <p className="text-gray-400">
                上傳教材、嵌入、測試回覆，並可套用 JSON 模板直接生成結構化輸出。
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={saveToken}
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                儲存 Token
              </button>
            </div>
          </div>
        </div>

        <Tabs
          tabs={[
            {
              id: "config",
              label: "參數設定",
              content: (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <ConfigPanel
                    config={cfg}
                    onConfigChange={setCfg}
                    onSave={saveConfig}
                    loading={savingCfg}
                  />
                </div>
              ),
            },
            {
              id: "upload",
              label: "檔案上傳",
              content: (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <UploadPanel
                    files={files}
                    chunkSize={chunkSize}
                    overlap={overlap}
                    onFilesChange={setFiles}
                    onChunkSizeChange={setChunkSize}
                    onOverlapChange={setOverlap}
                    onUpload={uploadFiles}
                    uploading={uploading}
                    uploadProgress={uploadPct}
                    uploadMessage={uploadMsg}
                    uploadReport={uploadReport}
                  />
                </div>
              ),
            },
            {
              id: "text-upload",
              label: "貼上文字",
              content: (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <TextUploadPanel
                    docText={docText}
                    docSource={docSource}
                    onDocTextChange={setDocText}
                    onDocSourceChange={setDocSource}
                    onUpload={() => uploadDoc(docText, docSource)}
                    loading={pasting}
                  />
                </div>
              ),
            },
            {
              id: "test",
              label: "測試／聊天",
              content: (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <TestPanel
                    question={q}
                    answer={answer}
                    onQuestionChange={setQ}
                    onTest={() => runTest()}
                    onModeChange={(m) => setMode(m)}
                    mode={mode}
                    userId={userId}
                    onUserChange={setUserId}
                    onModeRun={(m) => {
                      const prompt = modeDefaults[m];
                      setMode(m);
                      setQ(prompt);
                      runTest(prompt, m);
                    }}
                    onQuick={(prompt) => {
                      setQ(prompt);
                      const inferMode =
                        prompt.includes("單選") || prompt.includes("選題")
                          ? "quiz"
                        : prompt.includes("條列") || prompt.includes("筆記")
                          ? "bullets"
                        : prompt.includes("建議")
                          ? "suggestions"
                          : prompt.includes("表格")
                          ? "table"
                          : prompt.includes("時間線")
                          ? "timeline"
                          : "summary";
                      setMode(inferMode as any);
                      runTest(prompt, inferMode as any);
                    }}
                    quickPrompts={quickPrompts}
                    structured={structured}
                    messages={messages}
                    loading={testing}
                  />
                </div>
              ),
            },
            {
              id: "data-management",
              label: "資料管理",
              content: (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <DataManagementPanel
                    sources={sources}
                    selectedSource={manageSource}
                    onSourceChange={setManageSource}
                    onLoadSources={loadSources}
                    onDeleteSource={async () => {
                      if (!manageSource)
                        return showToast("請先選擇來源", "warning");
                      if (
                        !confirm(
                          `確定刪除來源 ${manageSource}？（此 namespace 所有向量都會被移除）`
                        )
                      )
                        return;
                      setManaging(true);
                      try {
                        const res = await fetch(
                          `/api/admin/docs?source=${encodeURIComponent(
                            manageSource
                          )}`,
                          { method: "DELETE", headers: { ...auth.headers } }
                        );
                        if (!res.ok)
                          return showToast("刪除失敗", "error");
                        showToast("已刪除", "success");
                        setManageSource("");
                        loadSources();
                      } finally {
                        setManaging(false);
                      }
                    }}
                    onReembedSource={async () => {
                      if (!manageSource)
                        return showToast("請先選擇來源", "warning");
                      setManaging(true);
                      try {
                        const res = await fetch("/api/admin/docs/reembed", {
                          method: "POST",
                          headers: {
                            "content-type": "application/json",
                            ...auth.headers,
                          },
                          body: JSON.stringify({ source: manageSource }),
                        });
                        if (!res.ok)
                          return showToast("重新嵌入失敗", "error");
                        const j = await res.json();
                        showToast(
                          `已重新嵌入 ${j.reembedded || 0} 筆（Pinecone 模式建議改為重新上傳）`,
                          "success"
                        );
                      } finally {
                        setManaging(false);
                      }
                    }}
                    onClearCollection={async () => {
                      if (
                        !confirm(
                          "確定清空所有 namespace？此動作不可復原。"
                        )
                      )
                        return;
                      setManaging(true);
                      try {
                        const res = await fetch("/api/admin/vector/clear", {
                          method: "POST",
                          headers: { ...auth.headers },
                        });
                        if (!res.ok)
                          return showToast("清空失敗", "error");
                        showToast("已清空向量庫", "success");
                        setManageSource("");
                        loadSources();
                      } finally {
                        setManaging(false);
                      }
                    }}
                    loading={loadingSources}
                    managing={managing}
                  />
                </div>
              ),
            },
            {
              id: "logs",
              label: "日誌",
              content: (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <LogsPanel
                    logs={logs}
                    onLoadLogs={loadLogs}
                    loading={loadingLogs}
                  />
                </div>
              ),
            },
            {
              id: "analytics",
              label: "分析",
              content: (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <AnalyticsPanel token={token} />
                </div>
              ),
            },
          ]}
        />
      </div>

      <Overlay
        show={
          uploading ||
          pasting ||
          testing ||
          savingCfg ||
          loadingLogs ||
          managing
        }
        message={
          uploading
            ? uploadPct < 100
              ? "上傳中…"
              : "寫入中…"
            : pasting
            ? "處理中…"
            : testing
            ? "生成中…"
            : savingCfg
            ? "儲存設定…"
            : loadingLogs
            ? "載入日誌…"
            : managing
            ? "處理資料…"
            : "處理中…"
        }
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminGate>
  );
}
