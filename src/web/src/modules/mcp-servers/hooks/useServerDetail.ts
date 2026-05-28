import { App } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { client } from "src/lib/client";
import { AgentHandsError } from "src/lib/http";
import type { McpToolItem, McpToolServerItem } from "src/lib/types";

export function useServerDetail() {
  const { message, modal } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [server, setServer] = useState<McpToolServerItem | null>(null);
  const [tools, setTools] = useState<McpToolItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isBuiltin = server?.type === "builtin";

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [srv, toolsRes] = await Promise.all([client.mcpToolServers.get(id), client.mcpToolServers.listTools(id)]);
      setServer(srv);
      setTools(toolsRes.items);
    } catch {
      message.error("Failed to load MCP server");
      navigate("/mcp-servers");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Toggle tool active/inactive ──────────────────────────────────────────

  const handleToggleTool = async (tool: McpToolItem) => {
    if (!id) return;
    try {
      const updated = await client.mcpToolServers.updateTool(id, tool.id, {
        isActive: !tool.isActive,
      });
      setTools((prev) => prev.map((t) => (t.id === tool.id ? updated : t)));
    } catch (err) {
      if (err instanceof AgentHandsError) message.error(err.message);
    }
  };

  // ── Create tool (name only) then navigate to editor ─────────────────────

  const handleCreateTool = async (name: string) => {
    if (!id) return;
    try {
      const tool = await client.mcpToolServers.createTool(id, {
        name,
        description: "",
        code: "",
      });
      message.success(`Tool "${tool.name}" created`);
      navigate(`/mcp-servers/${id}/tools/${tool.id}`);
    } catch (err) {
      if (err instanceof AgentHandsError) message.error(err.message);
      else message.error("Failed to create tool");
    }
  };

  // ── Edit server ──────────────────────────────────────────────────────────

  const handleEditServer = async (data: { name?: string; description?: string }) => {
    if (!id) return;
    try {
      const updated = await client.mcpToolServers.update(id, data);
      setServer(updated);
      message.success("Server updated");
    } catch (err) {
      if (err instanceof AgentHandsError) message.error(err.message);
    }
  };

  // ── Delete server ────────────────────────────────────────────────────────

  const handleDeleteServer = () => {
    if (!id || isBuiltin) return;
    modal.confirm({
      title: "Delete MCP Server",
      content: `Deleting "${server?.name}" will delete all ${tools.length} tool(s) belonging to this server. This action cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await client.mcpToolServers.delete(id);
          message.success("Server deleted");
          navigate("/mcp-servers");
        } catch (err) {
          if (err instanceof AgentHandsError) message.error(err.message);
        }
      },
    });
  };

  // ── Delete tool ──────────────────────────────────────────────────────────

  const handleDeleteTool = (tool: McpToolItem) => {
    if (!id) return;
    modal.confirm({
      title: "Delete Tool",
      content: `Delete tool "${tool.name}"? This action cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await client.mcpToolServers.deleteTool(id, tool.id);
          setTools((prev) => prev.filter((t) => t.id !== tool.id));
          message.success(`Tool "${tool.name}" deleted`);
        } catch (err) {
          if (err instanceof AgentHandsError) message.error(err.message);
        }
      },
    });
  };

  return {
    id,
    server,
    tools,
    loading,
    isBuiltin,
    handleToggleTool,
    handleCreateTool,
    handleEditServer,
    handleDeleteServer,
    handleDeleteTool,
    navigate,
  };
}
