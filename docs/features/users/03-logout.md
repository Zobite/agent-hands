<feature>
  <meta>
    <id>user_logout</id>
    <title>Logout</title>
    <group>Users</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User logs out of the system. Token/session is cleared, user returns to login page.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click Logout button on navigation/header</action>
      <benefit>safely end session, protect account</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Server invalidate session/token (if using token blacklist)

## Web
- [x] Logout button displayed on header/user menu when logged in
- [x] Click Logout → clear token/cookie from client
- [x] Redirect to login page after logout
- [x] After logout, accessing auth-required routes → redirect to login
