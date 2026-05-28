<feature>
  <meta>
    <id>user_login</id>
    <title>Login</title>
    <group>Users</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User logs in with username/email and password. System issues a JWT token
    for authenticating subsequent requests. All routes (except public routes)
    require login.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>enter username/email and password, click Login</action>
      <benefit>access the system and use features</benefit>
    </story>
    <story id="US-02">
      <actor>Unauthenticated user</actor>
      <action>access any page</action>
      <benefit>automatically redirected to login page</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] POST /api/auth/login { username, password } → return JWT token
- [x] Token has expiration (default 24h), expired → redirect to login
- [x] All API routes (except /api/auth/*) require valid token, return 401 if missing/expired
- [x] Return specific errors: wrong password, user not found

## Web
- [x] Login page: form Username/Email + Password
- [x] Click Login → validate input, call API POST /api/auth/login
- [x] Success → save token, redirect to main page
- [x] Failure → display specific error message
- [x] Unauthenticated user → redirect to login
