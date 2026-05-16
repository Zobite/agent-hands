import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input, message, Spin } from "antd";
import {
  ArrowLeft,
  Save,
  Play,
  Wrench,
  ScrollText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type {
  McpToolTestResult,
  McpToolLog,
} from "src/lib/types";
import { MoroError } from "src/lib/http";
import { client } from "src/lib/client";

const DEFAULT_CODE = `def execute(params, context):
    """
    params: dict — input parameters from AI agent (matches input schema)
    context: object — SDK for accessing internal services
      - context.variables.get(key) / set(key, value)
      - context.tables.query(table_id, filters)
      - context.files.get_url(file_id)
      - context.http.get(url) / post(url, data)
    """
    # Your tool logic here
    return {
        "result": "Hello from tool!"
    }
`;

const DEFAULT_INPUT_SCHEMA = `{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "The search query"
    }
  },
  "required": ["query"]
}`;

// ══════════════════════════════════════════════════════════════════════════════
//  MCP TOOL EDITOR PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function McpToolEditorPage() {
  const { id: serverId, toolId } = useParams<{
    id: string;
    toolId?: string;
  }>();
  const navigate = useNavigate();
  const isNew = !toolId || toolId === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<McpToolTestResult | null>(null);
  const [rightPanel, setRightPanel] = useState<"test" | "logs">("test");
  const [logs, setLogs] = useState<McpToolLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [inputSchema, setInputSchema] = useState(DEFAULT_INPUT_SCHEMA);
  const [testParams, setTestParams] = useState("{}");

  const fetchTool = useCallback(async () => {
    if (isNew || !serverId || !toolId) return;
    setLoading(true);
    try {
      const tool = await client.mcpToolServers.getTool(serverId, toolId);
      form.setFieldsValue({
        name: tool.name,
        description: tool.description,
      });
      setCode(tool.code);
      setInputSchema(tool.inputSchema || DEFAULT_INPUT_SCHEMA);
    } catch {
      message.error("Failed to load tool");
      navigate(`/mcp-servers/${serverId}`);
    } finally {
      setLoading(false);
    }
  }, [isNew, serverId, toolId, form, navigate]);

  useEffect(() => {
    fetchTool();
  }, [fetchTool]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (isNew) {
        const tool = await client.mcpToolServers.createTool(serverId!, {
          name: values.name,
          description: values.description,
          inputSchema,
          code,
        });
        message.success(`Tool "${tool!.name}" created`);
        navigate(`/mcp-servers/${serverId}/tools/${tool!.id}`, {
          replace: true,
        });
      } else {
        await client.mcpToolServers.updateTool(serverId!, toolId!, {
          name: values.name,
          description: values.description,
          inputSchema,
          code,
        });
        message.success("Tool saved");
      }
    } catch (err) {
      if (err instanceof MoroError) {
        message.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!serverId || !toolId || isNew) {
      message.warning("Save the tool first before testing");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const params = JSON.parse(testParams);
      const result = await client.mcpToolServers.testTool(
        serverId,
        toolId,
        params,
      );
      setTestResult(result);
    } catch (err) {
      if (err instanceof MoroError) {
        message.error(err.message);
      } else if (err instanceof SyntaxError) {
        message.error("Invalid JSON in test params");
      }
    } finally {
      setTesting(false);
    }
  };

  const fetchLogs = useCallback(async () => {
    if (!serverId || !toolId || isNew) return;
    setLogsLoading(true);
    try {
      const result = await client.mcpToolServers.listToolLogs(serverId, toolId);
      setLogs(result.items);
    } catch {
      message.error("Failed to load logs");
    } finally {
      setLogsLoading(false);
    }
  }, [serverId, toolId, isNew]);

  useEffect(() => {
    if (rightPanel === "logs" && !isNew) {
      fetchLogs();
    }
  }, [rightPanel, fetchLogs, isNew]);

  // Keyboard shortcut: Cmd/Ctrl + S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-canvas">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-canvas">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 shrink-0 border-b border-hairline flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/mcp-servers/${serverId}`)}
            className="flex items-center gap-1.5 text-muted text-[13px] bg-transparent border-none cursor-pointer hover:text-ink transition-colors p-0"
          >
            <ArrowLeft size={14} />
            <span className="font-mono text-[11px] uppercase tracking-wide">
              Back
            </span>
          </button>
          <div className="w-px h-5 bg-hairline" />
          <div className="flex items-center gap-2">
            <Wrench size={14} className="text-muted" />
            <span className="font-mono text-[14px] text-ink font-medium">
              {isNew ? "New Tool" : "Edit Tool"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 h-[32px] px-3 rounded-md bg-transparent border border-hairline text-muted font-medium text-[12px] hover:border-hairline-strong cursor-pointer transition-colors disabled:opacity-50"
            >
              <Play size={12} />
              {testing ? "Running..." : "Test"}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 h-[36px] px-4 rounded-md bg-ink text-canvas font-medium text-[13px] hover:bg-opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Form + Code */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="px-8 py-6">
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              className="max-w-[600px]"
            >
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="name"
                  label={
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                      Tool Name
                    </span>
                  }
                  rules={[
                    { required: true, message: "Tool name is required" },
                    {
                      pattern: /^[a-z0-9_]+$/,
                      message: "snake_case only (a-z, 0-9, _)",
                    },
                    { max: 100, message: "Max 100 characters" },
                  ]}
                >
                  <Input
                    placeholder="e.g. get_weather"
                    className="font-mono"
                    disabled={!isNew}
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="description"
                label={
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    Description
                  </span>
                }
                rules={[
                  { required: true, message: "Description is required" },
                ]}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Describe what this tool does — AI agents use this to decide when to call it"
                  showCount
                  maxLength={2000}
                />
              </Form.Item>
            </Form>
          </div>

          {/* Input Schema */}
          <div className="px-8 pb-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2">
              Input Schema (JSON Schema)
            </div>
            <textarea
              value={inputSchema}
              onChange={(e) => setInputSchema(e.target.value)}
              className="w-full h-[140px] p-4 rounded-md border border-hairline bg-canvas-soft font-mono text-[13px] text-ink resize-y focus:outline-none focus:border-hairline-strong transition-colors"
              spellCheck={false}
            />
          </div>

          {/* Python Code */}
          <div className="px-8 pb-8 flex-1">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2">
              Python Code
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full min-h-[300px] h-[calc(100%-32px)] p-4 rounded-md border border-hairline bg-canvas-soft font-mono text-[13px] text-ink resize-y focus:outline-none focus:border-hairline-strong transition-colors leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right panel: Test / Logs */}
        <div className="w-[360px] shrink-0 border-l border-hairline flex flex-col bg-surface-card overflow-y-auto">
          {/* Tab switcher */}
          <div className="px-5 py-3 border-b border-hairline flex items-center gap-1">
            <button
              onClick={() => setRightPanel("test")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono font-medium cursor-pointer border-none transition-colors ${
                rightPanel === "test"
                  ? "bg-ink text-canvas"
                  : "bg-transparent text-muted hover:text-ink"
              }`}
            >
              <Play size={11} />
              Test
            </button>
            <button
              onClick={() => setRightPanel("logs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono font-medium cursor-pointer border-none transition-colors ${
                rightPanel === "logs"
                  ? "bg-ink text-canvas"
                  : "bg-transparent text-muted hover:text-ink"
              }`}
            >
              <ScrollText size={11} />
              Logs
            </button>
          </div>

          {rightPanel === "test" && (
            <div className="px-5 py-4 flex-1 flex flex-col gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-soft mb-2">
                  Input Params (JSON)
                </div>
                <textarea
                  value={testParams}
                  onChange={(e) => setTestParams(e.target.value)}
                  className="w-full h-[120px] p-3 rounded-md border border-hairline bg-canvas font-mono text-[12px] text-ink resize-y focus:outline-none focus:border-hairline-strong transition-colors"
                  spellCheck={false}
                />
              </div>

              <button
                onClick={handleTest}
                disabled={testing || isNew}
                className="flex items-center justify-center gap-2 h-[36px] w-full rounded-md bg-ink text-canvas font-medium text-[13px] hover:bg-opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-50"
              >
                <Play size={14} />
                {testing ? "Running..." : "Run Test"}
              </button>

              {isNew && (
                <p className="text-[12px] text-muted-soft text-center">
                  Save the tool first to enable testing
                </p>
              )}

              {testResult && (
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-mono text-[10px] uppercase tracking-wider ${
                          testResult.success ? "text-[#1f8a65]" : "text-[#cf2d56]"
                        }`}
                      >
                        {testResult.success ? "SUCCESS" : "ERROR"}
                      </span>
                      <span className="font-mono text-[10px] text-muted-soft">
                        {testResult.executionTimeMs}ms
                      </span>
                    </div>
                    <pre className="m-0 p-3 rounded-md bg-canvas border border-hairline font-mono text-[11px] text-ink whitespace-pre-wrap break-all max-h-[200px] overflow-auto">
                      {JSON.stringify(testResult.result, null, 2)}
                    </pre>
                  </div>

                  {testResult.stdout && (
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-soft mb-1">
                        Stdout
                      </div>
                      <pre className="m-0 p-3 rounded-md bg-canvas border border-hairline font-mono text-[11px] text-muted whitespace-pre-wrap max-h-[120px] overflow-auto">
                        {testResult.stdout}
                      </pre>
                    </div>
                  )}

                  {testResult.stderr && (
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#cf2d56] mb-1">
                        Stderr
                      </div>
                      <pre className="m-0 p-3 rounded-md bg-canvas border border-[#cf2d56]/20 font-mono text-[11px] text-[#cf2d56] whitespace-pre-wrap max-h-[120px] overflow-auto">
                        {testResult.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {rightPanel === "logs" && (
            <div className="flex-1 flex flex-col">
              <div className="px-5 py-3 border-b border-hairline flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">
                  Execution History
                </span>
                <button
                  onClick={fetchLogs}
                  disabled={logsLoading}
                  className="font-mono text-[10px] uppercase tracking-wider text-muted hover:text-ink cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
                >
                  {logsLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {logsLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Spin size="small" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="font-mono text-[11px] text-muted-soft">No logs yet</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-hairline-soft">
                  {logs.map((log) => (
                    <div key={log.id}>
                      <button
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-canvas transition-colors cursor-pointer bg-transparent border-none"
                      >
                        {log.status === "success" ? (
                          <CheckCircle2 size={13} className="text-[#1f8a65] shrink-0" />
                        ) : (
                          <XCircle size={13} className="text-[#cf2d56] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-ink">
                              {log.executionTimeMs}ms
                            </span>
                            <span className="font-mono text-[10px] text-muted-soft">
                              {log.callerType === "test_panel" ? "Test" : "Agent"}
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-muted-soft">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </button>

                      {expandedLogId === log.id && (
                        <div className="px-5 pb-4 flex flex-col gap-2">
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-soft mb-1">Input</div>
                            <pre className="m-0 p-2 rounded bg-canvas border border-hairline font-mono text-[10px] text-ink whitespace-pre-wrap break-all max-h-[120px] overflow-auto">
                              {JSON.stringify(log.inputParams, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <div className={`font-mono text-[10px] uppercase tracking-wider mb-1 ${log.status === "error" ? "text-[#cf2d56]" : "text-muted-soft"}`}>
                              {log.status === "error" ? "Error" : "Output"}
                            </div>
                            <pre className={`m-0 p-2 rounded border font-mono text-[10px] whitespace-pre-wrap break-all max-h-[120px] overflow-auto ${log.status === "error" ? "bg-canvas border-[#cf2d56]/20 text-[#cf2d56]" : "bg-canvas border-hairline text-ink"}`}>
                              {log.status === "error"
                                ? (log.errorMessage ?? "Unknown error")
                                : JSON.stringify(log.outputResult, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
