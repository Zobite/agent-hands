/** Format bytes into human-readable string using decimal (SI) units to match OS display */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1000;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i > 1 ? 1 : 0)} ${sizes[i]}`;
}

/** Format seconds into human-readable uptime string */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

/** Get a color token class based on usage percentage */
export function getUsageColor(usage: number): string {
  if (usage >= 90) return "#cf2d56";    // error red
  if (usage >= 70) return "#c08532";    // warning amber
  return "#1f8a65";                      // success green
}

/** Get a label for the usage level */
export function getUsageLevel(usage: number): "critical" | "warning" | "normal" {
  if (usage >= 90) return "critical";
  if (usage >= 70) return "warning";
  return "normal";
}

/** Map platform string to human-readable name */
export function formatPlatform(platform: string): string {
  const map: Record<string, string> = {
    darwin: "macOS",
    linux: "Linux",
    win32: "Windows",
    freebsd: "FreeBSD",
  };
  return map[platform] ?? platform;
}
