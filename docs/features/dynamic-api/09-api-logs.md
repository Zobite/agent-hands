<feature>
  <meta>
    <id>dynamic_api_logs</id>
    <title>API logs & monitoring</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p2</priority>
  </meta>

  <overview>
    Log all requests to dynamic endpoints: timestamp, method, path, status
    code, execution time, execution mode (fast/isolated), captured console
    output, error (if any). Displayed in UI for debugging and monitoring.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>view API endpoint logs for debugging</action>
      <benefit>identify and fix errors quickly</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] "Logs" tab in API editor page displays request logs.
- [x] Retention: keep logs for 7 days (configurable), auto-cleanup.

## Web
- [x] Each log entry: timestamp, method, path, status code, execution time (ms), execution mode (fast/isolated), IP.
- [x] Click log entry → expand: request headers/body, response body, captured console output, error stacktrace (if any).
- [x] Filter: by status (success/error), date range (startDate/endDate epoch ms).
- [x] Auto-refresh or real-time (WebSocket).
