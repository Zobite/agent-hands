<feature>
  <meta>
    <id>user_session_management</id>
    <title>Session management</title>
    <group>Users</group>
    <status>done</status>
    <priority>p2</priority>
  </meta>

  <overview>
    Login session management: JWT token with refresh mechanism, auto-logout
    on expiration, and WebSocket authentication.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>log in and work continuously</action>
      <benefit>not unexpectedly logged out thanks to automatic token refresh</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] JWT access token TTL 1h, refresh token TTL 7d
- [x] POST /api/auth/refresh → rotate refresh token
- [x] WebSocket connection sends token during handshake, server validates
- [x] When admin deletes user or resets password → all tokens are revoked

## Web
- [x] Client automatically calls refresh endpoint when access token is about to expire
- [x] Both access + refresh expired → redirect to login page
