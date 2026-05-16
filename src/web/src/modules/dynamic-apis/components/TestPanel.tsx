import { Input, Tooltip, message } from "antd";
import { Copy, History, Loader2, Plus, Send, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface TestResult {
  status: number;
  body: unknown;
  consoleLogs?: string[];
  executionTimeMs?: number;
  error?: string;
  time?: number;
}

interface HistoryEntry {
  id: number;
  method: string;
  path: string;
  timestamp: number;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string;
  result: TestResult;
}

interface TestPanelProps {
  method: string;
  path: string;
  testBody: string;
  onTestBodyChange: (value: string) => void;
  testing: boolean;
  testResult: TestResult | null;
  onSend: (params: Record<string, string>, query: Record<string, string>, headers: Record<string, string>) => void;
  /** Base URL for building cURL command (e.g. http://localhost:18080) */
  baseUrl?: string;
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return "#1f8a65";
  if (status >= 400) return "#cf2d56";
  return "#f59e0b";
}

function getStatusBg(status: number): string {
  if (status >= 200 && status < 300) return "rgba(31,138,101,0.1)";
  if (status >= 400) return "rgba(207,45,86,0.1)";
  return "rgba(245,158,11,0.1)";
}

function getStatusLabel(status: number): string {
  if (status >= 200 && status < 300) return "OK";
  if (status === 400) return "Bad Request";
  if (status === 401) return "Unauthorized";
  if (status === 403) return "Forbidden";
  if (status === 404) return "Not Found";
  if (status === 500) return "Internal Error";
  if (status === 0) return "Network Error";
  return `Error`;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "#1f8a65",
  POST: "#f59e0b",
  PUT: "#3b82f6",
  PATCH: "#8b5cf6",
  DELETE: "#cf2d56",
};

// ── Key-Value Editor ────────────────────────────────────────────────────────

function KeyValueEditor({
  entries,
  onChange,
  placeholderKey,
  placeholderValue,
  readOnlyKeys,
}: {
  entries: [string, string][];
  onChange: (entries: [string, string][]) => void;
  placeholderKey?: string;
  placeholderValue?: string;
  readOnlyKeys?: boolean;
}) {
  const addEntry = () => {
    onChange([...entries, ["", ""]]);
  };

  const updateEntry = (index: number, key: string, value: string) => {
    const next = [...entries];
    next[index] = [key, value];
    onChange(next);
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1">
      {/* Table header */}
      {entries.length > 0 && (
        <div className="flex gap-2 items-center px-1 mb-1">
          <span className="font-mono text-[10px] text-muted-soft uppercase tracking-wider" style={{ flex: 1 }}>
            Key
          </span>
          <span className="font-mono text-[10px] text-muted-soft uppercase tracking-wider" style={{ flex: 1 }}>
            Value
          </span>
          <span className="w-6" />
        </div>
      )}

      {entries.map(([key, value], i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            value={key}
            onChange={(e) => updateEntry(i, e.target.value, value)}
            placeholder={placeholderKey ?? "key"}
            size="small"
            className="font-mono text-[12px]"
            style={{ flex: 1 }}
            readOnly={readOnlyKeys}
            disabled={readOnlyKeys}
          />
          <Input
            value={value}
            onChange={(e) => updateEntry(i, key, e.target.value)}
            placeholder={placeholderValue ?? "value"}
            size="small"
            className="font-mono text-[12px]"
            style={{ flex: 1 }}
          />
          {!readOnlyKeys ? (
            <button
              onClick={() => removeEntry(i)}
              className="shrink-0 inline-flex items-center justify-center w-6 h-6 bg-transparent border-none text-muted-soft hover:text-red-400 cursor-pointer p-0 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          ) : (
            <span className="w-6" />
          )}
        </div>
      ))}

      {!readOnlyKeys && (
        <button
          onClick={addEntry}
          className="flex items-center gap-1.5 font-mono text-[11px] text-muted-soft hover:text-ink bg-transparent border border-dashed border-hairline hover:border-hairline-strong rounded-md px-2.5 py-1.5 cursor-pointer transition-colors mt-1.5"
        >
          <Plus size={11} /> Add Row
        </button>
      )}
    </div>
  );
}

// ── Detect path params from path pattern ────────────────────────────────────

function extractPathParams(path: string): string[] {
  const matches = path.match(/:(\w+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}

// ── Build cURL command ──────────────────────────────────────────────────────

function buildCurlCommand(
  method: string,
  baseUrl: string,
  path: string,
  params: Record<string, string>,
  query: Record<string, string>,
  headers: Record<string, string>,
  body: string,
): string {
  // Replace path params
  let resolvedPath = path;
  for (const [key, val] of Object.entries(params)) {
    resolvedPath = resolvedPath.replace(`:${key}`, val || `:${key}`);
  }

  // Build query string
  const queryParts = Object.entries(query)
    .filter(([k]) => k)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  const queryStr = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  const url = `${baseUrl}/apis${resolvedPath}${queryStr}`;
  const parts = [`curl -X ${method}`, `  '${url}'`];

  // Headers
  for (const [k, v] of Object.entries(headers)) {
    if (k) parts.push(`  -H '${k}: ${v}'`);
  }

  // Body
  if (["POST", "PUT", "PATCH"].includes(method) && body && body !== "{}") {
    parts.push(`  -H 'Content-Type: application/json'`);
    parts.push(`  -d '${body}'`);
  }

  return parts.join(" \\\n");
}

// ── Request Tab Type ────────────────────────────────────────────────────────

type RequestTab = "params" | "headers" | "body";

// ── Response Tab Type ───────────────────────────────────────────────────────

type ResponseTab = "body" | "console" | "error";

// ── Main Component ──────────────────────────────────────────────────────────

const MAX_HISTORY = 10;
let nextHistoryId = 1;

export function TestPanel({ method, path, testBody, onTestBodyChange, testing, testResult, onSend, baseUrl = "" }: TestPanelProps) {
  const showRequestBody = ["POST", "PUT", "PATCH"].includes(method);
  const pathParamNames = useMemo(() => extractPathParams(path), [path]);

  const [paramEntries, setParamEntries] = useState<[string, string][]>(pathParamNames.map((name) => [name, ""]));
  const [queryEntries, setQueryEntries] = useState<[string, string][]>([]);

  // Sync path param fields when the path pattern changes
  useEffect(() => {
    setParamEntries((prev) => {
      const prevMap = Object.fromEntries(prev);
      return pathParamNames.map((name) => [name, prevMap[name] ?? ""]);
    });
  }, [pathParamNames]);
  const [headerEntries, setHeaderEntries] = useState<[string, string][]>([]);

  // Tabs
  const [activeRequestTab, setActiveRequestTab] = useState<RequestTab>(pathParamNames.length > 0 ? "params" : showRequestBody ? "body" : "params");
  const [activeResponseTab, setActiveResponseTab] = useState<ResponseTab>("body");

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSend = useCallback(() => {
    const params = Object.fromEntries(paramEntries.filter(([k]) => k));
    const query = Object.fromEntries(queryEntries.filter(([k]) => k));
    const headers = Object.fromEntries(headerEntries.filter(([k]) => k));
    onSend(params, query, headers);
  }, [paramEntries, queryEntries, headerEntries, onSend]);

  // Save to history when testResult changes
  const lastSavedResultRef = useRef<TestResult | null>(null);
  useEffect(() => {
    if (testResult && testResult !== lastSavedResultRef.current && !testing) {
      lastSavedResultRef.current = testResult;
      const entry: HistoryEntry = {
        id: nextHistoryId++,
        method,
        path,
        timestamp: Date.now(),
        params: Object.fromEntries(paramEntries.filter(([k]) => k)),
        query: Object.fromEntries(queryEntries.filter(([k]) => k)),
        headers: Object.fromEntries(headerEntries.filter(([k]) => k)),
        body: testBody,
        result: testResult,
      };
      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
    }
  }, [testResult, testing, method, path, paramEntries, queryEntries, headerEntries, testBody]);

  const handleCopyCurl = () => {
    const params = Object.fromEntries(paramEntries.filter(([k]) => k));
    const query = Object.fromEntries(queryEntries.filter(([k]) => k));
    const headers = Object.fromEntries(headerEntries.filter(([k]) => k));
    const curl = buildCurlCommand(method, baseUrl, path, params, query, headers, testBody);
    navigator.clipboard.writeText(curl);
    message.success("cURL copied to clipboard");
  };

  const restoreEntry = (entry: HistoryEntry) => {
    setParamEntries(Object.entries(entry.params));
    setQueryEntries(Object.entries(entry.query));
    setHeaderEntries(Object.entries(entry.headers));
    onTestBodyChange(entry.body);
    setShowHistory(false);
  };

  // Count badges
  const paramCount = pathParamNames.length + queryEntries.filter(([k]) => k).length;
  const headerCount = headerEntries.filter(([k]) => k).length;
  const methodColor = METHOD_COLORS[method] ?? "#807d72";

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
      {/* ═══ URL Bar (Postman-style) ═══ */}
      <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-b border-hairline" style={{ background: "var(--color-canvas-soft, #fafaf7)" }}>
        {/* Method badge */}
        <div
          className="shrink-0 font-mono text-[12px] font-bold px-2.5 py-1 rounded-md"
          style={{
            color: methodColor,
            background: `${methodColor}14`,
            border: `1px solid ${methodColor}30`,
            minWidth: 54,
            textAlign: "center",
          }}
        >
          {method}
        </div>

        {/* URL Preview */}
        <div className="flex-1 flex items-center gap-0 bg-surface-card border border-hairline rounded-md overflow-hidden">
          <span className="font-mono text-[11px] text-muted-soft px-2.5 py-1.5 bg-canvas border-r border-hairline shrink-0">{baseUrl}/apis</span>
          <span className="font-mono text-[12px] text-ink px-2.5 py-1.5 truncate flex-1">{path}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Tooltip title="Copy cURL">
            <button
              onClick={handleCopyCurl}
              className="inline-flex items-center justify-center w-[32px] h-[32px] rounded-md bg-transparent border border-hairline text-muted-soft hover:text-ink hover:border-hairline-strong transition-colors cursor-pointer"
            >
              <Copy size={13} />
            </button>
          </Tooltip>
          <Tooltip title={`History (${history.length})`}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`inline-flex items-center justify-center w-[32px] h-[32px] rounded-md border transition-colors cursor-pointer ${
                showHistory
                  ? "bg-[#8b5cf610] text-[#8b5cf6] border-[#8b5cf640]"
                  : "bg-transparent border-hairline text-muted-soft hover:text-ink hover:border-hairline-strong"
              }`}
            >
              <History size={13} />
            </button>
          </Tooltip>
          <button
            onClick={handleSend}
            disabled={testing}
            className="inline-flex items-center gap-2 h-[32px] px-4 rounded-md text-[12px] font-semibold font-mono cursor-pointer border-none transition-all disabled:opacity-50"
            style={{
              background: testing ? "#807d72" : methodColor,
              color: "#fff",
            }}
          >
            {testing ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Running...
              </>
            ) : (
              <>
                <Send size={13} /> Send
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══ History Dropdown ═══ */}
      {showHistory && (
        <div className="shrink-0 border-b border-hairline bg-canvas max-h-[200px] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-2 border-b border-hairline sticky top-0 bg-canvas z-10">
            <span className="font-mono text-[10px] text-muted-soft uppercase tracking-wider">Recent Requests ({history.length})</span>
            <button
              onClick={() => setShowHistory(false)}
              className="text-muted-soft hover:text-ink transition-colors bg-transparent border-none cursor-pointer p-0"
            >
              <X size={12} />
            </button>
          </div>
          {history.length === 0 ? (
            <div className="px-5 py-4 text-center font-mono text-[11px] text-muted-soft">No history yet</div>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => restoreEntry(entry)}
                className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-surface-card transition-colors cursor-pointer bg-transparent border-none text-left"
              >
                <span className="font-mono text-[11px] font-bold shrink-0" style={{ color: getStatusColor(entry.result.status), minWidth: 32 }}>
                  {entry.result.status}
                </span>
                <span className="font-mono text-[10px] font-semibold shrink-0" style={{ color: METHOD_COLORS[entry.method] ?? "#807d72", minWidth: 38 }}>
                  {entry.method}
                </span>
                <span className="font-mono text-[11px] text-ink truncate flex-1">{entry.path}</span>
                <span className="font-mono text-[10px] text-muted-soft shrink-0">{entry.result.executionTimeMs ?? 0}ms</span>
                <span className="font-mono text-[10px] text-muted-soft shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* ═══ Content: Request + Response ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Request Section ── */}
        <div className="shrink-0 border-b border-hairline">
          {/* Request tabs */}
          <div className="flex items-center gap-0 border-b border-hairline bg-canvas">
            {(
              [
                { key: "params" as const, label: "Params", count: paramCount },
                { key: "headers" as const, label: "Headers", count: headerCount },
                ...(showRequestBody ? [{ key: "body" as const, label: "Body", count: 0 }] : []),
              ] as { key: RequestTab; label: string; count: number }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveRequestTab(tab.key)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider border-none cursor-pointer transition-colors bg-transparent ${
                  activeRequestTab === tab.key ? "text-ink font-semibold" : "text-muted-soft hover:text-ink"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="font-mono text-[9px] bg-[#8b5cf620] text-[#8b5cf6] px-1.5 py-0.5 rounded-full font-semibold">{tab.count}</span>
                )}
                {activeRequestTab === tab.key && (
                  <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t-full" style={{ background: methodColor }} />
                )}
              </button>
            ))}
            <div className="flex-1" />
            <span className="font-mono text-[9px] text-muted-soft px-4 uppercase tracking-wider">Request</span>
          </div>

          {/* Request tab content */}
          <div className="overflow-y-auto px-5 py-3" style={{ maxHeight: 220 }}>
            {activeRequestTab === "params" && (
              <div className="space-y-4">
                {/* Path params (auto) */}
                {pathParamNames.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[10px] text-muted-soft uppercase tracking-wider">Path Parameters</span>
                      <span className="font-mono text-[9px] text-[#8b5cf6] bg-[#8b5cf620] px-1.5 py-0.5 rounded">auto-detected</span>
                    </div>
                    <KeyValueEditor entries={paramEntries} onChange={setParamEntries} placeholderKey="param" placeholderValue="value" readOnlyKeys />
                  </div>
                )}

                {/* Query params */}
                <div>
                  <div className="font-mono text-[10px] text-muted-soft uppercase tracking-wider mb-2">Query Parameters</div>
                  <KeyValueEditor entries={queryEntries} onChange={setQueryEntries} placeholderKey="key" placeholderValue="value" />
                </div>
              </div>
            )}

            {activeRequestTab === "headers" && (
              <div>
                <div className="font-mono text-[10px] text-muted-soft uppercase tracking-wider mb-2">Request Headers</div>
                <KeyValueEditor entries={headerEntries} onChange={setHeaderEntries} placeholderKey="Header-Name" placeholderValue="Header-Value" />
              </div>
            )}

            {activeRequestTab === "body" && showRequestBody && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] text-muted-soft uppercase tracking-wider">Body</span>
                  <span className="font-mono text-[9px] text-muted-soft bg-surface-strong px-1.5 py-0.5 rounded">JSON</span>
                </div>
                <textarea
                  value={testBody}
                  onChange={(e) => onTestBodyChange(e.target.value)}
                  className="w-full font-mono text-[12px] leading-[1.6] bg-[#1e1e1e] text-[#d4d4d4] p-3 rounded-lg border border-[#333] resize-none outline-none focus:border-[#555] transition-colors"
                  style={{ minHeight: 100 }}
                  spellCheck={false}
                  placeholder='{\n  "key": "value"\n}'
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Response Section ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Response header */}
          {testResult ? (
            <>
              {/* Response status bar */}
              <div className="shrink-0 flex items-center gap-3 px-5 py-2.5 border-b border-hairline bg-canvas">
                {/* Status badge */}
                <div
                  className="flex items-center gap-1.5 font-mono text-[12px] font-bold px-2.5 py-1 rounded-md"
                  style={{
                    color: getStatusColor(testResult.status),
                    background: getStatusBg(testResult.status),
                  }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: getStatusColor(testResult.status) }} />
                  {testResult.status || "ERR"} {getStatusLabel(testResult.status)}
                </div>

                {/* Timing */}
                <span className="font-mono text-[11px] text-muted-soft">{testResult.executionTimeMs ?? testResult.time ?? 0}ms</span>

                <div className="flex-1" />

                {/* Response tabs */}
                {(
                  [
                    { key: "body" as const, label: "Body" },
                    ...(testResult.consoleLogs && testResult.consoleLogs.length > 0
                      ? [{ key: "console" as const, label: `Console (${testResult.consoleLogs.length})` }]
                      : []),
                    ...(testResult.error ? [{ key: "error" as const, label: "Error" }] : []),
                  ] as { key: ResponseTab; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveResponseTab(tab.key)}
                    className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border-none cursor-pointer transition-colors ${
                      activeResponseTab === tab.key ? "bg-surface-strong text-ink font-semibold" : "bg-transparent text-muted-soft hover:text-ink"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Response content */}
              <div className="flex-1 overflow-y-auto px-5 py-3">
                {activeResponseTab === "body" && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        const text = typeof testResult.body === "string" ? testResult.body : JSON.stringify(testResult.body, null, 2);
                        navigator.clipboard.writeText(text);
                        message.success("Response copied");
                      }}
                      className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#2a2a2a] text-[#888] hover:text-[#ccc] border border-[#444] cursor-pointer transition-colors"
                    >
                      <Copy size={11} />
                    </button>
                    <pre className="font-mono text-[12px] leading-[1.6] bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-lg overflow-x-auto whitespace-pre-wrap m-0 border border-[#333]">
                      {typeof testResult.body === "string" ? testResult.body : JSON.stringify(testResult.body, null, 2)}
                    </pre>
                  </div>
                )}

                {activeResponseTab === "console" && testResult.consoleLogs && testResult.consoleLogs.length > 0 && (
                  <pre className="font-mono text-[12px] leading-[1.6] bg-[#1a1a2e] text-[#a5b4fc] p-4 rounded-lg overflow-x-auto whitespace-pre-wrap m-0 border border-[#2a2a4e]">
                    {testResult.consoleLogs.join("\n")}
                  </pre>
                )}

                {activeResponseTab === "error" && testResult.error && (
                  <pre className="font-mono text-[12px] leading-[1.5] bg-[#2a0a0a] text-[#fca5a5] p-4 rounded-lg overflow-x-auto whitespace-pre-wrap m-0 border border-[#4a1a1a]">
                    {testResult.error}
                  </pre>
                )}
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-muted-soft">
              <div className="w-14 h-14 rounded-xl border border-dashed border-hairline-strong flex items-center justify-center mb-4">
                <Send size={20} strokeWidth={1.5} />
              </div>
              <span className="font-mono text-[12px] uppercase tracking-wider font-semibold mb-1">No Response Yet</span>
              <span className="font-mono text-[11px] text-muted-soft">Click Send to test current code (dry-run)</span>
              <span className="font-mono text-[10px] text-muted-soft mt-1 opacity-60">Tests code in editor, not saved version</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
