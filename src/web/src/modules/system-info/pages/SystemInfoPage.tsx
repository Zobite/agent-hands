import { Skeleton, Switch, Tooltip } from "antd";
import { Box, Cpu, HardDrive, MemoryStick, Monitor, RefreshCw, Server } from "lucide-react";
import { formatBytes, formatPlatform, formatUptime } from "../common/format";
import { InfoCard } from "../components/InfoCard";
import { UsageGaugeCard } from "../components/UsageGaugeCard";
import { useSystemInfo } from "../hooks/useSystemInfo";

export default function SystemInfoPage() {
  const { data, loading, autoRefresh, setAutoRefresh, refresh } = useSystemInfo();

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-8 md:py-12 animate-fade-in-up">
      {/* Header */}
      <div className="mb-10 border-b border-hairline pb-8">
        <div className="flex items-center gap-2 mb-3">
          <Monitor size={18} className="text-muted" />
          <span className="font-mono text-[13px] text-muted tracking-wide uppercase">System Info</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[28px] md:text-[36px] font-normal tracking-[-0.72px] text-ink leading-tight">System Monitor</h2>
          <div className="flex items-center gap-4">
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-soft">Auto-refresh</span>
              <Switch size="small" checked={autoRefresh} onChange={setAutoRefresh} />
            </div>
            {/* Manual refresh */}
            <Tooltip title="Refresh now">
              <button
                onClick={refresh}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-canvas border border-hairline-soft text-muted hover:text-ink hover:border-hairline-strong transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </Tooltip>
            {/* Live indicator */}
            {autoRefresh && (
              <div className="font-mono text-[13px] text-muted-soft flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Live
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton.Node key={i} active style={{ width: "100%", height: 200, borderRadius: 12 }} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton.Node key={i} active style={{ width: "100%", height: 200, borderRadius: 12 }} />
            ))}
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Gauge Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UsageGaugeCard
              title="CPU"
              icon={<Cpu size={16} />}
              usage={data.cpu.usage}
              subtitle={data.cpu.model}
              details={[
                { label: "Cores", value: String(data.cpu.cores) },
                { label: "Usage", value: `${data.cpu.usage}%` },
              ]}
            />
            <UsageGaugeCard
              title="Memory"
              icon={<MemoryStick size={16} />}
              usage={data.memory.usage}
              subtitle={`${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}`}
              details={[
                { label: "Total", value: formatBytes(data.memory.total) },
                { label: "Used", value: formatBytes(data.memory.used) },
                { label: "Free", value: formatBytes(data.memory.free) },
              ]}
            />
            <UsageGaugeCard
              title="Disk"
              icon={<HardDrive size={16} />}
              usage={data.disk.usage}
              subtitle={`Mount: ${data.disk.mount}`}
              details={[
                { label: "Total", value: formatBytes(data.disk.total) },
                { label: "Used", value: formatBytes(data.disk.used) },
                { label: "Free", value: formatBytes(data.disk.free) },
              ]}
            />
          </div>

          {/* Info Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              title="Process"
              icon={<Box size={16} />}
              rows={[
                { label: "PID", value: String(data.process.pid) },
                { label: "Uptime", value: formatUptime(data.process.uptime) },
                { label: "RAM", value: formatBytes(data.process.memoryRss) },
                { label: "Heap Used", value: formatBytes(data.process.memoryHeap) },
                { label: "Bun Version", value: data.process.bunVersion },
                { label: "Node Version", value: data.process.nodeVersion },
              ]}
            />
            <InfoCard
              title="Operating System"
              icon={<Server size={16} />}
              rows={[
                { label: "Platform", value: formatPlatform(data.os.platform), mono: false },
                { label: "Architecture", value: data.os.arch },
                { label: "Hostname", value: data.os.hostname },
                { label: "Kernel", value: data.os.release },
                { label: "System Uptime", value: formatUptime(data.os.uptime) },
              ]}
            />
          </div>

          {/* Timestamp footer */}
          <div className="text-right text-[11px] font-mono text-muted-soft">Last updated: {new Date(data.timestamp).toLocaleTimeString()}</div>
        </div>
      ) : null}
    </div>
  );
}
