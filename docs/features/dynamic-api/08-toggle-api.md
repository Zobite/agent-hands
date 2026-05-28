<feature>
  <meta>
    <id>dynamic_api_toggle</id>
    <title>Toggle active/inactive</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    User enables/disables an API endpoint without deleting it. Inactive
    endpoints return 404 when called, but code, dependencies, and config
    are preserved. Warm instance is evicted when toggled off.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>temporarily toggle off an API endpoint</action>
      <benefit>disable endpoint without losing code, can re-enable anytime</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Toggle switch on API row in management page.
- [x] Toggle on → isActive = true, endpoint works again immediately (warms on first request).
- [x] API: PATCH /api/dynamic-apis/:id { isActive: boolean }.

## Web
- [x] Toggle off → isActive = false, evict warm instance, requests to path return 404.
- [x] Badge/icon displays active/inactive status.
