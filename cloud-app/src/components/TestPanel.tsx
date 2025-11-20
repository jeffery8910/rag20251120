"use client";
import Button from "./Button";

interface TestPanelProps {
  question: string;
  answer: string;
  onQuestionChange: (question: string) => void;
  onTest: () => Promise<void>;
  onQuick?: (question: string) => void;
  quickPrompts?: { label: string; question: string }[];
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  structured?: any;
  mode: "summary" | "quiz" | "bullets" | "suggestions" | "table" | "timeline";
  onModeChange: (m: "summary" | "quiz" | "bullets" | "suggestions" | "table" | "timeline") => void;
  onModeRun: (m: "summary" | "quiz" | "bullets" | "suggestions" | "table" | "timeline") => void;
  userId: string;
  onUserChange: (id: string) => void;
  loading: boolean;
}

export default function TestPanel({
  question,
  answer,
  onQuestionChange,
  onTest,
  onQuick,
  quickPrompts = [],
  messages = [],
  structured,
  mode,
  onModeChange,
  onModeRun,
  userId,
  onUserChange,
  loading,
}: TestPanelProps) {
  let jsonPretty = "";
  try {
    jsonPretty = JSON.stringify(JSON.parse(answer), null, 2);
  } catch {
    jsonPretty = "";
  }

  return (
    <div className="space-y-6">
      {messages.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap max-w-[80%] ${
                  m.role === "user"
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-100 border border-gray-700"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          測試問題
        </label>
        <div className="flex flex-wrap gap-3 items-center mb-2">
          <label className="text-xs text-gray-400">輸出樣式</label>
          <select
            value={mode}
            onChange={(e) =>
              onModeChange(
                e.target.value as
                  | "summary"
                  | "quiz"
                  | "bullets"
                  | "suggestions"
                  | "table"
                  | "timeline"
              )
            }
            className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-sm text-gray-100"
          >
            <option value="summary">摘要</option>
            <option value="quiz">單選題</option>
            <option value="bullets">條列筆記</option>
            <option value="suggestions">學習建議</option>
            <option value="table">表格</option>
            <option value="timeline">時間線</option>
          </select>
          <label className="text-xs text-gray-400 ml-2">身分</label>
          <select
            value={userId}
            onChange={(e) => onUserChange(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-sm text-gray-100"
          >
            <option value="teacher">teacher</option>
            <option value="student-a">student-a</option>
            <option value="student-b">student-b</option>
          </select>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => onModeRun("summary")}>
              生成摘要
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onModeRun("quiz")}>
              生成單選題
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onModeRun("bullets")}>
              生成條列
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onModeRun("suggestions")}>
              生成建議
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onModeRun("table")}>
              生成表格
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onModeRun("timeline")}>
              生成時間線
            </Button>
          </div>
        </div>
        <input
          type="text"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="請輸入一個測試問題..."
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {quickPrompts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {quickPrompts.map((qp, idx) => (
              <Button
                key={idx}
                variant="secondary"
                size="sm"
                onClick={() => onQuick?.(qp.question)}
              >
                {qp.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={onTest}
          loading={loading}
          disabled={loading || !question.trim()}
        >
          {loading ? "生成中…" : "送出測試"}
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          回覆
        </label>
        <textarea
          rows={6}
          value={answer}
          readOnly
          placeholder="測試結果將顯示在這裡..."
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 resize-none"
        />
        {structured && (
          <div className="mt-4 space-y-3">
            {structured.summary && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <h4 className="text-emerald-300 font-semibold mb-2">摘要</h4>
                <p className="text-gray-100 leading-relaxed">{structured.summary}</p>
                {Array.isArray(structured.bullets) && (
                  <ul className="list-disc list-inside text-gray-200 mt-2 space-y-1">
                    {structured.bullets.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {Array.isArray(structured.quizzes) && structured.quizzes.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-3">
                <h4 className="text-emerald-300 font-semibold">單選題</h4>
                {structured.quizzes.map((q: any, idx: number) => (
                  <div key={idx} className="border border-gray-700 rounded-md p-2">
                    <p className="text-gray-100 font-semibold">{q.question}</p>
                    <ul className="list-disc list-inside text-gray-200 mt-1">
                      {(q.options || []).map((o: string, i: number) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                    <p className="text-sm text-amber-300 mt-1">答案：{q.answer}</p>
                    {q.explanation && (
                      <p className="text-sm text-gray-300">理由：{q.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {Array.isArray(structured.notes) && structured.notes.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <h4 className="text-emerald-300 font-semibold mb-2">條列筆記</h4>
                <ul className="list-disc list-inside text-gray-200 space-y-1">
                  {structured.notes.map((n: any, i: number) => (
                    <li key={i}>{n.text}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(structured.next_steps) && structured.next_steps.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <h4 className="text-emerald-300 font-semibold mb-2">學習建議</h4>
                <ol className="list-decimal list-inside text-gray-200 space-y-1">
                  {structured.next_steps.map((n: any, i: number) => (
                    <li key={i}>{n.advice}</li>
                  ))}
                </ol>
              </div>
            )}
            {structured.table && structured.table.headers && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 overflow-x-auto">
                <h4 className="text-emerald-300 font-semibold mb-2">表格</h4>
                <table className="min-w-full text-sm text-left text-gray-200">
                  <thead className="border-b border-gray-700">
                    <tr>
                      {structured.table.headers.map((h: string, i: number) => (
                        <th key={i} className="px-2 py-1 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(structured.table.rows || []).map((row: string[], rIdx: number) => (
                      <tr key={rIdx} className="border-b border-gray-800">
                        {row.map((cell: string, cIdx: number) => (
                          <td key={cIdx} className="px-2 py-1">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {Array.isArray(structured.timeline) && structured.timeline.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-3">
                <h4 className="text-emerald-300 font-semibold">時間線</h4>
                {structured.timeline.map((t: any, i: number) => (
                  <div key={i} className="border border-gray-700 rounded-md p-2">
                    <div className="text-sm text-gray-400">{t.date}</div>
                    <div className="text-gray-100 font-semibold">{t.title}</div>
                    {t.detail && <p className="text-gray-200 text-sm mt-1">{t.detail}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {jsonPretty && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-emerald-300">
              以 JSON 檢視
            </summary>
            <pre className="mt-2 text-xs bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-x-auto">
              {jsonPretty}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
